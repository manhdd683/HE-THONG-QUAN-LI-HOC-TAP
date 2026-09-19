import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../utils/api';

interface ScheduleFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ onClose, onSuccess, initialData }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    student_id: initialData?.student_id || '',
    subject: initialData?.subject || '',
    date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
    start_time: initialData?.start_time || '',
    end_time: initialData?.end_time || '',
    format: initialData?.format || 'OFFLINE',
    location: initialData?.location || '',
    notes: initialData?.notes || '',
    recurring_weeks: '0'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.get('/students');
        setStudents(response.data);
      } catch (err) {
        console.error('Failed to fetch students', err);
      }
    };
    fetchStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (initialData?.id) {
        await api.put(`/schedules/${initialData.id}`, formData);
      } else {
        await api.post('/schedules', formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save schedule');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'student_id') {
      setFormData(prev => ({ ...prev, student_id: value, subject: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>{initialData ? 'Sửa Lịch Học' : 'Thêm Lịch Học Mới'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={24} /></button>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Học sinh</label>
            <select name="student_id" value={formData.student_id} onChange={handleChange} required disabled={!!initialData}>
              <option value="">-- Chọn Học Sinh --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>



          <div className="form-group">
            <label>Ngày học</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Giờ bắt đầu</label>
              <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Giờ kết thúc</label>
              <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} required />
            </div>
          </div>

          {!initialData && (
            <div className="form-group">
              <label>Lặp lại hàng tuần</label>
              <select name="recurring_weeks" value={formData.recurring_weeks} onChange={handleChange}>
                <option value="0">Không lặp lại (Chỉ tạo 1 buổi)</option>
                <option value="4">Lặp lại 4 tuần (1 tháng)</option>
                <option value="8">Lặp lại 8 tuần (2 tháng)</option>
                <option value="12">Lặp lại 12 tuần (3 tháng)</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Hình thức</label>
            <select name="format" value={formData.format} onChange={handleChange} required>
              <option value="OFFLINE">Trực tiếp</option>
              <option value="ONLINE">Trực tuyến</option>
            </select>
          </div>

          <div className="form-group">
            <label>Địa điểm / Link học</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Ghi chú</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3}></textarea>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Lưu lịch học</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleForm;
