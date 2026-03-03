import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ✅ Safe API URL - works with both Vite and CRA
const getApiUrl = () => {
  try {
    // Check if we're in Vite (import.meta.env exists)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.VITE_API_URL || 'http://localhost:5000';
    }
    // Check if we're in CRA (process.env exists)
    if (typeof process !== 'undefined' && process.env) {
      return process.env.REACT_APP_API_URL || 'http://localhost:5000';
    }
  } catch (error) {
    console.warn('Error detecting environment:', error);
  }
  // Default fallback
  return 'http://localhost:5000';
};

export default function ProtectedRoute({ children, requiredRole }) {
  // ✅ Safe auth context with fallback
  let auth = {};
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Auth context error:', error);
  }
  
  const { user = null, loading = true } = auth;
  
  const [reason, setReason] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);

  // ✅ Safe localStorage access
  const getToken = () => {
    try {
      return localStorage.getItem('token');
    } catch (error) {
      console.warn('Cannot access localStorage:', error);
      return null;
    }
  };

  // ✅ Safe localStorage removal
  const clearStorage = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error) {
      console.warn('Cannot clear localStorage:', error);
    }
  };

  // ✅ Safe countdown timer
  useEffect(() => {
    if (!user?.appeal?.submittedAt || user.appeal.status !== 'pending') return;

    const calculateSeconds = () => {
      try {
        const submittedDate = new Date(user.appeal.submittedAt);
        const approvalDate = new Date(submittedDate.getTime() + 5 * 1000);
        const now = new Date();
        const seconds = Math.ceil((approvalDate - now) / 1000);
        return Math.max(0, seconds);
      } catch (error) {
        console.warn('Error calculating time:', error);
        return 0;
      }
    };

    // Initial calculation
    setSecondsLeft(calculateSeconds());

    // Update every second
    const interval = setInterval(() => {
      const seconds = calculateSeconds();
      setSecondsLeft(seconds);
      
      // Auto-refresh when countdown hits 0
      if (seconds === 0) {
        window.location.reload();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.appeal]);

  // ✅ Show loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px',
        fontFamily: 'system-ui'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div>Loading...</div>
      </div>
    );
  }

  // ✅ Redirect if no user
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ BANNED USER VIEW
  if (user?.isBanned) {
    const canAppeal = !user.appeal?.status || 
                      user.appeal?.status === 'none' || 
                      user.appeal?.status === 'rejected';
    
    const isPending = user.appeal?.status === 'pending';
    const isApproved = user.appeal?.status === 'approved';

    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        backgroundColor: '#fee',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ maxWidth: '600px', width: '100%' }}>
          <h2 style={{ color: '#991b1b', marginBottom: '10px' }}>Account Suspended</h2>
          <p style={{ color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
            Your account has been suspended. You can appeal this decision by providing a detailed explanation below.
          </p>

          {/* ✅ PENDING STATUS */}
          {isPending && (
            <div style={{
              backgroundColor: '#fef3c7',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '30px',
              borderLeft: '4px solid #f59e0b',
              color: '#92400e'
            }}>
              <h3 style={{ margin: '0 0 10px 0' }}>⏳ Appeal Pending</h3>
              <p style={{ margin: '5px 0' }}>
                Submitted: {new Date(user.appeal.submittedAt).toLocaleString()}
              </p>
              {secondsLeft > 0 && (
                <p style={{ 
                  margin: '15px 0 5px', 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: '#d97706' 
                }}>
                  {secondsLeft} seconds remaining
                </p>
              )}
            </div>
          )}

          {/* ✅ APPROVED STATUS */}
          {isApproved && (
            <div style={{
              backgroundColor: '#dcfce7',
              padding: '30px',
              borderRadius: '8px',
              marginBottom: '30px',
              borderLeft: '4px solid #10b981',
              color: '#166534'
            }}>
              <h3 style={{ margin: '0 0 15px 0' }}>✓ Appeal Approved!</h3>
              <p>Your account has been reinstated. You can now access the platform.</p>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  marginTop: '20px',
                  padding: '12px 30px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Refresh to Continue
              </button>
            </div>
          )}

          {/* ✅ REJECTED STATUS */}
          {user.appeal?.status === 'rejected' && (
            <div style={{
              backgroundColor: '#fee2e2',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '30px',
              borderLeft: '4px solid #ef4444',
              color: '#991b1b'
            }}>
              <h3 style={{ margin: '0 0 10px 0' }}>❌ Appeal Rejected</h3>
              {user.appeal.adminResponse && (
                <p style={{ margin: '5px 0' }}>Response: {user.appeal.adminResponse}</p>
              )}
              <p style={{ margin: '10px 0 0 0' }}>You can submit another appeal below.</p>
            </div>
          )}

          {/* ✅ APPEAL FORM */}
          {canAppeal && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              
              // Validate reason
              if (!reason || reason.trim().length < 20) {
                setError('Please provide at least 20 characters');
                return;
              }
              
              setSubmitLoading(true);
              try {
                const token = getToken();
                if (!token) {
                  throw new Error('Not authenticated');
                }

                const response = await fetch(`${getApiUrl()}/api/auth/appeal`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ 
                    reason: reason.trim(), 
                    action: 'submit' 
                  })
                });

                const data = await response.json();

                if (!response.ok) {
                  throw new Error(data.message || 'Failed to submit appeal');
                }

                setSuccess('Appeal submitted successfully!');
                setReason('');
                
                // Reload after 2 seconds
                setTimeout(() => window.location.reload(), 2000);
                
              } catch (err) {
                setError(err.message);
              } finally {
                setSubmitLoading(false);
              }
            }} style={{ width: '100%' }}>
              <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px', 
                  fontWeight: '600' 
                }}>
                  Why should we unban you?
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you should be unbanned (minimum 20 characters)..."
                  maxLength={1000}
                  rows={6}
                  disabled={submitLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    resize: 'vertical',
                    opacity: submitLoading ? 0.6 : 1
                  }}
                />
                <p style={{ 
                  fontSize: '12px', 
                  color: reason.length < 20 ? '#ef4444' : '#999',
                  marginTop: '5px', 
                  textAlign: 'right' 
                }}>
                  {reason.length}/1000 {reason.length < 20 && '(min 20)'}
                </p>
              </div>

              {error && (
                <div style={{ 
                  backgroundColor: '#fee2e2', 
                  color: '#991b1b', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  marginBottom: '15px',
                  textAlign: 'left'
                }}>
                  ⚠️ {error}
                </div>
              )}
              
              {success && (
                <div style={{ 
                  backgroundColor: '#dcfce7', 
                  color: '#166534', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  marginBottom: '15px',
                  textAlign: 'left'
                }}>
                  ✓ {success}
                </div>
              )}

              <button 
                type="submit" 
                disabled={submitLoading || isPending}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: submitLoading || isPending ? 'not-allowed' : 'pointer',
                  opacity: submitLoading || isPending ? 0.6 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                {submitLoading ? 'Submitting...' : 'Submit Appeal'}
              </button>
            </form>
          )}

          {/* ✅ Logout Button */}
          <button 
            onClick={() => {
              clearStorage();
              window.location.href = '/login';
            }}
            style={{
              marginTop: '30px',
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // ✅ Role-based access
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/home" replace />;
  }

  // ✅ All good - render children
  return children;
}