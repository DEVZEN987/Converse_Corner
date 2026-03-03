/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from 'react';
import { getSocket, subscribeToMessages, subscribeToSentConfirmation } from '../lib/socket';
import './ChatWindows.css';

const ChatWindows = ({ currentUser, otherUser }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchMessages = async () => {
    if (!otherUser?._id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:5000/api/messages/${currentUser._id}/${otherUser._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await res.json();
      console.log('Fetched messages:', data); // DEBUG
      setMessages(data);
      scrollToBottom();
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  useEffect(() => {
    if (!otherUser?._id) return;
    
    fetchMessages();
    
    const unsubscribeReceive = subscribeToMessages((newMessage) => {
      console.log('Received message:', newMessage);
      setMessages(prev => {
        if (prev.find(m => m._id === newMessage._id)) return prev;
        return [...prev, newMessage];
      });
      scrollToBottom();
    });
    
    const unsubscribeSent = subscribeToSentConfirmation((sentMessage) => {
      console.log('Message sent:', sentMessage);
      setMessages(prev => {
        if (prev.find(m => m._id === sentMessage._id)) return prev;
        return [...prev, sentMessage];
      });
      scrollToBottom();
    });
    
    return () => {
      unsubscribeReceive();
      unsubscribeSent();
    };
  }, [otherUser?._id, fetchMessages, scrollToBottom]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !otherUser?._id) return;
    
    const socket = getSocket();
    socket.emit('send_message', {
      senderId: currentUser._id,
      receiverId: otherUser._id,
      content: inputMessage.trim()
    });
    
    setInputMessage('');
  };

  // ✅ FIXED: Download PDF with better error handling
  const handleDownload = async (e, attachmentUrl, attachmentName) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent any parent click handlers
    
    console.log('Download clicked!');
    console.log('attachmentUrl:', attachmentUrl);
    console.log('attachmentName:', attachmentName);
    
    if (!attachmentUrl) {
      alert('No file URL found');
      return;
    }
    
    // Extract filename from URL
    let filename = attachmentUrl;
    if (attachmentUrl.includes('/uploads/')) {
      filename = attachmentUrl.split('/uploads/')[1];
    }
    
    console.log('Extracted filename:', filename);
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      return;
    }
    
    try {
      const downloadUrl = `http://localhost:5000/api/messages/download/${filename}`;
      console.log('Fetching from:', downloadUrl);
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          return;
        }
        throw new Error(`Download failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('Blob received, size:', blob.size);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachmentName || filename || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Download successful!');
      
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download file: ' + err.message);
    }
  };

  if (!otherUser) {
    return <div className="chat-windows empty">Select a user to chat</div>;
  }

  return (
    <div className="chat-windows">
      <div className="chat-header">
        <img 
          src={otherUser.avatar || '/default-avatar.png'} 
          alt={otherUser.name} 
          className="chat-avatar"
        />
        <div className="chat-user-info">
          <h3>{otherUser.name}</h3>
          <span className="status">Online</span>
        </div>
      </div>
      
      <div className="messages-container">
        {messages.length === 0 && (
          <p className="no-messages">No messages yet. Start the conversation!</p>
        )}
        
        {messages.map((msg) => {
          // Safely get sender ID (handle both object and string)
          const senderId = msg.senderId?._id || msg.senderId;
          const isSent = senderId === currentUser._id || senderId?.toString() === currentUser._id?.toString();
          
          return (
            <div
              key={msg._id}
              className={`message ${isSent ? 'sent' : 'received'}`}
            >
              {msg.content && (
                <div className="message-content">{msg.content}</div>
              )}
              
              {msg.attachmentUrl && (
                <div className="message-attachment">
                  <button 
                    onClick={(e) => handleDownload(e, msg.attachmentUrl, msg.attachmentName)}
                    className="pdf-download-btn"
                    type="button"
                  >
                    <span className="pdf-icon">📄</span>
                    <div className="pdf-info">
                      <span className="pdf-name">{msg.attachmentName || 'Document.pdf'}</span>
                      <span className="pdf-label">Click to download</span>
                    </div>
                  </button>
                </div>
              )}
              
              <span className="message-time">
                {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="message-input-container" onSubmit={handleSend}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          className="message-input"
        />
        <button type="submit" className="send-btn" disabled={!inputMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWindows;