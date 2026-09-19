import { useEffect, useState } from 'react';
import {
  Users, BookOpen, GraduationCap, DollarSign, FileText,
  Mail, Check, X, Calendar, Clock, ChevronRight,
  AlertCircle, CheckCircle2, BookMarked, Globe, MapPin,
  TrendingUp, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './Dashboard.css';

interface DashboardData {
  totalStudents: number;
  todaySessionsCount: number;
  pendingHomeworksCount: number;
  unpaidCyclesCount: number;
  todaySchedules: any[];
  upcomingSchedules: any[];
  pendingHomeworks: any[];
  unpaidCycles: any[];
  recentReports: any[];
}

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6'];
const getColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const getInitials = (name: string) => name.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase();
const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });

const TutorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [pendingEmails, setPendingEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, emailsRes] = await Promise.all([
          api.get('/dashboard/tutor'),
          api.get('/auth/pending-emails').catch(() => ({ data: [] })),
        ]);
        setData(dashRes.data);
        setPendingEmails(emailsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApproveEmail = async (id: string) => {
    await api.post(`/auth/approve-email/${id}`);
    setPendingEmails(prev => prev.filter(p => p.id !== id));
  };

  const handleRejectEmail = async (id: string) => {
    await api.post(`/auth/reject-email/${id}`);
    setPendingEmails(prev => prev.filter(p => p.id !== id));
  };

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-loading-spinner" />
      <span>Đang tải dữ liệu...</span>
    </div>
  );

  return (
    <div className="dashboard">
      {/* HERO HEADER */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <h1>Xin chào, {user?.name}</h1>
          <p>Tổng quan hoạt động dạy học của bạn hôm nay.</p>
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
      <div className="stats-grid">
        <div className="stat-card glass-panel students" onClick={() => navigate('/tutor/students')}>
          <div className="stat-icon"><Users size={22} /></div>
          <div className="stat-info">
            <span className="stat-title">Học sinh</span>
            <span className="stat-value">{data?.totalStudents}</span>
            <span className="stat-badge ok">Đang học</span>
          </div>
        </div>
        <div className="stat-card glass-panel sessions" onClick={() => navigate('/tutor/schedule')}>
          <div className="stat-icon"><BookOpen size={22} /></div>
          <div className="stat-info">
            <span className="stat-title">Lịch hôm nay</span>
            <span className="stat-value">{data?.todaySessionsCount}</span>
            <span className="stat-badge ok">Buổi học</span>
          </div>
        </div>
        <div className="stat-card glass-panel homeworks" onClick={() => navigate('/tutor/homework')}>
          <div className="stat-icon"><GraduationCap size={22} /></div>
          <div className="stat-info">
            <span className="stat-title">Cần chấm</span>
            <span className="stat-value">{data?.pendingHomeworksCount}</span>
            <span className={`stat-badge ${(data?.pendingHomeworksCount ?? 0) > 0 ? 'urgent' : 'ok'}`}>
              {(data?.pendingHomeworksCount ?? 0) > 0 ? 'Chờ chấm' : 'Xong rồi'}
            </span>
          </div>
        </div>
        <div className="stat-card glass-panel tuition" onClick={() => navigate('/tutor/tuition')}>
          <div className="stat-icon"><DollarSign size={22} /></div>
          <div className="stat-info">
            <span className="stat-title">Học phí</span>
            <span className="stat-value">{data?.unpaidCyclesCount}</span>
            <span className={`stat-badge ${(data?.unpaidCyclesCount ?? 0) > 0 ? 'urgent' : 'ok'}`}>
              {(data?.unpaidCyclesCount ?? 0) > 0 ? 'Chưa thu' : 'Ổn định'}
            </span>
          </div>
        </div>
      </div>

      {/* EMAIL APPROVALS */}
      {pendingEmails.length > 0 && (
        <div className="dash-alert-panel glass-panel">
          <div className="dash-section-header">
            <span className="dash-section-title">
              <span className="icon-wrapper" style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706' }}><Mail size={15} /></span>
              Yêu cầu đổi Email ({pendingEmails.length})
            </span>
            <span className="dash-badge orange">{pendingEmails.length} yêu cầu</span>
          </div>
          <div className="dash-list">
            {pendingEmails.map(req => (
              <div key={req.id} className="dash-item">
                <div className="dash-item-avatar" style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706' }}>
                  {getInitials(req.name)}
                </div>
                <div className="dash-item-content">
                  <div className="dash-item-title">{req.name}</div>
                  <div className="dash-item-sub">
                    <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: 4 }}>{req.email}</span>
                    <ChevronRight size={12} />
                    <strong style={{ color: '#d97706', marginLeft: 4 }}>{req.pending_email}</strong>
                  </div>
                </div>
                <div className="dash-item-actions">
                  <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 5, width: 'auto' }} onClick={() => handleApproveEmail(req.id)}>
                    <Check size={14} /> Đồng ý
                  </button>
                  <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 5, width: 'auto', color: 'var(--danger)' }} onClick={() => handleRejectEmail(req.id)}>
                    <X size={14} /> Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN GRID */}
      <div className="dashboard-grid">
        {/* TODAY */}
        <div className="dash-section glass-panel">
          <div className="dash-section-header">
            <span className="dash-section-title">
              <span className="icon-wrapper" style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}><Clock size={15} /></span>
              Lịch học hôm nay
            </span>
            {(data?.todaySessionsCount ?? 0) > 0 && <span className="dash-badge green">{data?.todaySessionsCount} buổi</span>}
          </div>
          {!data?.todaySchedules.length ? (
            <div className="dash-empty"><Calendar size={36} strokeWidth={1.2} /><span>Hôm nay không có lịch học</span></div>
          ) : data.todaySchedules.map(s => (
            <div key={s.id} className="dash-item">
              <div className="dash-item-avatar" style={{ background: getColor(s.student.name) + '22', color: getColor(s.student.name) }}>{getInitials(s.student.name)}</div>
              <div className="dash-item-content">
                <div className="dash-item-title"><span className="status-dot today" />{s.student.name}</div>
                <div className="dash-item-sub">{s.subject || 'Lịch học'}</div>
              </div>
              <div className="dash-item-right">
                <div className="dash-item-time">{s.start_time} - {s.end_time}</div>
                <div className="dash-item-meta">
                  {s.format === 'ONLINE' ? <Globe size={11} /> : <MapPin size={11} />}
                  {s.format === 'ONLINE' ? ' Online' : ' Trực tiếp'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* UPCOMING */}
        <div className="dash-section glass-panel">
          <div className="dash-section-header">
            <span className="dash-section-title">
              <span className="icon-wrapper" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}><Calendar size={15} /></span>
              Lịch sắp tới (7 ngày)
            </span>
            <span className="dash-see-all" onClick={() => navigate('/tutor/schedule')}>Xem tất cả <ChevronRight size={13} /></span>
          </div>
          {!data?.upcomingSchedules.length ? (
            <div className="dash-empty"><Calendar size={36} strokeWidth={1.2} /><span>Không có lịch nào trong 7 ngày tới</span></div>
          ) : data.upcomingSchedules.map(s => (
            <div key={s.id} className="dash-item">
              <div className="dash-item-avatar" style={{ background: getColor(s.student.name) + '22', color: getColor(s.student.name) }}>{getInitials(s.student.name)}</div>
              <div className="dash-item-content">
                <div className="dash-item-title"><span className="status-dot upcoming" />{s.student.name}</div>
                <div className="dash-item-sub">{s.start_time} - {s.end_time}</div>
              </div>
              <div className="dash-item-right">
                <div className="dash-item-time">{formatDate(s.date)}</div>
                <div className="dash-item-meta">{s.format === 'ONLINE' ? <Globe size={11} /> : <MapPin size={11} />}</div>
              </div>
            </div>
          ))}
        </div>

        {/* HOMEWORKS */}
        <div className="dash-section glass-panel">
          <div className="dash-section-header">
            <span className="dash-section-title">
              <span className="icon-wrapper" style={{ background: 'rgba(236,72,153,0.12)', color: '#ec4899' }}><BookMarked size={15} /></span>
              Bài tập cần chấm
            </span>
            {(data?.pendingHomeworksCount ?? 0) > 0 && <span className="dash-badge pink">{data?.pendingHomeworksCount} bài</span>}
          </div>
          {!data?.pendingHomeworks.length ? (
            <div className="dash-empty"><CheckCircle2 size={36} strokeWidth={1.2} /><span>Tất cả bài tập đã được chấm!</span></div>
          ) : data.pendingHomeworks.map(hw => (
            <div key={hw.id} className="dash-item clickable" onClick={() => navigate('/tutor/homework')}>
              <div className="dash-item-avatar" style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899' }}><BookMarked size={18} /></div>
              <div className="dash-item-content">
                <div className="dash-item-title">{hw.title}</div>
                <div className="dash-item-sub"><span className="status-dot pending" />{hw.student?.name}</div>
              </div>
              <div className="dash-item-right"><span style={{ color: '#ec4899', fontSize: '12px', fontWeight: 600 }}>Chưa chấm</span></div>
            </div>
          ))}
        </div>

        {/* TUITION */}
        <div className="dash-section glass-panel">
          <div className="dash-section-header">
            <span className="dash-section-title">
              <span className="icon-wrapper" style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706' }}><AlertCircle size={15} /></span>
              Học phí chưa thu
            </span>
            {(data?.unpaidCyclesCount ?? 0) > 0 && <span className="dash-badge orange">{data?.unpaidCyclesCount} chu kỳ</span>}
          </div>
          {!data?.unpaidCycles.length ? (
            <div className="dash-empty"><CheckCircle2 size={36} strokeWidth={1.2} /><span>Tất cả học phí đã thanh toán!</span></div>
          ) : data.unpaidCycles.map(cycle => (
            <div key={cycle.id} className="dash-item clickable" onClick={() => navigate('/tutor/tuition')}>
              <div className="dash-item-avatar" style={{ background: getColor(cycle.student.name) + '22', color: getColor(cycle.student.name) }}>{getInitials(cycle.student.name)}</div>
              <div className="dash-item-content">
                <div className="dash-item-title">{cycle.student.name}</div>
                <div className="dash-item-sub">
                  {cycle.status === 'OVERDUE'
                    ? <><span className="status-dot overdue" /><AlertTriangle size={11} style={{ marginRight: 3 }} />Quá hạn</>
                    : <><span className="status-dot pending" />{cycle.name}</>}
                </div>
              </div>
              <div className="dash-item-right">
                <div className="dash-item-time" style={{ color: cycle.status === 'OVERDUE' ? '#ef4444' : '#d97706' }}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(cycle.total_amount - cycle.paid_amount)}
                </div>
                <div className="dash-item-meta">Còn lại</div>
              </div>
            </div>
          ))}
        </div>

        {/* REPORTS FULL WIDTH */}
        <div className="dash-section glass-panel dash-full-width">
          <div className="dash-section-header">
            <span className="dash-section-title">
              <span className="icon-wrapper" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}><FileText size={15} /></span>
              Báo cáo gần đây
            </span>
            <span className="dash-see-all" onClick={() => navigate('/tutor/reports')}>Tạo báo cáo <ChevronRight size={13} /></span>
          </div>
          {!data?.recentReports.length ? (
            <div className="dash-empty"><FileText size={36} strokeWidth={1.2} /><span>Chưa có báo cáo nào</span></div>
          ) : (
            <div className="dash-report-grid">
              {data.recentReports.map(r => (
                <div key={r.id} className="dash-report-card clickable" onClick={() => navigate('/tutor/reports')}>
                  <div className="dash-report-icon"><FileText size={18} /></div>
                  <div>
                    <div className="dash-item-title">{r.name}</div>
                    <div className="dash-item-sub">{r.student?.name}</div>
                    <div className="dash-item-sub" style={{ fontSize: 11, marginTop: 2 }}>{new Date(r.created_at).toLocaleString('vi-VN')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;
