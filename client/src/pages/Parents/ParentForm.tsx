import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Parent } from './ParentsList';
import api from '../../utils/api';

interface ParentFormProps {
  parent: Parent | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ParentForm: React.FC<ParentFormProps> = ({ parent, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    status: 'ACTIVE',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (parent) {
      setFormData({
        name: parent.name,
        email: parent.email,
        phone: parent.phone || '',
        address: parent.address || '',
        password: '',
        status: parent.status,
      });
    }
  }, [parent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // VALIDATION
    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
      setError('Số điện thoại không hợp lệ (cần 10-11 chữ số)');
      return;
    }

    setIsLoading(true);

    try {
      if (parent) {
        await api.put(`/parents/${parent.id}`, formData);
      } else {
        await api.post('/parents', formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h2>{parent ? 'Chỉnh sửa Phụ huynh' : 'Thêm Phụ huynh mới'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
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
          
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={!!parent} // Prevent email change on edit for simplicity
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu {parent ? '(Để trống nếu không muốn đổi)' : '*'}</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required={!parent}
              placeholder={parent ? "Nhập mật khẩu mới..." : "Mật khẩu đăng nhập..."}
              minLength={6}
            />
          </div>
          
          <div className="form-group">
            <label>Số điện thoại</label>
            <input
              type="text"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Địa chỉ</label>
            <input
              type="text"
              name="address"
              className="form-input"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          {parent && (
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

export default ParentForm;
