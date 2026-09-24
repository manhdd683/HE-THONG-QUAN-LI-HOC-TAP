// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  Users, BookOpen, GraduationCap, DollarSign, FileText,
  Mail, Check, X, Calendar, Clock, ChevronRight,
  AlertCircle, CheckCircle2, BookMarked, Globe,
  TrendingUp, TrendingDown, AlertTriangle, Plus
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

const AVATAR_COLORS = ['#1F5C4E','#6B9B7C','#E08E45','#C1502E','#3b82f6','#8b5cf6'];
const getColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const getInitials = (name: string) => name.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase();
const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });

const useCountUp = (end: number | undefined, duration: number = 600, delay: number = 0) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (end === undefined) return;
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setCount(end);
      return;
    }

    let startTime: number;
    let animationFrame: number;
    
    const startAnimation = () => {
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        if (progress < duration) {
          const t = progress / duration;
          const currentCount = Math.floor(end * (1 - Math.pow(1 - t, 3))); // cubic ease out
          setCount(currentCount);
          animationFrame = requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };
      animationFrame = requestAnimationFrame(animate);
    };

    const timeout = setTimeout(startAnimation, delay);
    return () => {
      clearTimeout(timeout);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [end, duration, delay]);

  return count;
};

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

  // Animated counters staggered by 80ms
  const studentsCount = useCountUp(data?.totalStudents, 600, 0);
  const sessionsCount = useCountUp(data?.todaySessionsCount, 600, 80);
  const homeworksCount = useCountUp(data?.pendingHomeworksCount, 600, 160);
  const tuitionCount = useCountUp(data?.unpaidCyclesCount, 600, 240);

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-loading-spinner" />
      <span>Đang tải dữ liệu...</span>
    </div>
  );

  return (
    <div className="dashboard">
      {/* COMPACT WELCOME BANNER (Asymmetrical) */}
      <div className="dash-welcome">
        <div className="dash-welcome-text" style={{ flex: 1 }}>
          <h1>Xin chào, {user?.name}</h1>
          <p style={{ marginTop: '8px' }}>
            Hôm nay là {today}.<br />
            Chúc bạn một ngày dạy học hiệu quả và tràn đầy năng lượng!
          </p>
          <div style={{ marginTop: '20px' }}>
            <button className="btn-primary" onClick={() => navigate('/tutor/schedule')}>
              <Plus size={18} /> Tạo buổi học mới
            </button>
          </div>
        </div>
        <div className="dash-welcome-illustration" style={{ flexShrink: 0, opacity: 0.8 }}>
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
            <path d="M8 7h6"/>
            <path d="M8 11h8"/>
          </svg>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card students" onClick={() => navigate('/tutor/students')}>
          <div className="stat-info">
            <span className="stat-title">Học sinh đang dạy</span>
            <span className="stat-value">{studentsCount}</span>
            <div className="stat-trend positive"><TrendingUp size={14} /> <span>+2 tháng này</span></div>
          </div>
        </div>
        <div className="stat-card sessions" onClick={() => navigate('/tutor/schedule')}>
          <div className="stat-info">
            <span className="stat-title">Lịch học hôm nay</span>
            <span className="stat-value">{sessionsCount}</span>
            <div className={`stat-trend ${(data?.todaySessionsCount ?? 0) > 0 ? 'warning' : 'neutral'}`}>
              {(data?.todaySessionsCount ?? 0) > 0 ? <span>Khá bận rộn</span> : <><Check size={14}/> <span>Thảnh thơi</span></>}
            </div>
          </div>
        </div>
        <div className="stat-card homeworks" onClick={() => navigate('/tutor/homework')}>
          <div className="stat-info">
            <span className="stat-title">Bài tập cần chấm</span>
            <span className="stat-value">{homeworksCount}</span>
            <div className={`stat-trend ${(data?.pendingHomeworksCount ?? 0) > 0 ? 'negative' : 'neutral'}`}>
              {(data?.pendingHomeworksCount ?? 0) > 0 ? <span>Cần chấm gấp</span> : <><Check size={14}/> <span>Đã hoàn tất</span></>}
            </div>
          </div>
        </div>
        <div className="stat-card tuition" onClick={() => navigate('/tutor/tuition')}>
          <div className="stat-info">
            <span className="stat-title">Học phí chưa thu</span>
            <span className="stat-value">{tuitionCount}</span>
            <div className={`stat-trend ${(data?.unpaidCyclesCount ?? 0) > 0 ? 'negative' : 'neutral'}`}>
              {(data?.unpaidCyclesCount ?? 0) > 0 ? <><TrendingDown size={14} /> <span>Cần nhắc nhở</span></> : <><Check size={14}/> <span>Ổn định</span></>}
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
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                <path d="M21 14l-4-4"/>
              </svg>
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
                  {s.format === 'ONLINE' ? <Globe size={13} /> : <Users size={13} />}
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
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
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
                  {s.format === 'ONLINE' ? <Globe size={13} /> : <Users size={13} />}
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
              <span className="icon-wrapper" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}><BookMarked size={15} /></span>
              Bài tập cần chấm
            </span>
            {(data?.pendingHomeworksCount ?? 0) > 0 && <span className="dash-badge pink">{data?.pendingHomeworksCount} bài</span>}
          </div>
          {!data?.pendingHomeworks.length ? (
            <div className="dash-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                <path d="M9 10l2 2 4-4"/>
              </svg>
              <span>Tuyệt vời! Tất cả bài tập đã được chấm.</span>
            </div>
          ) : data.pendingHomeworks.map(hw => (
            <div key={hw.id} className="dash-item clickable" onClick={() => navigate('/tutor/homework')}>
              <div className="dash-item-avatar" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}><BookMarked size={18} /></div>
              <div className="dash-item-content">
                <div className="dash-item-title">{hw.title}</div>
                <div className="dash-item-sub"><span className="status-dot pending" />{hw.student?.name}</div>
              </div>
              <div className="dash-item-right"><span style={{ color: 'var(--danger)', fontSize: '13px', fontWeight: 600 }}>Chưa chấm</span></div>
            </div>
          ))}
        </div>

        {/* TUITION */}
        <div className="dash-section glass-panel">
          <div className="dash-section-header">
            <span className="dash-section-title">
              <span className="icon-wrapper" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}><AlertCircle size={15} /></span>
              Học phí chưa thu
            </span>
            {(data?.unpaidCyclesCount ?? 0) > 0 && <span className="dash-badge orange">{data?.unpaidCyclesCount} chu kỳ</span>}
          </div>
          {!data?.unpaidCycles.length ? (
            <div className="dash-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              <span>Tất cả học phí đã được thanh toán!</span>
            </div>
          ) : data.unpaidCycles.map(cycle => (
            <div key={cycle.id} className="dash-item clickable" onClick={() => navigate('/tutor/tuition')}>
              <div className="dash-item-avatar" style={{ background: getColor(cycle.student.name) + '22', color: getColor(cycle.student.name) }}>{getInitials(cycle.student.name)}</div>
              <div className="dash-item-content">
                <div className="dash-item-title">{cycle.student.name}</div>
                <div className="dash-item-sub">
                  {cycle.status === 'OVERDUE'
                    ? <><span className="status-dot overdue" /><AlertTriangle size={12} style={{ marginRight: 3, marginLeft: 3 }} />Quá hạn</>
                    : <><span className="status-dot pending" />{cycle.name}</>}
                </div>
              </div>
              <div className="dash-item-right">
                <div className="dash-item-time" style={{ color: cycle.status === 'OVERDUE' ? 'var(--danger)' : 'var(--warning)' }}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(Math.max(0, cycle.total_amount - cycle.paid_amount))}
                </div>
                <div className="dash-item-meta">Còn nợ</div>
              </div>
            </div>
          ))}
        </div>

        {/* REPORTS */}
        <div className="dash-section glass-panel">
          <div className="dash-section-header">
            <span className="dash-section-title">
              <span className="icon-wrapper" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}><FileText size={15} /></span>
              Báo cáo gần đây
            </span>
            <span className="dash-see-all" onClick={() => navigate('/tutor/reports')}>Tạo báo cáo <ChevronRight size={13} /></span>
          </div>
          {!data?.recentReports.length ? (
            <div className="dash-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <span>Chưa có báo cáo nào</span>
            </div>
          ) : data.recentReports.map(r => (
            <div key={r.id} className="dash-item clickable" onClick={() => navigate('/tutor/reports')}>
              <div className="dash-item-avatar" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}><FileText size={18} /></div>
              <div className="dash-item-content">
                <div className="dash-item-title">{r.student?.name}</div>
                <div className="dash-item-sub">
                  Báo cáo học tập
                </div>
              </div>
              <div className="dash-item-right">
                <div className="dash-item-time" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(r.created_at))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;
