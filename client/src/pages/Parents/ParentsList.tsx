import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';
import ParentForm from './ParentForm';

export interface Parent {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  address: string | null;
  status: string;
  pending_email?: string | null;
}

const ParentsList: React.FC = () => {
  const [parents, setParents] = useState<Parent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const { showSuccess, showError } = useToast();

  const fetchParents = async () => {
    try {
      const response = await api.get('/parents');
      setParents(response.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách phụ huynh', error);
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  const handleAdd = () => {
    setSelectedParent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (parent: Parent) => {
    setSelectedParent(parent);
    setIsModalOpen(true);
  };

  const handleApproveEmail = async (parent: Parent) => {
    if (!window.confirm(`Xác nhận đổi email cho ${parent.name} thành ${parent.pending_email}?`)) return;
    try {
      await api.put(`/parents/${parent.id}/approve-email`);
      fetchParents(); // Refresh
      showSuccess('Duyệt email thành công!');
    } catch (error) {
      console.error('Lỗi duyệt email', error);
      showError('Duyệt email thất bại. Xem console log.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Danh sách Phụ huynh</h1>
          <p>Quản lý tài khoản phụ huynh trong hệ thống</p>
        </div>
        <button className="btn-primary" onClick={handleAdd} style={{ display: 'flex', gap: '0.5rem', width: 'auto' }}>
          <Plus size={20} />
          <span>Thêm phụ huynh</span>
        </button>
      </div>

      <div className="data-table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Họ và tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {parents.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Chưa có dữ liệu</td>
              </tr>
            ) : (
              parents.map(parent => (
                <tr key={parent.id}>
                  <td>{parent.name}</td>
                  <td>
                    {parent.email}
                    {parent.pending_email && (
                      <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#eab308' }}>
                        → Yêu cầu đổi: <strong>{parent.pending_email}</strong>
                      </div>
                    )}
                  </td>
                  <td>
                    {parent.phone ? parent.phone : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa cập nhật</span>}
                  </td>
                  <td>
                    <span className={`status-badge status-${parent.status.toLowerCase()}`}>
                      {parent.status === 'ACTIVE' ? 'Hoạt động' : parent.status === 'INACTIVE' ? 'Vô hiệu hóa' : parent.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {parent.pending_email && (
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--accent)', color: 'white', border: 'none' }} 
                          onClick={() => handleApproveEmail(parent)}
                          title="Duyệt yêu cầu đổi email"
                        >
                          Duyệt Email
                        </button>
                      )}
                      <button className="btn-icon" onClick={() => handleEdit(parent)} title="Chỉnh sửa">
                        <Edit size={18} />
                      </button>
                      <button className="btn-icon text-danger" title="Khóa/Xóa">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ParentForm 
          parent={selectedParent} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            fetchParents();
            showSuccess(selectedParent ? 'Chỉnh sửa phụ huynh thành công!' : 'Thêm phụ huynh thành công!');
          }} 
        />
      )}
    </div>
  );
};

export default ParentsList;
