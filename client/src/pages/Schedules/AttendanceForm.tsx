// @ts-nocheck
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../utils/api';
import type { Schedule } from './SchedulesList';

interface AttendanceFormProps {
  schedule: Schedule;
  onClose: () => void;
  onSuccess: () => void;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ schedule, onClose, onSuccess }) => {
  // Try to get existing comment if editing
  const existingComment = schedule.session?.comments?.[0];

  const [formData, setFormData] = useState({
    attendance: schedule.session?.attendance || 'PRESENT',
    actual_subject: schedule.subject || '',
    content: schedule.session?.content || '',
    understanding_level: existingComment?.understanding_level || '',
    attitude: existingComment?.attitude || '',
    strengths: existingComment?.strengths || '',
    weaknesses: existingComment?.weaknesses || '',
    record_link: schedule.session?.record_link || ''
  });
  const [studentSubjects, setStudentSubjects] = useState<any[]>([]);
  const [error, setError] = useState('');

  const appendToField = (field: 'content' | 'strengths' | 'weaknesses', text: string) => {
    setFormData(prev => {
      const current = prev[field] || '';
      const newText = current ? `${current}, ${text.toLowerCase()}` : text;
      return { ...prev, [field]: newText };
    });
  };

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const response = await api.get(`/students/${schedule.student.id}`);
        setStudentSubjects(response.data.student_subjects || []);
        
        if (!schedule.subject && response.data.student_subjects?.length > 0) {
          setFormData(prev => ({ ...prev, actual_subject: response.data.student_subjects[0].subject }));
        }
      } catch (err) {
        console.error('Failed to fetch student details', err);
      }
    };
    fetchStudentDetails();
  }, [schedule.student.id, schedule.subject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/schedules/${schedule.id}/attendance`, formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to mark attendance');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>{schedule.session ? 'Sửa điểm danh' : 'Điểm danh buổi học'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={24} /></button>
        </div>

        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
          <p><strong>Học sinh:</strong> {schedule.student.name}</p>
          <p><strong>Lịch dự kiến:</strong> {schedule.subject || 'Chưa xác định'}</p>
          <p><strong>Thời gian:</strong> {schedule.start_time} - {schedule.end_time} ({new Date(schedule.date).toLocaleDateString('vi-VN')})</p>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Trạng thái điểm danh</label>
            <select name="attendance" value={formData.attendance} onChange={handleChange} required>
              <option value="PRESENT">Có mặt</option>
              <option value="ABSENT">Vắng mặt (Không phép)</option>
              <option value="EXCUSED">Vắng mặt (Có phép)</option>
              <option value="MAKE_UP">Học bù</option>
            </select>
          </div>

          <div className="form-group">
            <label>Môn học thực tế đã dạy <span style={{ color: 'red' }}>*</span></label>
            <select name="actual_subject" value={formData.actual_subject} onChange={handleChange} required>
              <option value="">-- Chọn Môn Học --</option>
              {studentSubjects.map((sub: any, idx: number) => (
                <option key={idx} value={sub.subject}>{sub.subject}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Nội dung buổi học</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {['Ôn tập kiến thức cũ', 'Học bài mới', 'Luyện đề', 'Chữa bài tập'].map(t => (
                <span key={t} onClick={() => appendToField('content', t)} style={{ cursor: 'pointer', fontSize: '12px', background: 'var(--glass-border)', padding: '4px 8px', borderRadius: '12px', color: 'var(--text-muted)' }}>+ {t}</span>
              ))}
            </div>
            <textarea name="content" value={formData.content} onChange={handleChange} rows={2} placeholder="Nhập hoặc chọn mẫu nội dung..."></textarea>
          </div>

          {schedule.format === 'ONLINE' && (
            <div className="form-group">
              <label>Link Record bài học (Tùy chọn)</label>
              <input 
                type="url" 
                name="record_link" 
                value={formData.record_link} 
                onChange={handleChange} 
                placeholder="VD: https://meet.google.com/..." 
                className="form-input" 
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Mức độ hiểu bài</label>
              <select name="understanding_level" value={formData.understanding_level} onChange={handleChange}>
                <option value="">-- Chọn --</option>
                <option value="Tốt">Tốt</option>
                <option value="Khá">Khá</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Cần cố gắng">Cần cố gắng</option>
              </select>
            </div>
            <div className="form-group">
              <label>Thái độ học tập</label>
              <select name="attitude" value={formData.attitude} onChange={handleChange}>
                <option value="">-- Chọn --</option>
                <option value="Tích cực">Tích cực</option>
                <option value="Tập trung">Tập trung</option>
                <option value="Chưa tập trung">Chưa tập trung</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Điểm mạnh (Tùy chọn)</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {['Tiếp thu nhanh', 'Tích cực phát biểu', 'Làm bài tốt', 'Chăm chỉ'].map(t => (
                <span key={t} onClick={() => appendToField('strengths', t)} style={{ cursor: 'pointer', fontSize: '12px', background: 'rgba(34, 197, 94, 0.1)', padding: '4px 8px', borderRadius: '12px', color: '#22c55e' }}>+ {t}</span>
              ))}
            </div>
            <input type="text" name="strengths" value={formData.strengths} onChange={handleChange} placeholder="Ghi chú điểm mạnh..." className="form-input" />
          </div>

          <div className="form-group">
            <label>Điểm yếu (Tùy chọn)</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {['Đôi lúc còn phân tâm', 'Cần rèn luyện thêm tốc độ tính toán', 'Cần ôn tập thêm công thức', 'Cần chú ý trình bày cẩn thận hơn'].map(t => (
                <span key={t} onClick={() => appendToField('weaknesses', t)} style={{ cursor: 'pointer', fontSize: '12px', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '12px', color: '#ef4444' }}>+ {t}</span>
              ))}
            </div>
            <input type="text" name="weaknesses" value={formData.weaknesses} onChange={handleChange} placeholder="Ghi chú điểm yếu cần cải thiện..." className="form-input" />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
              {schedule.session ? 'Cập nhật điểm danh' : 'Xác nhận điểm danh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceForm;
