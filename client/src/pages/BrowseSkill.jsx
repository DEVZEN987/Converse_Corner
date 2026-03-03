import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { skillsApi } from '../lib/api';
import './BrowseSkill.css';

export default function BrowseSkill() {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const myId = user?._id || user?.id;

  useEffect(() => {
    skillsApi.list()
      .then(setSkills)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /><p>Loading...</p></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="browse-skill">
      <h1>Browse Skills</h1>
      {skills.length === 0 ? (
        <p className="empty">No skills have been added yet.</p>
      ) : (
        <div className="skill-grid">
          {skills.map((s) => {
            const ownerId = (s.user?._id || s.user)?.toString();
            const isOwn = ownerId === myId?.toString();

            return (
              <div key={s._id} className="skill-card">
                <div className="skill-header">
                  <h3>{s.name}</h3>
                  <span className="badge-offer">{s.skillType || 'Offer'}</span>
                </div>
                
                <p className="level">{s.level}</p>
                <p className="by">by {s.user?.username || 'Unknown'}</p>
                {s.description && <p className="desc">{s.description}</p>}
                
                {/* Progress section - bar and percentage on same line */}
                <div className="progress-section">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${s.progress}%` }}></div>
                  </div>
                  <span className="percentage">{s.progress}%</span>
                </div>
                
                {/* Actions row - single Chat button on right */}
                <div className="skill-actions">
                  {user && !isOwn && ownerId && (
                    <Link
                      to={`/messages?skill=${s._id}&userId=${ownerId}&username=${s.user?.username}`}
                      className="chat-btn"
                      title={`Message ${s.user?.username}`}
                    >
                      <svg className="chat-icon" viewBox="0 0 24 24" fill="none">
                        <path 
                          d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" 
                          fill="currentColor"
                        />
                        <circle cx="8" cy="10" r="1.5" fill="white"/>
                        <circle cx="12" cy="10" r="1.5" fill="white"/>
                        <circle cx="16" cy="10" r="1.5" fill="white"/>
                      </svg>
                      <span>Chat</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}