// @ts-nocheck
import React, { useEffect } from 'react';
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
  BookMarked,
  Award,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AppLogo from './AppLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const tutorLinks = [
    { path: '/tutor/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { path: '/tutor/students', icon: <GraduationCap size={18} />, label: 'Học sinh' },
    { path: '/tutor/parents', icon: <Users size={18} />, label: 'Phụ huynh' },
    { path: '/tutor/schedule', icon: <CalendarDays size={18} />, label: 'Lịch học' },
    { path: '/tutor/homework', icon: <BookOpen size={18} />, label: 'Bài tập' },
    { path: '/tutor/scores', icon: <BarChart3 size={18} />, label: 'Bảng điểm' },
    { path: '/tutor/tuition', icon: <CreditCard size={18} />, label: 'Học phí' },
    { path: '/tutor/achievements', icon: <Award size={18} />, label: 'Thành tích' },
    { path: '/tutor/reports', icon: <FileText size={18} />, label: 'Báo cáo' },
    { path: '/tutor/settings', icon: <Settings size={18} />, label: 'Cài đặt' },
  ];

  const parentLinks = [
    { path: '/parent/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { path: '/parent/schedule', icon: <CalendarDays size={18} />, label: 'Lịch học' },
    { path: '/parent/homework', icon: <BookOpen size={18} />, label: 'Bài tập' },
    { path: '/parent/scores', icon: <BarChart3 size={18} />, label: 'Bảng điểm' },
    { path: '/parent/tuition', icon: <CreditCard size={18} />, label: 'Học phí' },
    { path: '/parent/achievements', icon: <Award size={18} />, label: 'Thành tích' },
    { path: '/parent/reports', icon: <BookMarked size={18} />, label: 'Báo cáo' },
    { path: '/parent/settings', icon: <Settings size={18} />, label: 'Cài đặt' },
  ];

  const links = user?.role === 'TUTOR' ? tutorLinks : parentLinks;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Sidebar header */}
        <div className="sidebar-header" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ flexShrink: 0 }}>
            <AppLogo size={42} />
          </div>
          <h2 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#161c32', letterSpacing: '0.2px', textTransform: 'uppercase', lineHeight: 1.3, flex: 1 }}>
            HỆ THỐNG<br />GIÁO DỤC
          </h2>
          {/* Close button - mobile only */}
          <button
            onClick={onClose}
            className="sidebar-close-btn"
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
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
    </>
  );
};

export default Sidebar;
