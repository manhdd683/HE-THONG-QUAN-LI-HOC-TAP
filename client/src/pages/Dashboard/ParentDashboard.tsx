import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { BookOpen, GraduationCap, DollarSign, Calendar, TrendingUp, Clock, FileText } from 'lucide-react';

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
          const currentCount = Math.floor(end * (1 - Math.pow(1 - t, 3)));
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

const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });


const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res, dashRes] = await Promise.all([
          api.get('/students'),
          api.get('/dashboard/parent')
        ]);
        if (res.data && res.data.length > 0) {
          const names = res.data.map((s: any) => s.name).join(' và ');
          setStudentName(names);
        }
        setData(dashRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const weeklySessionsCount = useCountUp(data?.weeklySessionsCount, 600, 0);
  const pendingHomeworksCount = useCountUp(data?.pendingHomeworksCount, 600, 80);
  const unpaidTuitionCount = useCountUp(data?.unpaidCyclesCount, 600, 160);

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-loading-spinner" />
      <span>Đang tải dữ liệu...</span>
    </div>
  );

  return (
    <div className="dashboard">
      {/* HERO HEADER */}
      <div className="dash-welcome">
        <div className="dash-welcome-text" style={{ flex: 1 }}>
          <h1>Xin chào cha, mẹ của bạn {studentName || '...'}</h1>
          <p>Theo dõi tình hình học tập của con bạn.</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--surface-solid)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)', fontSize: '14px', color: 'var(--text-muted)', marginTop: '16px' }}>
            <Calendar size={14} />
            {today}
          </div>
        </div>
        <div className="dash-welcome-illustration" style={{ flexShrink: 0, opacity: 0.8 }}>
          <TrendingUp size={80} strokeWidth={1} color="var(--primary)" />
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card sessions" onClick={() => navigate('/parent/schedule')}>
          <div className="stat-info">
            <span className="stat-title">Lịch trong tuần</span>
            <span className="stat-value">{weeklySessionsCount}</span>
            <div className="stat-trend neutral"><Calendar size={14} /> <span>Buổi học</span></div>
          </div>
        </div>

        <div className="stat-card homeworks" onClick={() => navigate('/parent/homework')}>
          <div className="stat-info">
            <span className="stat-title">Bài tập cần nộp</span>
            <span className="stat-value">{pendingHomeworksCount}</span>
            <div className="stat-trend neutral"><BookOpen size={14} /> <span>Bài tập</span></div>
          </div>
        </div>

        <div className="stat-card tuition" onClick={() => navigate('/parent/tuition')}>
          <div className="stat-info">
            <span className="stat-title">Học phí cần đóng</span>
            <span className="stat-value">{unpaidTuitionCount}</span>
            <div className="stat-trend neutral"><DollarSign size={14} /> <span>Chu kỳ</span></div>
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
          <div className="dash-list">
            {data?.upcomingSchedules?.length ? data.upcomingSchedules.map((s: any) => (
              <div key={s.id} className="dash-list-item" onClick={() => navigate('/parent/schedule')}>
                <div className="dash-item-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  <Clock size={16} />
                </div>
                <div className="dash-item-content">
                  <div className="dash-item-title">{s.subject || 'Chung'} - {s.student?.name}</div>
                  <div className="dash-item-subtitle">{formatDate(s.date)} | {s.start_time}</div>
                </div>
              </div>
            )) : (
              <div className="dash-empty">
                <BookOpen size={36} strokeWidth={1.2} />
                <span>Không có lịch học sắp tới</span>
              </div>
            )}
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
          <div className="dash-list">
            {data?.recentReports?.length ? data.recentReports.map((r: any) => (
              <div key={r.id} className="dash-list-item" onClick={() => navigate('/parent/reports')}>
                <div className="dash-item-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                  <FileText size={16} />
                </div>
                <div className="dash-item-content">
                  <div className="dash-item-title">Báo cáo: {r.student?.name}</div>
                  <div className="dash-item-subtitle">{formatDate(r.created_at)}</div>
                </div>
              </div>
            )) : (
              <div className="dash-empty">
                <GraduationCap size={36} strokeWidth={1.2} />
                <span>Chưa có báo cáo học tập nào</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
