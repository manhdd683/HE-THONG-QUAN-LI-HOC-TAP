import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';


const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword
      });
      
      setMessage(response.data.message);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <h1>Quên mật khẩu</h1>
          <p>{step === 1 ? 'Nhập email để nhận mã OTP' : 'Nhập mã OTP và mật khẩu mới'}</p>
        </div>

        {step === 1 ? (
          <form className="auth-form" onSubmit={handleSendOtp}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nhap@email.com"
              />
            </div>
            
            <button type="submit" className="auth-button btn-primary" disabled={isLoading}>
              {isLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
            </button>
            <div className="auth-footer">
              <Link to="/login" className="forgot-link">Quay lại đăng nhập</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label>Mã OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="Nhập mã 6 số"
              />
            </div>
            
            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Xác nhận mật khẩu</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-button btn-primary" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleSendOtp} disabled={isLoading} style={{marginTop: '0.5rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer'}}>
              Gửi lại mã OTP
            </button>
          </form>
        )}

        {message && <div style={{ color: 'var(--success)', textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/login" className="auth-link">Quay lại Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
