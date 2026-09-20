import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, DollarSign, Calendar, TrendingUp } from 'lucide-react';


const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="dashboard">
      {/* HERO HEADER */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <h1>Xin chào, {user?.name}</h1>
          <p>Theo dõi tình hình học tập của con bạn.</p>
          <div className="dashboard-date-badge">
            <Calendar size={13} />
            {today}
          </div>
        </div>
        <div className="dashboard-header-deco">
          <TrendingUp size={80} strokeWidth={1} />
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card glass-panel sessions" onClick={() => navigate('/parent/schedule')}>
          <div className="stat-icon"><BookOpen size={22} /></div>
          <div className="stat-info">
            <span className="stat-title">Lịch trong tuần</span>
            <span className="stat-value">—</span>
            <span className="stat-badge ok">Buổi học</span>
          </div>
        </div>

        <div className="stat-card glass-panel homeworks" onClick={() => navigate('/parent/homework')}>
          <div className="stat-icon"><GraduationCap size={22} /></div>
          <div className="stat-info">
            <span className="stat-title">Bài tập cần nộp</span>
            <span className="stat-value">—</span>
            <span className="stat-badge ok">Bài tập</span>
          </div>
        </div>

        <div className="stat-card glass-panel tuition" onClick={() => navigate('/parent/tuition')}>
          <div className="stat-icon"><DollarSign size={22} /></div>
          <div className="stat-info">
            <span className="stat-title">Học phí cần đóng</span>
            <span className="stat-value">—</span>
            <span className="stat-badge ok">Chu kỳ</span>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="dashboard-grid">
        <div className="dash-section glass-panel">
          <div className="dash-section-header">
            <span className="dash-section-title">
              <span className="icon-wrapper" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                <Calendar size={15} />
              </span>
              Xem lịch học gần nhất
            </span>
          </div>
          <div className="dash-empty">
            <BookOpen size={36} strokeWidth={1.2} />
            <span>Bấm vào <strong>Lịch học</strong> ở menu bên trái để xem chi tiết lịch học của con</span>
          </div>
        </div>

        <div className="dash-section glass-panel">
          <div className="dash-section-header">
            <span className="dash-section-title">
              <span className="icon-wrapper" style={{ background: 'rgba(236,72,153,0.12)', color: '#ec4899' }}>
                <GraduationCap size={15} />
              </span>
              Báo cáo học tập
            </span>
          </div>
          <div className="dash-empty">
            <GraduationCap size={36} strokeWidth={1.2} />
            <span>Bấm vào <strong>Báo cáo</strong> ở menu bên trái để xem kết quả học tập chi tiết từ gia sư</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
