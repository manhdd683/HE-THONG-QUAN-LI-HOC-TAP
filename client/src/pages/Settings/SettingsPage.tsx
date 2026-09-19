import { useState } from 'react';
import { User, Bell, Shield, Moon, Save, Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    notificationsEmail: true,
    notificationsSMS: false,
    darkMode: false,
  });
  const [newEmail, setNewEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Đã lưu cấu hình thành công!');
  };

  const handleEmailRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/request-email-change', { newEmail });
      setEmailStatus(res.data.message);
      setNewEmail('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Cài đặt hệ thống</h1>
          <p>Quản lý tài khoản và tùy chọn hiển thị</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Sidebar settings tab */}
        <div className="glass-panel" style={{ width: '250px', padding: '1rem', alignSelf: 'flex-start' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              <button 
                className={`btn-secondary ${activeTab === 'profile' ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start', background: activeTab === 'profile' ? 'rgba(37, 99, 235, 0.1)' : 'transparent', color: activeTab === 'profile' ? 'var(--primary)' : 'inherit', border: 'none', padding: '12px' }}
                onClick={() => setActiveTab('profile')}
              >
                <User size={18} style={{ marginRight: '8px' }} /> Tài khoản
              </button>
            </li>
            <li>
              <button 
                className={`btn-secondary ${activeTab === 'notifications' ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start', background: activeTab === 'notifications' ? 'rgba(37, 99, 235, 0.1)' : 'transparent', color: activeTab === 'notifications' ? 'var(--primary)' : 'inherit', border: 'none', padding: '12px' }}
                onClick={() => setActiveTab('notifications')}
              >
                <Bell size={18} style={{ marginRight: '8px' }} /> Thông báo
              </button>
            </li>
            <li>
              <button 
                className={`btn-secondary ${activeTab === 'security' ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start', background: activeTab === 'security' ? 'rgba(37, 99, 235, 0.1)' : 'transparent', color: activeTab === 'security' ? 'var(--primary)' : 'inherit', border: 'none', padding: '12px' }}
                onClick={() => setActiveTab('security')}
              >
                <Shield size={18} style={{ marginRight: '8px' }} /> Bảo mật
              </button>
            </li>
            <li>
              <button 
                className={`btn-secondary ${activeTab === 'appearance' ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start', background: activeTab === 'appearance' ? 'rgba(37, 99, 235, 0.1)' : 'transparent', color: activeTab === 'appearance' ? 'var(--primary)' : 'inherit', border: 'none', padding: '12px' }}
                onClick={() => setActiveTab('appearance')}
              >
                <Moon size={18} style={{ marginRight: '8px' }} /> Giao diện
              </button>
            </li>
          </ul>
        </div>

        {/* Content area */}
        <div className="glass-panel" style={{ flex: 1, padding: '2rem' }}>
          <form onSubmit={handleSave}>
            
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Thông tin cá nhân</h2>
                
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" className="form-input" value={formData.email} disabled style={{ opacity: 0.7 }} />
                  <small style={{ color: 'var(--text-muted)' }}>Email dùng để đăng nhập không thể thay đổi.</small>
                </div>

                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input type="text" name="phone" className="form-input" value={formData.phone} onChange={handleChange} placeholder="Nhập số điện thoại liên hệ" />
                </div>
              </div>
            )}

            {activeTab === 'profile' && user?.role === 'PARENT' && (
              <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Yêu cầu thay đổi Email</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Gửi yêu cầu thay đổi Email liên kết (Cần gia sư xác nhận).
                </p>
                <div style={{ display: 'flex', gap: '1rem', maxWidth: '500px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Nhập email mới..."
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '40px', background: 'var(--glass-bg)' }}
                    />
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                  <button type="button" onClick={handleEmailRequest} className="btn-primary" style={{ whiteSpace: 'nowrap', width: 'auto' }}>
                    Gửi yêu cầu
                  </button>
                </div>
                {emailStatus && (
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '500px' }}>
                    <CheckCircle size={18} />
                    {emailStatus}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Tùy chọn thông báo</h2>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" name="notificationsEmail" checked={formData.notificationsEmail} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                  <span>Nhận thông báo qua Email (Khi có học sinh nộp bài)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" name="notificationsSMS" checked={formData.notificationsSMS} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                  <span>Nhận tin nhắn SMS (Khi có thanh toán học phí)</span>
                </label>
              </div>
            )}

            {activeTab === 'security' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Bảo mật tài khoản</h2>
                <button type="button" className="btn-secondary" style={{ width: 'fit-content' }}>
                  Đổi mật khẩu
                </button>
                <button type="button" className="btn-secondary" style={{ width: 'fit-content', color: 'var(--error)', borderColor: 'var(--error)' }}>
                  Đăng xuất khỏi tất cả thiết bị
                </button>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Giao diện</h2>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" name="darkMode" checked={formData.darkMode} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                  <span>Chế độ Tối (Dark Mode) - Đang phát triển</span>
                </label>
              </div>
            )}

            <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={18} /> Lưu thay đổi
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
