import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { skillsApi } from '../lib/api';
import './AddSkill.css';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const TYPES = ['Offer', 'Seek'];

export default function AddSkill() {
  const [form, setForm] = useState({
    name: '',
    level: 'Beginner',
    description: '',
    progress: 0,
    skillType: 'Offer',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === 'progress' ? Math.min(100, Math.max(0, parseInt(value, 10) || 0)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await skillsApi.add(form);
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Failed to add skill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-skill-page">
      <h1>Add Skill</h1>
      <form className="add-skill-form" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}
        <label>
          Skill Name
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            maxLength={100}
          />
        </label>
        <label>
          Level
          <select name="level" value={form.level} onChange={handleChange}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select name="skillType" value={form.skillType} onChange={handleChange}>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
          />
        </label>
        <label>
          Progress (0–100)
          <input
            type="number"
            name="progress"
            value={form.progress}
            onChange={handleChange}
            min={0}
            max={100}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Skill'}
        </button>
      </form>
    </div>
  );
}
