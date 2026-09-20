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
  const [parentToDelete, setParentToDelete] = useState<Parent | null>(null);
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

  const confirmDelete = async () => {
    if (!parentToDelete) return;
    try {
      await api.delete(`/parents/${parentToDelete.id}`);
      showSuccess('Đã khóa phụ huynh thành công!');
      setParentToDelete(null);
      fetchParents();
    } catch (error: any) {
      console.error('Delete error:', error);
      showError('Không thể xóa phụ huynh: ' + (error.response?.data?.error || error.message));
      setParentToDelete(null);
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
                      <button className="btn-icon text-danger" title="Khóa/Xóa" onClick={() => setParentToDelete(parent)}>
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

      {parentToDelete && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Xác nhận khóa</h2>
            </div>
            <div className="modal-form">
              <p>Bạn có chắc chắn muốn khóa tài khoản phụ huynh <strong>{parentToDelete.name}</strong> không?</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Hành động này sẽ chuyển trạng thái của phụ huynh thành Vô hiệu hóa (Archived). Phụ huynh sẽ không thể đăng nhập vào hệ thống.
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setParentToDelete(null)}>Hủy</button>
                <button type="button" className="btn-primary" style={{ background: 'var(--danger)', color: 'white' }} onClick={confirmDelete}>Xác nhận Khóa</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentsList;
