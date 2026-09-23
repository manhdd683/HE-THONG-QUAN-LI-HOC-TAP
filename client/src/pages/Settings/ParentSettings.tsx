import { useState } from 'react';
import { Mail, Shield, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const ParentSettings: React.FC = () => {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await api.put('/parents/request-email-change', { new_email: newEmail });
      setMessage({ text: 'Yêu cầu đổi Email đã được gửi đến Gia sư. Vui lòng đợi phê duyệt.', type: 'success' });
      setNewEmail('');
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Có lỗi xảy ra', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Cài đặt Tài khoản</h1>
          <p>Quản lý thông tin tài khoản và bảo mật</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '800px' }}>
        
        {/* Email Settings */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '12px' }}>
              <Mail size={24} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Đổi Email Liên kết</h3>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Yêu cầu đổi email sẽ cần sự phê duyệt từ gia sư để có hiệu lực.
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Email hiện tại</span>
            <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>{user?.email}</p>
          </div>

          <form onSubmit={handleRequestEmailChange}>
            <div className="form-group">
              <label>Email mới</label>
              <input
                type="email"
                placeholder="Nhập email mới..."
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
              />
            </div>
            
            {message.text && (
              <div style={{ 
                padding: '1rem', 
                borderRadius: '8px', 
                marginBottom: '1rem',
                backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                color: message.type === 'error' ? '#ef4444' : '#22c55e',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {message.type === 'success' && <Check size={18} />}
                {message.text}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading || !newEmail}>
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu đổi Email'}
            </button>
          </form>
        </div>

        {/* Security Settings (Placeholder) */}
        <div className="glass-panel" style={{ padding: '2rem', opacity: 0.7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '12px', borderRadius: '12px' }}>
              <Shield size={24} color="#a855f7" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Đổi mật khẩu</h3>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Tính năng này đang được phát triển.
              </p>
            </div>
          </div>
          <button className="btn-secondary" disabled>Sắp ra mắt</button>
        </div>

      </div>
    </div>
  );
};

export default ParentSettings;
