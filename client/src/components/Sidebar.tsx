import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarDays,
  BookOpen,
  CreditCard,
  Settings,
  LogOut,
  FileText,
  BarChart3,
  BookMarked
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const tutorLinks = [
    { path: '/tutor/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { path: '/tutor/students', icon: <GraduationCap size={18} />, label: 'Học sinh' },
    { path: '/tutor/parents', icon: <Users size={18} />, label: 'Phụ huynh' },
    { path: '/tutor/schedule', icon: <CalendarDays size={18} />, label: 'Lịch học' },
    { path: '/tutor/homework', icon: <BookOpen size={18} />, label: 'Bài tập' },
    { path: '/tutor/scores', icon: <BarChart3 size={18} />, label: 'Bảng điểm' },
    { path: '/tutor/tuition', icon: <CreditCard size={18} />, label: 'Học phí' },
    { path: '/tutor/reports', icon: <FileText size={18} />, label: 'Báo cáo' },
    { path: '/tutor/settings', icon: <Settings size={18} />, label: 'Cài đặt' },
  ];

  const parentLinks = [
    { path: '/parent/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { path: '/parent/schedule', icon: <CalendarDays size={18} />, label: 'Lịch học' },
    { path: '/parent/homework', icon: <BookOpen size={18} />, label: 'Bài tập' },
    { path: '/parent/scores', icon: <BarChart3 size={18} />, label: 'Bảng điểm' },
    { path: '/parent/tuition', icon: <CreditCard size={18} />, label: 'Học phí' },
    { path: '/parent/reports', icon: <BookMarked size={18} />, label: 'Báo cáo' },
    { path: '/parent/settings', icon: <Settings size={18} />, label: 'Cài đặt' },
  ];

  const links = user?.role === 'TUTOR' ? tutorLinks : parentLinks;
  const appName = user?.role === 'TUTOR' ? 'Tutor Panel' : 'Phụ Huynh';

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <GraduationCap size={18} />
        </div>
        <h2>{appName}</h2>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', color: 'inherit' }}>
                {React.cloneElement(link.icon as React.ReactElement, {
                  fill: isActive ? 'currentColor' : 'none',
                  strokeWidth: isActive ? 1.5 : 2
                })}
              </div>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button onClick={logout} className="logout-btn">
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
