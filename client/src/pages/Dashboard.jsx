import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { skillsApi, messagesApi } from '../lib/api';
import { useSocket } from '../context/SocketContext';

function formatDate(d) {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return 'Invalid date';
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  // ✅ FIX: Get socket from the context correctly
  const { socket, isConnected } = useSocket(); 
  
  const [skills, setSkills] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect if no user
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const loadInitialData = useCallback(async () => {
    if (!user) return;
    
    try {
      const [skillsData, messagesData] = await Promise.all([
        skillsApi.my().catch(err => {
          console.warn('Failed to load skills:', err);
          return [];
        }),
        messagesApi.list().catch(err => {
          console.warn('Failed to load messages:', err);
          return [];
        })
      ]);
      
      setSkills(skillsData || []);
      setMessages(messagesData?.slice(0, 5) || []);
      setError('');
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load some data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user, loadInitialData]);

  // ✅ FIX: Socket listener with proper null checks
  useEffect(() => {
    // Check if socket exists and has the 'on' method
    if (!socket || typeof socket.on !== 'function') {
      console.log('Socket not ready yet');
      return;
    }

    console.log('Setting up socket listeners, connected:', isConnected);

    const handleReceive = (newMsg) => {
      if (!newMsg) return;
      console.log('New message received:', newMsg);
      
      setMessages((prev) => {
        if (!prev) return [newMsg];
        const existing = prev.find((m) => m?._id === newMsg._id);
        const next = existing ? prev : [newMsg, ...prev];
        return next.slice(0, 5);
      });
    };

    // Attach the event listener
    socket.on('receive_message', handleReceive);

    // Cleanup
    return () => {
      if (socket && typeof socket.off === 'function') {
        socket.off('receive_message', handleReceive);
      }
    };
  }, [socket, isConnected]); // Add isConnected as dependency

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-slate-500">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
        <p className="text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-slate-500">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
        <p className="text-sm">Loading your dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
        <button 
          onClick={loadInitialData}
          className="ml-4 text-indigo-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Welcome back, <span className="font-medium text-slate-800">{user?.username}</span>
              </p>
            </div>
            {/* ✅ Show socket connection status */}
            <div className={`text-xs px-3 py-1 rounded-full ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isConnected ? '🟢 Live' : '🔴 Connecting...'}
            </div>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Skills card */}
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Your skills</h2>
                <p className="text-xs text-slate-500">
                  Showcase what you can offer or what you're seeking.
                </p>
              </div>
              <Link
                to="/add-skill"
                className="inline-flex items-center rounded-lg bg-indigo-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-indigo-600"
              >
                + Add skill
              </Link>
            </div>

            {skills.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                You haven't added any skills yet.{' '}
                <Link to="/add-skill" className="font-semibold text-indigo-600">
                  Add your first skill
                </Link>
                .
              </div>
            ) : (
              <div className="space-y-3">
                {skills.slice(0, 5).map((s) => (
                  <div
                    key={s._id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-indigo-100 hover:bg-indigo-50/40 transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate text-sm font-semibold text-slate-900">
                          {s.name}
                        </h4>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            s.skillType === 'Seek'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {s.skillType || 'Offer'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">{s.level}</p>
                    </div>
                    <div className="ml-4 w-32">
                      <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Progress</span>
                        <span className="font-medium text-slate-700">{s.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-[width] duration-500"
                          style={{ width: `${s.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <Link
                to="/profile"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View all skills →
              </Link>
            </div>
          </section>

          {/* Recent messages card */}
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Recent messages
                </h2>
                <p className="text-xs text-slate-500">
                  A quick peek at what you've been talking about.
                </p>
              </div>
              <Link
                to="/messages"
                className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Open inbox
              </Link>
            </div>

            {messages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No messages yet. Start a conversation from{' '}
                <Link to="/browse-skill" className="font-semibold text-indigo-600">
                  Browse Skills
                </Link>
                .
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {messages.map((m) => {
                  const fromYou =
                    (m.senderId?._id || m.senderId)?.toString() ===
                    user?._id?.toString();
                  const toYou =
                    (m.receiverId?._id || m.receiverId)?.toString() ===
                    user?._id?.toString();

                  const senderLabel = fromYou
                    ? 'You'
                    : m.senderId?.username || 'Someone';
                  const receiverLabel = toYou
                    ? 'You'
                    : m.receiverId?.username || 'Someone';

                  return (
                    <li
                      key={m._id}
                      className="flex items-start justify-between gap-3 px-1 py-2.5 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500">
                          <span className="font-semibold text-slate-800">
                            {senderLabel}
                          </span>{' '}
                          <span>→</span>{' '}
                          <span className="font-semibold text-slate-800">
                            {receiverLabel}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-700">
                          {m.content}
                        </p>
                      </div>
                      <span className="shrink-0 pl-2 text-[11px] text-slate-400">
                        {formatDate(m.createdAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}