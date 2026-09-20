import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../utils/api';

interface Student {
  id: string;
  name: string;
}

interface HomeworkFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const HomeworkForm: React.FC<HomeworkFormProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    student_id: '',
    title: '',
    subject: '',
    description: '',
    due_date: ''
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.get('/students');
        setStudents(response.data);
        if (response.data.length > 0) {
          setFormData(prev => ({ ...prev, student_id: response.data[0].id }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let attachments: any[] = [];
      
      // If there's a file, upload it first
      if (file) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        
        const uploadRes = await api.post('/upload', formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        const fileUrl = uploadRes.data.url;
        attachments = [{
          title: file.name,
          type: file.type,
          url: fileUrl
        }];
      }

      await api.post('/homework', {
        ...formData,
        attachments
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra khi tạo bài tập');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h2>Giao Bài Tập Mới</h2>
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
              onChange={handleChange}
              required
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tiêu đề bài tập *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: Bài tập Toán cuối tuần"
              required
            />
          </div>

          <div className="form-group">
            <label>Môn học (Tùy chọn)</label>
            <input
              type="text"
              name="subject"
              className="form-input"
              value={formData.subject}
              onChange={handleChange}
              placeholder="VD: Toán, Tiếng Anh..."
            />
          </div>

          <div className="form-group">
            <label>Nội dung / Ghi chú</label>
            <textarea
              name="description"
              className="form-input"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Mô tả chi tiết yêu cầu bài tập..."
            />
          </div>

          <div className="form-group">
            <label>Hạn nộp</label>
            <input
              type="date"
              name="due_date"
              className="form-input"
              value={formData.due_date}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Đính kèm tệp tin (Tùy chọn)</label>
            <input
              type="file"
              className="form-input"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              style={{ paddingTop: '8px' }}
            />
            <small style={{ color: 'var(--text-muted)' }}>Hỗ trợ ảnh, video hoặc tài liệu (Tối đa 50MB)</small>
          </div>

          <div className="form-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Đang lưu...' : 'Giao bài tập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HomeworkForm;
