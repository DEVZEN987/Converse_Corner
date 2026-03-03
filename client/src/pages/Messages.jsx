import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { messagesApi, API_BASE_URL } from '../lib/api';
import './Messages.css';
import ReportModal from '../components/ReportModal';

function formatTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(d) {
  const date = new Date(d);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getInitial(name) {
  return (name || '?').charAt(0).toUpperCase();
}

export default function Messages() {
  const { user } = useAuth();
  const { socket } = useSocket(); // ✅ Use socket from context
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const myId = user?._id || user?.id;

  const loadConversations = useCallback(() => {
    messagesApi.conversations()
      .then(setConversations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const loadMessages = useCallback(() => {
    messagesApi.list()
      .then(setMessages)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => { 
    loadConversations(); 
    loadMessages();
  }, [loadConversations, loadMessages]);

  // Socket.io - Listen for real-time messages
  useEffect(() => {
    if (!socket || !myId) return;

    // Join room
    socket.emit('join', myId);
    console.log('📌 Joined room:', myId);

    const handleReceiveMessage = (newMsg) => {
      console.log('Socket received:', newMsg._id, newMsg.content);
      setMessages((prev) => {
        if (prev.find(m => m._id === newMsg._id)) {
          console.log('Duplicate detected, skipping');
          return prev;
        }
        return [...prev, newMsg];
      });
      loadConversations();
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, myId, loadConversations]);

  useEffect(() => {
    const userId = searchParams.get('userId');
    if (!userId) return;

    const conv = conversations.find((c) => c._id.toString() === userId.toString());

    setSelectedUser({
      _id: userId,
      username: conv?.username || searchParams.get('username') || 'User',
      email: conv?.email,
      avatar: conv?.avatar,
    });
  }, [searchParams, conversations]);

  const filteredConversations = useMemo(() => {
    const base = conversations.filter(c => c._id.toString() !== myId?.toString());
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter((c) => c.username?.toLowerCase().includes(q));
  }, [conversations, search, myId]);

  const threadMessages = useMemo(() => {
    if (!selectedUser) return [];
    const selId = selectedUser._id.toString();
    return messages
      .filter((m) => {
        const s = (m.senderId?._id || m.senderId)?.toString();
        const r = (m.receiverId?._id || m.receiverId)?.toString();
        return (s === myId?.toString() && r === selId) || (r === myId?.toString() && s === selId);
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [messages, selectedUser, myId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [threadMessages.length, scrollToBottom]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || !selectedUser?._id) return;

    if (selectedUser._id.toString() === myId?.toString()) {
      console.warn('handleSend: attempting to message self');
      return;
    }
    
    setError('');
    setSending(true);
    
    try {
      const payload = {
        receiverId: String(selectedUser._id),
        content: content.trim(),
      };
      const skillParam = searchParams.get('skill');
      if (skillParam) {
        payload.skillId = skillParam;
      }
      
      const newMsg = await messagesApi.send(payload);
      
      setMessages((prev) => [...prev, newMsg]);
      setContent('');
      loadConversations();
      
      // ✅ Use socket to send typing indicator
      if (socket) {
        socket.emit('typing', { receiverId: selectedUser._id, isTyping: false });
      }
    } catch (err) {
      setError(err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handlePdfClick = () => {
    if (!selectedUser?._id) return;
    fileInputRef.current?.click();
  };

  const handlePdfChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }
    if (!selectedUser?._id) {
      setError('Select a conversation first');
      return;
    }

    setError('');
    setSending(true);

    try {
      const { url, originalName } = await messagesApi.uploadPdf(file);

      const payload = {
        receiverId: String(selectedUser._id),
        content: originalName,
        attachmentUrl: url,
        attachmentName: originalName,
        attachmentType: 'pdf',
      };

      const skillParam = searchParams.get('skill');
      if (skillParam) {
        payload.skillId = skillParam;
      }

      const newMsg = await messagesApi.send(payload);

      setMessages((prev) => [...prev, newMsg]);
      loadConversations();
    } catch (err) {
      setError(err.message || 'Failed to upload PDF');
    } finally {
      setSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTyping = (e) => {
    setContent(e.target.value);
    
    if (selectedUser && socket) {
      socket.emit('typing', { receiverId: selectedUser._id, isTyping: true });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { receiverId: selectedUser._id, isTyping: false });
      }, 2000);
    }
  };

  const renderTyping = () => {
    if (!isTyping) return null;
    return (
      <div className="tg-typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    );
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation?.();
    if (!window.confirm('Delete this message?')) return;
    try {
      await messagesApi.delete(id);
      setMessages((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedUser({
      _id: conv._id,
      username: conv.username,
      email: conv.email,
      avatar: conv.avatar
    });
    navigate(
      `/messages?userId=${conv._id}&username=${encodeURIComponent(conv.username || '')}`
    );
  };

const handleDownloadPdf = async (filename, name) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('You are not logged in. Please login again.');
      navigate('/login');
      return;
    }
    
    const downloadUrl = `${API_BASE_URL}/api/messages/download/${filename}`;
    
    const response = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      alert('Your session has expired. Please login again.');
      navigate('/login');
      return;
    }
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name || filename.replace(/^\d+-/, '') || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
  } catch (err) {
    console.error('Download error:', err);
    alert('Failed to download file: ' + err.message);
  }
};

  if (loading) return <div className="loading-page"><div className="spinner" /><p>Loading...</p></div>;

  return (
    <div className="tg-messages">
      {error && <div className="tg-alert">{error}</div>}

      <div className="tg-container">
        <aside className="tg-sidebar">
          <div className="tg-sidebar-header">
            <h2>Messages</h2>
            <div className="tg-search">
              <span className="tg-search-icon">{'\uD83D\uDD0D'}</span>
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="tg-chat-list">
            {filteredConversations.length === 0 ? (
              <div className="tg-empty">
                <p>No conversations yet</p>
                <p className="tg-hint">Start messaging from Browse Skills!</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv._id}
                  className={`tg-chat-item ${selectedUser?._id === conv._id ? 'tg-chat-item-active' : ''}`}
                  onClick={() => handleSelectConversation(conv)}
                >
                  <div className="tg-avatar">{getInitial(conv.username)}</div>
                  <div className="tg-chat-info">
                    <div className="tg-chat-name">{conv.username}</div>
                    <div className={`tg-chat-preview ${conv.isFromMe ? 'tg-from-me' : ''}`}>
                      {conv.isFromMe && 'You: '}{conv.lastMessage}
                    </div>
                  </div>
                  <div className="tg-chat-meta">
                    {conv.lastMessageTime && (
                      <div className="tg-chat-time">{formatDate(conv.lastMessageTime)}</div>
                    )}
                    {conv.unreadCount > 0 && (
                      <div className="tg-unread-badge">{conv.unreadCount}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <div className={`tg-chat ${!selectedUser ? 'tg-chat-placeholder' : ''}`}>
          {selectedUser ? (
            <>
              <div className="tg-chat-header">
                <div className="tg-avatar tg-avatar-sm">{getInitial(selectedUser.username)}</div>
                <div className="tg-chat-header-info">
                  <span className="tg-chat-header-name">{selectedUser.username}</span>
                  <span className="tg-chat-header-status">last seen recently</span>
                </div>
                <button 
                  className="tg-report-btn"
                  onClick={() => setShowReportModal(true)}
                  title="Report user"
                >
                  🚩
                </button>
              </div>

              <div className="tg-messages-area">
                {threadMessages.length === 0 ? (
                  <div className="tg-no-messages">
                    <p>No messages yet</p>
                    <p className="tg-hint">Send a message to start the conversation</p>
                  </div>
                ) : (
                  threadMessages.map((m) => {
                    const isMe = (m.senderId?._id || m.senderId)?.toString() === myId?.toString();
                    return (
                      <div key={m._id} className={`tg-bubble-wrapper ${isMe ? 'tg-sent' : 'tg-received'}`}>
                        <div className="tg-bubble">
                          <span className="tg-bubble-text">
                            {m.attachmentType === 'pdf' && m.attachmentUrl ? (
                              <button
                                onClick={() => {
                                  const filename = m.attachmentUrl.replace('/uploads/', '');
                                  const name = m.attachmentName || m.content || 'attachment.pdf';
                                  handleDownloadPdf(filename, name);
                                }}
                                className="tg-bubble-link tg-pdf-btn"
                                style={{ 
                                  background: '#f0f0f0', 
                                  border: '1px solid #ddd', 
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  fontSize: '14px',
                                  color: '#333',
                                  padding: '10px 15px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  maxWidth: '250px',
                                  width: '100%'
                                }}
                              >
                                <span style={{ fontSize: '20px' }}>📄</span>
                                <span style={{ 
                                  flex: 1, 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap',
                                  textAlign: 'left'
                                }}>
                                  {m.attachmentName || m.content || 'attachment.pdf'}
                                </span>
                                <svg 
                                  width="20" 
                                  height="20" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2"
                                  style={{ flexShrink: 0, color: '#666' }}
                                >
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                                  <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round"/>
                                  <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            ) : (
                              m.content
                            )}
                          </span>
                          <span className="tg-bubble-meta">
                            {formatTime(m.createdAt)}
                            {isMe && (
                              <button
                                type="button"
                                className="tg-bubble-delete"
                                onClick={(e) => handleDelete(m._id, e)}
                                title="Delete"
                              >
                                {'\u22EE'}
                              </button>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                {renderTyping()}
                <div ref={messagesEndRef} />
              </div>

              <form className="tg-input-area" onSubmit={handleSend}>
                <button
                  type="button"
                  className="tg-input-btn tg-attach-btn"
                  title="Attach PDF"
                  onClick={handlePdfClick}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                <input
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                  onChange={handlePdfChange}
                  style={{ display: 'none' }}
                />

                <div className="tg-input-wrapper">
                  <input
                    type="text"
                    placeholder="Type a message"
                    value={content}
                    onChange={handleTyping}
                    autoComplete="off"
                    maxLength={2000}
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={sending} 
                  className={`tg-input-btn tg-send-btn ${content.trim() ? 'tg-send-active' : ''}`}
                  title="Send"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <div className="tg-welcome">
              <div className="tg-welcome-icon">{'\u2708'}</div>
              <h3>Converse Corner</h3>
              <p>Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>

      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUser={selectedUser}
          selectedMessages={selectedMessages}
        />
      )}
    </div>
  );
}