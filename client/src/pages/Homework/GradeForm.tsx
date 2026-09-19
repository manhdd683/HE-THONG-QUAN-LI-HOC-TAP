import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../utils/api';
import type { Homework } from './HomeworkList';

interface GradeFormProps {
  homework: Homework;
  onClose: () => void;
  onSuccess: () => void;
}

const GradeForm: React.FC<GradeFormProps> = ({ homework, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    score: homework.score !== null ? homework.score.toString() : '',
    feedback: homework.feedback || '',
    status: 'GRADED'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.patch(`/homework/${homework.id}/grade`, formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra khi chấm điểm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h2>Chấm điểm: {homework.title}</h2>
          <button className="btn-icon" onClick={onClose}><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          
          <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
            <p><strong>Học sinh:</strong> {homework.student.name}</p>
            <p><strong>Trạng thái:</strong> <span className={`status-badge status-${homework.status.toLowerCase()}`}>{homework.status}</span></p>
          </div>

          <div className="form-group">
            <label>Điểm số (0-10) *</label>
            <input
              type="number"
              name="score"
              min="0"
              max="10"
              step="0.1"
              className="form-input"
              value={formData.score}
              onChange={handleChange}
              required
            />
            {formData.score && (
              <div style={{ marginTop: '8px', fontSize: '14px', color: 'var(--primary)', fontWeight: '500' }}>
                <span style={{ opacity: 0.8 }}>Tương đương phần trăm: </span> 
                {Math.round(parseFloat(formData.score) * 10)}%
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Nhận xét</label>
            <textarea
              name="feedback"
              className="form-input"
              value={formData.feedback}
              onChange={handleChange}
              rows={4}
              placeholder="Nhận xét chi tiết bài làm..."
            />
          </div>
          
          <div className="form-group">
            <label>Cập nhật trạng thái</label>
            <select
              name="status"
              className="form-input"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="GRADED">Đã chấm điểm (GRADED)</option>
              <option value="SUBMITTED">Đã nộp (SUBMITTED)</option>
              <option value="PENDING">Chưa nộp (PENDING)</option>
              <option value="OVERDUE">Quá hạn (OVERDUE)</option>
            </select>
          </div>

          <div className="form-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Đang lưu...' : 'Lưu điểm số'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GradeForm;
