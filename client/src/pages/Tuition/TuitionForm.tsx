import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../utils/api';

interface Student {
  id: string;
  name: string;
  price_per_session: number;
  student_subjects?: {
    subject: string;
    price_per_session: number;
  }[];
}

interface TuitionFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const TuitionForm: React.FC<TuitionFormProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    student_id: '',
    name: 'Chu kỳ học phí tháng ' + (new Date().getMonth() + 1),
    subject: '',
    total_sessions: '10',
    price_per_session: '0'
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.get('/students');
        setStudents(response.data);
        if (response.data.length > 0) {
          const firstStudent = response.data[0];
          setFormData(prev => ({ 
            ...prev, 
            student_id: firstStudent.id,
            price_per_session: firstStudent.price_per_session?.toString() || '0'
          }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStudents();
  }, []);

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const studentId = e.target.value;
    const student = students.find(s => s.id === studentId);
    
    // Auto-select first subject if exists
    const firstSubject = student?.student_subjects?.[0];
    
    setFormData({
      ...formData,
      student_id: studentId,
      subject: firstSubject?.subject || '',
      price_per_session: (firstSubject?.price_per_session || student?.price_per_session || 0).toString()
    });
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subjectName = e.target.value;
    const student = students.find(s => s.id === formData.student_id);
    const selectedSubj = student?.student_subjects?.find(s => s.subject === subjectName);
    
    setFormData({
      ...formData,
      subject: subjectName,
      price_per_session: (selectedSubj?.price_per_session || student?.price_per_session || 0).toString()
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/tuition', {
        ...formData,
        total_sessions: parseInt(formData.total_sessions),
        price_per_session: parseFloat(formData.price_per_session)
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra khi tạo chu kỳ học phí');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h2>Tạo Chu Kỳ Học Phí</h2>
          <button className="btn-icon" onClick={onClose}><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          
          <div className="form-group">
            <label>Học sinh *</label>
            <select
              name="student_id"
              className="form-input"
              value={formData.student_id}
              onChange={handleStudentChange}
              required
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tên chu kỳ *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Môn học (Tùy chọn)</label>
            {(() => {
              const selectedStudent = students.find(s => s.id === formData.student_id);
              if (selectedStudent?.student_subjects && selectedStudent.student_subjects.length > 0) {
                return (
                  <select
                    name="subject"
                    className="form-input"
                    value={formData.subject}
                    onChange={handleSubjectChange}
                  >
                    <option value="">-- Tất cả các môn (Tính tiền tự động) --</option>
                    {selectedStudent.student_subjects.map((sub, idx) => (
                      <option key={idx} value={sub.subject}>{sub.subject} ({sub.price_per_session.toLocaleString()}đ)</option>
                    ))}
                  </select>
                );
              }
              
              return (
                <input
                  type="text"
                  name="subject"
                  className="form-input"
                  placeholder="VD: Toán, Tiếng Anh... (Bỏ trống nếu áp dụng chung)"
                  value={formData.subject}
                  onChange={handleChange}
                />
              );
            })()}
          </div>

          <div className="form-row">
            <label>Số buổi học *</label>
            <input
              type="number"
              name="total_sessions"
              className="form-input"
              min="1"
              value={formData.total_sessions}
              onChange={handleChange}
              required
            />
          </div>

          {formData.subject !== '' ? (
            <div className="form-group">
              <label>Học phí / Buổi (VNĐ) *</label>
              <input
                type="number"
                name="price_per_session"
                className="form-input"
                min="0"
                value={formData.price_per_session}
                onChange={handleChange}
                required
              />
              <small style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>
                Tổng tiền: {new Intl.NumberFormat('vi-VN').format(parseInt(formData.total_sessions) * parseFloat(formData.price_per_session || '0'))} VNĐ
              </small>
            </div>
          ) : (
            <div className="form-group" style={{ background: 'var(--glass-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '13px', color: 'var(--accent)' }}>
                💡 <strong>Tính tiền tự động:</strong> Hệ thống sẽ tự động cộng dồn tiền học phí theo từng buổi dựa trên môn học thực tế mà học sinh tham gia điểm danh. Tổng tiền ban đầu sẽ là 0 VNĐ.
              </span>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Đang tạo...' : 'Tạo chu kỳ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TuitionForm;
