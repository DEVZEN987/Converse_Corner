import { Link } from 'react-router-dom';
import './SkillCard.css';

const SkillCard = ({ skill, onDelete, showDelete }) => {
  return (
    <div className="skill-card">
      <div className="skill-header">
        <h3>{skill.title}</h3>
        <span className="badge-offer">OFFER</span>
      </div>
      
      <p className="level">{skill.level}</p>
      <p className="description">{skill.description}</p>
      
      {/* Progress bar with percentage on same line */}
      <div className="progress-section">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${skill.percentage}%` }}></div>
        </div>
        <span className="percentage">{skill.percentage}%</span>
      </div>
      
      {/* Actions row - chat button on right */}
      <div className="skill-actions">
        <Link to={`/messages?skill=${skill._id}`} className="chat-btn">
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
        
        {showDelete && (
          <button className="btn-delete" onClick={() => onDelete(skill._id)}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default SkillCard;