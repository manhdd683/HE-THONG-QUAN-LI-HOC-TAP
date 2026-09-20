import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Student } from './StudentsList';
import type { Parent } from '../Parents/ParentsList';
import api from '../../utils/api';

interface StudentFormProps {
  student: Student | null;
  onClose: () => void;
  onSuccess: () => void;
}

const StudentForm: React.FC<StudentFormProps> = ({ student, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    parent_id: '',
    parentMode: 'select', // 'select' or 'create'
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    dob: '',
    gender: 'Nam',
    school: '',
    grade: '',
    start_date: '',
    status: 'ACTIVE',
  });
  
  const [studentSubjects, setStudentSubjects] = useState([{ subject: '', price_per_session: 0 }]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchParents = async () => {
      try {
        const response = await api.get('/parents');
        setParents(response.data);
      } catch (err) {
        console.error('Error fetching parents', err);
      }
    };
    fetchParents();
  }, []);

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name,
        parent_id: student.parent_id,
        dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
        gender: student.gender || 'Nam',
        school: student.school || '',
        grade: student.grade || '',
        start_date: student.start_date ? new Date(student.start_date).toISOString().split('T')[0] : '',
        status: student.status,
      });
      
      if (student.student_subjects && student.student_subjects.length > 0) {
        setStudentSubjects(student.student_subjects.map(s => ({
          subject: s.subject,
          price_per_session: s.price_per_session
        })));
      } else {
        // Fallback to old format
        setStudentSubjects([{ 
          subject: student.subject || '', 
          price_per_session: student.price_per_session || 0 
        }]);
      }
    }
  }, [student]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectChange = (index: number, field: string, value: string | number) => {
    const newSubjects = [...studentSubjects];
    newSubjects[index] = { ...newSubjects[index], [field]: value };
    setStudentSubjects(newSubjects);
  };

  const addSubject = () => {
    setStudentSubjects([...studentSubjects, { subject: '', price_per_session: 0 }]);
  };

  const removeSubject = (index: number) => {
    const newSubjects = [...studentSubjects];
    newSubjects.splice(index, 1);
    setStudentSubjects(newSubjects);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // VALIDATION
    if (studentSubjects.some(s => s.price_per_session < 0)) {
      setError('Học phí không được là số âm');
      return;
    }
    
    if (formData.dob && new Date(formData.dob) > new Date()) {
      setError('Ngày sinh không hợp lệ (lớn hơn ngày hiện tại)');
      return;
    }
    
    if (formData.start_date && formData.dob && new Date(formData.start_date) <= new Date(formData.dob)) {
      setError('Ngày bắt đầu học phải lớn hơn ngày sinh');
      return;
    }

    setIsLoading(true);

    try {
      const payload = { ...formData, student_subjects: studentSubjects };
      
      if (student) {
        await api.put(`/students/${student.id}`, payload);
      } else {
        await api.post('/students', payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Đã có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>{student ? 'Chỉnh sửa Học sinh' : 'Thêm Học sinh mới'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Họ và tên *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <label style={{ margin: 0, fontWeight: 600 }}>Phụ huynh</label>
              {!student && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    className={`btn-icon ${formData.parentMode === 'select' ? 'active' : ''}`}
                    style={{ padding: '4px 12px', fontSize: '13px', borderRadius: '100px', background: formData.parentMode === 'select' ? 'var(--primary)' : 'transparent', color: formData.parentMode === 'select' ? '#fff' : 'var(--text)' }}
                    onClick={() => setFormData(prev => ({ ...prev, parentMode: 'select' }))}
                  >
                    Chọn có sẵn
                  </button>
                  <button 
                    type="button" 
                    className={`btn-icon ${formData.parentMode === 'create' ? 'active' : ''}`}
                    style={{ padding: '4px 12px', fontSize: '13px', borderRadius: '100px', background: formData.parentMode === 'create' ? 'var(--primary)' : 'transparent', color: formData.parentMode === 'create' ? '#fff' : 'var(--text)' }}
                    onClick={() => setFormData(prev => ({ ...prev, parentMode: 'create' }))}
                  >
                    + Tạo mới
                  </button>
                </div>
              )}
            </div>

            {formData.parentMode === 'select' || student ? (
              <select name="parent_id" className="form-input" value={formData.parent_id} onChange={handleChange} required>
                <option value="">-- Chọn Phụ huynh --</option>
                {parents.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                ))}
              </select>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Họ tên phụ huynh *</label>
                  <input type="text" name="parent_name" className="form-input" value={formData.parent_name} onChange={handleChange} required placeholder="Nhập họ tên phụ huynh..." />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Email đăng nhập *</label>
                  <input type="email" name="parent_email" className="form-input" value={formData.parent_email} onChange={handleChange} required placeholder="email@example.com (Dùng để đăng nhập)" />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Số điện thoại</label>
                  <input type="tel" name="parent_phone" className="form-input" value={formData.parent_phone} onChange={handleChange} placeholder="VD: 0912345678" />
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                  * Mật khẩu đăng nhập mặc định cho phụ huynh mới sẽ là: <strong>123456</strong>
                </p>
              </div>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Lớp</label>
              <input
                type="text"
                name="grade"
                className="form-input"
                value={formData.grade}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Ngày bắt đầu</label>
              <input
                type="date"
                name="start_date"
                className="form-input"
                value={formData.start_date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group" style={{ background: 'var(--glass-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <label style={{ margin: 0, fontWeight: 'bold' }}>Môn học & Học phí</label>
              <button type="button" className="btn-secondary" onClick={addSubject} style={{ padding: '4px 12px', fontSize: '12px' }}>
                <Plus size={14} style={{ marginRight: '4px' }} />
                Thêm môn
              </button>
            </div>
            
            {studentSubjects.map((subject, index) => (
              <div key={index} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tên môn học</label>
                  <input
                    type="text"
                    className="form-input"
                    value={subject.subject}
                    onChange={(e) => handleSubjectChange(index, 'subject', e.target.value)}
                    placeholder="VD: Toán"
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Học phí / Buổi</label>
                  <input
                    type="number"
                    className="form-input"
                    value={subject.price_per_session}
                    onChange={(e) => handleSubjectChange(index, 'price_per_session', parseFloat(e.target.value))}
                    min="0"
                    required
                  />
                </div>
                {studentSubjects.length > 1 && (
                  <button type="button" className="btn-icon" onClick={() => removeSubject(index)} style={{ color: 'var(--danger)', marginBottom: '8px' }}>
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {student && (
            <div className="form-group">
              <label>Trạng thái</label>
              <select 
                name="status" 
                className="form-input" 
                value={formData.status} 
                onChange={handleChange}
              >
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Vô hiệu hóa</option>
                <option value="ARCHIVED">Đã lưu trữ</option>
              </select>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;
