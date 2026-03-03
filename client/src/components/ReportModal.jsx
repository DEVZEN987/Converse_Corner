import { useState } from 'react';
import { reportsApi } from '../lib/api';
import './ReportModal.css';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or unwanted content' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'fake_profile', label: 'Fake profile or impersonation' },
  { value: 'other', label: 'Other' }
];

export default function ReportModal({ isOpen, onClose, reportedUser, selectedMessages = [] }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a reason');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await reportsApi.submit({
        reportedUserId: reportedUser._id,
        reason,
        description,
        messageIds: selectedMessages.map(m => m._id)
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setReason('');
        setDescription('');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={e => e.stopPropagation()}>
        <div className="report-modal-header">
          <h3>Report User</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {success ? (
          <div className="report-success">
            <span className="success-icon">✓</span>
            <p>Report submitted successfully!</p>
            <p className="sub-text">We will review it shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="report-user-info">
              <p>Reporting: <strong>{reportedUser.username}</strong></p>
              {selectedMessages.length > 0 && (
                <p className="selected-messages">
                  {selectedMessages.length} message(s) selected as evidence
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Reason for reporting *</label>
              <div className="reason-options">
                {REPORT_REASONS.map((r) => (
                  <label key={r.value} className="reason-option">
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Additional details (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail..."
                maxLength={500}
                rows={4}
              />
              <span className="char-count">{description.length}/500</span>
            </div>

            {error && <div className="report-error">{error}</div>}

            <div className="report-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-submit"
                disabled={loading || !reason}
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}