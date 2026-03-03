import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { skillsApi } from '../lib/api';
import './Profile.css';

export default function Profile() {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    skillsApi.my()
      .then(setSkills)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try {
      await skillsApi.delete(id);
      setSkills((s) => s.filter((x) => x._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /><p>Loading...</p></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="profile-page">
      <h1>Profile</h1>
      <div className="profile-info">
        <p><strong>Username:</strong> {user?.username}</p>
        <p><strong>Email:</strong> {user?.email}</p>
      </div>

      <div className="profile-actions">
        <Link to="/add-skill" className="btn btn-primary">Add Skill</Link>
      </div>

      <h2>Your Skills</h2>
      {skills.length === 0 ? (
        <p className="empty">No skills yet. <Link to="/add-skill">Add your first skill</Link></p>
      ) : (
        <div className="skill-grid">
          {skills.map((s) => (
            <div key={s._id} className="skill-card">
              <div className="skill-card-header">
                <h4>{s.name}</h4>
                <span className={`skill-type ${s.skillType === 'Seek' ? 'skill-type-seek' : 'skill-type-offer'}`}>
                  {s.skillType || 'Offer'}
                </span>
              </div>
              <span className="level">{s.level}</span>
              {s.description && <p className="desc">{s.description}</p>}
              <div className="progress-bar">
                <div style={{ width: `${s.progress}%` }} />
              </div>
              <span className="progress-text">{s.progress}%</span>
              <button
                type="button"
                className="btn-delete"
                onClick={() => handleDelete(s._id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
