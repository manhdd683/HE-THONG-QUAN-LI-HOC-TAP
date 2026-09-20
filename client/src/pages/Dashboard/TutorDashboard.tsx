import { useEffect, useState } from 'react';
import {
  Users, BookOpen, GraduationCap, DollarSign, FileText,
  Mail, Check, X, Calendar, Clock, ChevronRight,
  AlertCircle, CheckCircle2, BookMarked, Globe, MapPin,
  TrendingUp, TrendingDown, AlertTriangle, Plus, CalendarX, FileCheck, FileX
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

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

const AVATAR_COLORS = ['#3b82f6','#10b981','#ec4899','#f59e0b','#6366f1','#8b5cf6'];
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
      {/* COMPACT WELCOME BANNER */}
      <div className="dash-welcome">
        <div className="dash-welcome-text">
          <h1>Xin chào, {user?.name} 👋</h1>
          <p>Hôm nay là {today}. Chúc bạn một ngày dạy học hiệu quả!</p>
        </div>
        <div className="dash-welcome-action">
          <button className="btn-primary" onClick={() => navigate('/tutor/schedule')}>
            <Plus size={18} /> Tạo buổi học mới
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card glass-panel students" onClick={() => navigate('/tutor/students')}>
          <div className="stat-icon"><Users size={22} /></div>
          <div className="stat-info">
            <span className="stat-title">Học sinh</span>
            <span className="stat-value">{data?.totalStudents}</span>
            <div className="stat-trend positive"><TrendingUp size={12} /> <span>+2 tháng này</span></div>
          </div>
        </div>
        <div className="stat-card glass-panel sessions" onClick={() => navigate('/tutor/schedule')}>
          <div className="stat-icon"><BookOpen size={22} /></div>
          <div className="stat-info">
            <span className="stat-title">Lịch hôm nay</span>
            <span className="stat-value">{data?.todaySessionsCount}</span>
            <div className="stat-trend neutral"><span>Khá bận rộn</span></div>
          </div>
        </div>
        <div className="stat-card glass-panel homeworks" onClick={() => navigate('/tutor/homework')}>
          <div className="stat-icon"><GraduationCap size={22} /></div>
          <div className="stat-info">
            <span className="stat-title">Bài tập</span>
            <span className="stat-value">{data?.pendingHomeworksCount}</span>
            <div className={`stat-trend ${(data?.pendingHomeworksCount ?? 0) > 0 ? 'warning' : 'positive'}`}>
              {(data?.pendingHomeworksCount ?? 0) > 0 ? <span>Cần chấm gấp</span> : <><Check size={12}/> <span>Đã hoàn tất</span></>}
            </div>
          </div>
        </div>
        <div className="stat-card glass-panel tuition" onClick={() => navigate('/tutor/tuition')}>
          <div className="stat-icon"><DollarSign size={22} /></div>
          <div className="stat-info">
            <span className="stat-title">Học phí nợ</span>
            <span className="stat-value">{data?.unpaidCyclesCount}</span>
            <div className={`stat-trend ${(data?.unpaidCyclesCount ?? 0) > 0 ? 'negative' : 'positive'}`}>
              {(data?.unpaidCyclesCount ?? 0) > 0 ? <><TrendingDown size={12} /> <span>Cần nhắc nhở</span></> : <><Check size={12}/> <span>Ổn định</span></>}
            </div>
          </div>
        </div>
      </div>

      {/* EMAIL APPROVALS */}
      {pendingEmails.length > 0 && (
        <div className="dash-alert-panel glass-panel">
          <div className="dash-section-header">
            <span className="dash-section-title">
              <span className="icon-wrapper" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}><Mail size={15} /></span>
              Yêu cầu đổi Email ({pendingEmails.length})
            </span>
          </div>
          <div className="dash-list">
            {pendingEmails.map(req => (
              <div key={req.id} className="dash-item">
                <div className="dash-item-avatar" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                  {getInitials(req.name)}
                </div>
                <div className="dash-item-content">
                  <div className="dash-item-title">{req.name}</div>
                  <div className="dash-item-sub">
                    <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: 4 }}>{req.email}</span>
                    <ChevronRight size={12} />
                    <strong style={{ color: 'var(--warning)', marginLeft: 4 }}>{req.pending_email}</strong>
                  </div>
                </div>
                <div className="dash-item-actions">
                  <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={() => handleApproveEmail(req.id)}>
                    <Check size={14} /> Đồng ý
                  </button>
                  <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '13px', color: 'var(--danger)' }} onClick={() => handleRejectEmail(req.id)}>
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
              <span className="icon-wrapper" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}><Clock size={15} /></span>
              Lịch học hôm nay
            </span>
            {(data?.todaySessionsCount ?? 0) > 0 && <span className="dash-badge green">{data?.todaySessionsCount} buổi</span>}
          </div>
          {!data?.todaySchedules.length ? (
            <div className="dash-empty">
              <CalendarX size={36} strokeWidth={1.2} />
              <span>Hôm nay trống lịch</span>
              <button className="btn-secondary" onClick={() => navigate('/tutor/schedule')} style={{ marginTop: 8 }}>Xếp lịch ngay</button>
            </div>
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
              <span className="icon-wrapper" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}><Calendar size={15} /></span>
              Lịch sắp tới (7 ngày)
            </span>
            <span className="dash-see-all" onClick={() => navigate('/tutor/schedule')}>Xem tất cả <ChevronRight size={13} /></span>
          </div>
          {!data?.upcomingSchedules.length ? (
            <div className="dash-empty">
              <CalendarX size={36} strokeWidth={1.2} />
              <span>Không có lịch nào sắp tới</span>
            </div>
          ) : data.upcomingSchedules.map(s => (
            <div key={s.id} className="dash-item">
              <div className="dash-item-avatar" style={{ background: getColor(s.student.name) + '22', color: getColor(s.student.name) }}>{getInitials(s.student.name)}</div>
              <div className="dash-item-content">
                <div className="dash-item-title"><span className="status-dot upcoming" />{s.student.name}</div>
                <div className="dash-item-sub">{s.start_time} - {s.end_time}</div>
              </div>
              <div className="dash-item-right">
                <div className="dash-item-time">{formatDate(s.date)}</div>
                <div className="dash-item-meta">
                  {s.format === 'ONLINE' ? <Globe size={11} /> : <Users size={11} />}
                  <span>{s.subject || 'Lịch học'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* HOMEWORKS */}
        <div className="dash-section glass-panel">
          <div className="dash-section-header">
            <span className="dash-section-title">
              <span className="icon-wrapper" style={{ background: 'var(--pink-bg)', color: 'var(--pink)' }}><BookMarked size={15} /></span>
              Bài tập cần chấm
            </span>
            {(data?.pendingHomeworksCount ?? 0) > 0 && <span className="dash-badge pink">{data?.pendingHomeworksCount} bài</span>}
          </div>
          {!data?.pendingHomeworks.length ? (
            <div className="dash-empty">
              <FileCheck size={36} strokeWidth={1.2} />
              <span>Tuyệt vời! Tất cả bài tập đã được chấm.</span>
            </div>
          ) : data.pendingHomeworks.map(hw => (
            <div key={hw.id} className="dash-item clickable" onClick={() => navigate('/tutor/homework')}>
              <div className="dash-item-avatar" style={{ background: 'var(--pink-bg)', color: 'var(--pink)' }}><BookMarked size={18} /></div>
              <div className="dash-item-content">
                <div className="dash-item-title">{hw.title}</div>
                <div className="dash-item-sub"><span className="status-dot pending" />{hw.student?.name}</div>
              </div>
              <div className="dash-item-right"><span style={{ color: 'var(--pink)', fontSize: '12px', fontWeight: 600 }}>Chưa chấm</span></div>
            </div>
          ))}
        </div>

        {/* TUITION */}
        <div className="dash-section glass-panel">
          <div className="dash-section-header">
            <span className="dash-section-title">
              <span className="icon-wrapper" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}><AlertCircle size={15} /></span>
              Học phí chưa thu
            </span>
            {(data?.unpaidCyclesCount ?? 0) > 0 && <span className="dash-badge orange">{data?.unpaidCyclesCount} chu kỳ</span>}
          </div>
          {!data?.unpaidCycles.length ? (
            <div className="dash-empty">
              <CheckCircle2 size={36} strokeWidth={1.2} />
              <span>Tất cả học phí đã được thanh toán!</span>
            </div>
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
                <div className="dash-item-time" style={{ color: cycle.status === 'OVERDUE' ? 'var(--danger)' : 'var(--warning)' }}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(Math.max(0, cycle.total_amount - cycle.paid_amount))}
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
              <span className="icon-wrapper" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}><FileText size={15} /></span>
              Báo cáo gần đây
            </span>
            <span className="dash-see-all" onClick={() => navigate('/tutor/reports')}>Tạo báo cáo <ChevronRight size={13} /></span>
          </div>
          {!data?.recentReports.length ? (
            <div className="dash-empty">
              <FileX size={36} strokeWidth={1.2} />
              <span>Chưa có báo cáo nào được tạo</span>
              <button className="btn-secondary" onClick={() => navigate('/tutor/reports')} style={{ marginTop: 8 }}>Tạo báo cáo ngay</button>
            </div>
          ) : (
            <div className="dash-report-grid">
              {data.recentReports.map(r => (
                <div key={r.id} className="dash-report-card clickable" onClick={() => navigate('/tutor/reports')}>
                  <div className="dash-report-icon"><FileText size={18} /></div>
                  <div>
                    <div className="dash-item-title">{r.name}</div>
                    <div className="dash-item-sub">{r.student?.name}</div>
                    <div className="dash-item-sub" style={{ fontSize: 11, marginTop: 4 }}>
                      Tạo: {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(r.created_at))}
                    </div>
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
