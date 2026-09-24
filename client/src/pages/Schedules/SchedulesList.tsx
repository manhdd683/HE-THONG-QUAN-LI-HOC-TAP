// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, CheckCircle, Clock, Calendar, MapPin, Video, User, Edit2, 
  Trash2, Edit3, Search, FileText, ChevronDown, ChevronUp, Users, 
  List, Sparkles, BookOpen, AlertCircle, Check 
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ScheduleForm from './ScheduleForm';
import AttendanceForm from './AttendanceForm';
import SessionDetailModal from './SessionDetailModal';

export interface Schedule {
  id: string;
  subject: string;
  date: string;
  start_time: string;
  end_time: string;
  format: string;
  status: string;
  student: {
    id: string;
    name: string;
  };
  session?: {
    id: string;
    attendance: string;
    feedback?: string;
    content?: string;
    comments?: any[];
  };
}

const SchedulesList: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<Schedule | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);
  const [attendanceToDelete, setAttendanceToDelete] = useState<Schedule | null>(null);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [activeTab, setActiveTab] = useState<'SCHEDULED' | 'COMPLETED'>('COMPLETED');
  const [viewMode, setViewMode] = useState<'BY_STUDENT' | 'FLAT_LIST'>('BY_STUDENT');
  const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/schedules');
      setSchedules(response.data);
    } catch (error) {
      console.error('Failed to fetch schedules', error);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleMarkAttendance = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsAttendanceOpen(true);
  };

  const scheduledList = schedules.filter(s => s.status === 'SCHEDULED');
  const completedList = schedules.filter(s => s.status !== 'SCHEDULED');
  const displayList = activeTab === 'SCHEDULED' ? scheduledList : completedList;
  
  // Sort: SCHEDULED -> Ascending (nearest future first), COMPLETED -> Descending (nearest past first)
  const sortedList = [...displayList].sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.start_time}`).getTime();
    const timeB = new Date(`${b.date}T${b.start_time}`).getTime();
    return activeTab === 'SCHEDULED' ? timeA - timeB : timeB - timeA;
  });

  const filteredList = sortedList.filter(s => 
    s.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.subject && s.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group schedules by student
  const studentGroups = useMemo(() => {
    const groupsMap = new Map<string, {
      studentId: string;
      studentName: string;
      schedules: Schedule[];
      presentCount: number;
      absentCount: number;
      lateCount: number;
      subjects: string[];
    }>();

    filteredList.forEach(schedule => {
      const sId = schedule.student.id || schedule.student.name;
      if (!groupsMap.has(sId)) {
        groupsMap.set(sId, {
          studentId: sId,
          studentName: schedule.student.name,
          schedules: [],
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          subjects: [],
        });
      }
      const group = groupsMap.get(sId)!;
      group.schedules.push(schedule);

      const att = schedule.session?.attendance;
      if (att === 'PRESENT') group.presentCount++;
      else if (att === 'ABSENT') group.absentCount++;
      else if (att === 'LATE') group.lateCount++;

      if (schedule.subject && !group.subjects.includes(schedule.subject)) {
        group.subjects.push(schedule.subject);
      }
    });

    return Array.from(groupsMap.values());
  }, [filteredList]);

  // Auto-expand first student on initial load or when searching
  useEffect(() => {
    if (studentGroups.length > 0) {
      if (searchTerm.trim() !== '') {
        // Expand all matching when searching
        const all: Record<string, boolean> = {};
        studentGroups.forEach(g => { all[g.studentId] = true; });
        setExpandedStudents(all);
      } else if (Object.keys(expandedStudents).length === 0) {
        // Default expand the first student
        setExpandedStudents({ [studentGroups[0].studentId]: true });
      }
    }
  }, [studentGroups, searchTerm]);

  const toggleStudent = (studentId: string) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    studentGroups.forEach(g => { all[g.studentId] = true; });
    setExpandedStudents(all);
  };

  const collapseAll = () => {
    setExpandedStudents({});
  };

  // Pagination logic for flat list view
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSchedules = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Reset to page 1 when search or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, viewMode]);

  const confirmDeleteAttendance = async () => {
    if (!attendanceToDelete) return;
    try {
      await api.delete(`/schedules/${attendanceToDelete.id}/attendance`);
      showSuccess('Đã xóa điểm danh thành công!');
      fetchSchedules();
    } catch (error) {
      showError('Lỗi khi xóa điểm danh');
    } finally {
      setAttendanceToDelete(null);
    }
  };

  const confirmDelete = async () => {
    if (!scheduleToDelete) return;
    try {
      await api.delete(`/schedules/${scheduleToDelete.id}`);
      showSuccess('Đã xóa lịch học thành công!');
      setScheduleToDelete(null);
      fetchSchedules();
    } catch (error: any) {
      console.error('Delete error:', error);
      showError('Không thể xóa lịch học: ' + (error.response?.data?.error || error.message));
      setScheduleToDelete(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Lịch học</h1>
          <p>{user?.role === 'PARENT' ? 'Theo dõi lịch học và điểm danh của con' : 'Quản lý lịch dạy và điểm danh học sinh'}</p>
        </div>
        {user?.role === 'TUTOR' && (
          <button className="btn-primary" onClick={() => { setScheduleToEdit(null); setIsFormOpen(true); }}>
            <Plus size={18} />
            Thêm lịch học
          </button>
        )}
      </div>

      {/* TABS, VIEW MODE & SEARCH */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div className="page-tabs" style={{ marginBottom: 0 }}>
          <button
            className={`page-tab ${activeTab === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setActiveTab('COMPLETED')}
          >
            <CheckCircle size={15} />
            Đã điểm danh
            {completedList.length > 0 && <span className="page-tab-count">{completedList.length}</span>}
          </button>
          <button
            className={`page-tab ${activeTab === 'SCHEDULED' ? 'active' : ''}`}
            onClick={() => setActiveTab('SCHEDULED')}
          >
            <Clock size={15} />
            Lịch sắp tới
            {scheduledList.length > 0 && <span className="page-tab-count">{scheduledList.length}</span>}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* View Mode Toggle */}
          <div style={{ 
            display: 'flex', 
            background: 'var(--surface-solid)', 
            padding: '4px', 
            borderRadius: '20px', 
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('BY_STUDENT')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'BY_STUDENT' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'BY_STUDENT' ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
              }}
              title="Gom nhóm theo từng học sinh để xem ngày điểm danh rõ ràng"
            >
              <Users size={14} />
              Theo học sinh
            </button>
            <button
              type="button"
              onClick={() => setViewMode('FLAT_LIST')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'FLAT_LIST' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'FLAT_LIST' ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
              }}
              title="Xem danh sách tất cả các buổi theo dòng thời gian"
            >
              <List size={14} />
              Tất cả theo ngày
            </button>
          </div>

          {/* Search box */}
          {user?.role === 'TUTOR' && (
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-solid)', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border)', width: '260px', boxShadow: 'var(--shadow-sm)' }}>
              <Search size={16} color="var(--text-muted)" style={{ marginRight: 8, flexShrink: 0 }} />
              <input 
                type="text" 
                placeholder="Tìm học sinh, môn..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '14px', color: 'var(--text-main)', padding: 0 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: GROUPED BY STUDENT (ACCORDION) */}
      {viewMode === 'BY_STUDENT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Quick Header Bar */}
          {studentGroups.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px' }}>
              <span style={{ fontSize: '13.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {activeTab === 'COMPLETED' ? 'Điểm danh theo học sinh' : 'Lịch học theo học sinh'} ({studentGroups.length} học sinh • {filteredList.length} buổi)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={expandAll}
                  style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', background: 'transparent', padding: '4px 8px', borderRadius: '6px' }}
                >
                  Mở tất cả
                </button>
                <span style={{ color: 'var(--border)' }}>•</span>
                <button 
                  onClick={collapseAll}
                  style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', background: 'transparent', padding: '4px 8px', borderRadius: '6px' }}
                >
                  Thu gọn
                </button>
              </div>
            </div>
          )}

          {studentGroups.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
                <Calendar size={36} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                <p style={{ fontSize: '15px', fontWeight: 500 }}>
                  {searchTerm ? 'Không tìm thấy học sinh hoặc môn học phù hợp' : 'Chưa có dữ liệu nào trong mục này'}
                </p>
              </div>
            </div>
          ) : (
            studentGroups.map(group => {
              const isExpanded = !!expandedStudents[group.studentId];
              return (
                <div 
                  key={group.studentId}
                  className="glass-panel"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    border: isExpanded ? '1px solid rgba(155, 139, 244, 0.4)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: isExpanded ? '0 8px 24px rgba(155, 139, 244, 0.12)' : 'var(--shadow-sm)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {/* Student Header Bar - Clickable to toggle */}
                  <div 
                    onClick={() => toggleStudent(group.studentId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 22px',
                      background: isExpanded ? 'linear-gradient(90deg, rgba(155, 139, 244, 0.08) 0%, rgba(244, 114, 182, 0.04) 100%)' : 'var(--surface-solid)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                      flexWrap: 'wrap',
                      gap: '12px',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    {/* Left: Avatar + Name + Subjects */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div 
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '14px',
                          boxShadow: '0 3px 10px rgba(155, 139, 244, 0.3)',
                          flexShrink: 0
                        }}
                      >
                        {group.studentName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                            {group.studentName}
                          </h3>
                          {group.subjects.map(sub => (
                            <span 
                              key={sub} 
                              style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: 'var(--primary-light)',
                                color: 'var(--primary)',
                                fontWeight: 700
                              }}
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                          {activeTab === 'COMPLETED' ? (
                            <>
                              <strong style={{ color: 'var(--text-main)' }}>{group.schedules.length}</strong> buổi đã điểm danh
                              {group.schedules.length > 0 && ` • Gần nhất: ${new Date(group.schedules[0].date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
                            </>
                          ) : (
                            <>
                              <strong style={{ color: 'var(--text-main)' }}>{group.schedules.length}</strong> buổi sắp tới
                              {group.schedules.length > 0 && ` • Tiếp theo: ${new Date(group.schedules[0].date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Stats Summary + Click Indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      {activeTab === 'COMPLETED' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span 
                            style={{ 
                              fontSize: '12px', 
                              fontWeight: 700, 
                              padding: '4px 10px', 
                              borderRadius: '20px', 
                              background: 'var(--success-bg)', 
                              color: '#059669',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Check size={13} strokeWidth={3} /> {group.presentCount} Có mặt
                          </span>
                          {group.absentCount > 0 && (
                            <span 
                              style={{ 
                                fontSize: '12px', 
                                fontWeight: 700, 
                                padding: '4px 10px', 
                                borderRadius: '20px', 
                                background: 'var(--danger-bg)', 
                                color: 'var(--danger)' 
                              }}
                            >
                              {group.absentCount} Vắng mặt
                            </span>
                          )}
                          {group.lateCount > 0 && (
                            <span 
                              style={{ 
                                fontSize: '12px', 
                                fontWeight: 700, 
                                padding: '4px 10px', 
                                borderRadius: '20px', 
                                background: 'var(--warning-bg)', 
                                color: '#d97706' 
                              }}
                            >
                              {group.lateCount} Đi trễ
                            </span>
                          )}
                        </div>
                      )}

                      {/* Clickable pill indicator with rotating arrow */}
                      <div 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          color: isExpanded ? 'var(--primary)' : 'var(--text-muted)',
                          background: isExpanded ? 'rgba(155, 139, 244, 0.16)' : '#f1f5f9',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          transition: 'all 0.2s ease',
                          boxShadow: isExpanded ? '0 2px 6px rgba(155, 139, 244, 0.2)' : 'none'
                        }}
                      >
                        <span>{isExpanded ? 'Thu gọn ngày' : 'Bấm xem ngày điểm danh'}</span>
                        <ChevronDown 
                          size={16} 
                          style={{ 
                            transform: isExpanded ? 'rotate(180deg)' : 'none', 
                            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)' 
                          }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content: Clear table of dates for this student */}
                  {isExpanded && (
                    <div style={{ background: '#ffffff', overflowX: 'auto' }}>
                      <table className="data-table" style={{ margin: 0, width: '100%' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th style={{ width: '60px', textAlign: 'center' }}>STT</th>
                            <th>Ngày điểm danh</th>
                            <th>Môn học</th>
                            <th>Thời gian</th>
                            <th>Hình thức</th>
                            <th>Trạng thái</th>
                            <th>Nội dung / Nhận xét</th>
                            {(user?.role === 'TUTOR' || activeTab === 'COMPLETED') && <th style={{ textAlign: 'right' }}>Thao tác</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {group.schedules.map((schedule, idx) => (
                            <tr key={schedule.id} style={{ background: idx % 2 === 1 ? '#faf8fc' : '#ffffff' }}>
                              <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', fontSize: '13px' }}>
                                #{idx + 1}
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Calendar size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
                                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                                    {new Date(schedule.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                  </span>
                                </div>
                              </td>
                              <td>
                                {schedule.subject ? (
                                  <span className="badge" style={{ background: 'var(--primary)', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block' }}>
                                    {schedule.subject}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Chung</span>
                                )}
                              </td>
                              <td>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                                  {schedule.start_time} - {schedule.end_time}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                  {schedule.format === 'ONLINE' ? <Video size={14} color="var(--primary)" /> : <MapPin size={14} color="var(--accent)" />}
                                  {schedule.format === 'ONLINE' ? 'Trực tuyến' : 'Trực tiếp'}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px' }}>
                                  {activeTab === 'COMPLETED' && schedule.session ? (
                                    <span className={`status-badge ${schedule.session.attendance === 'PRESENT' ? 'active' : schedule.session.attendance === 'ABSENT' ? 'inactive' : 'pending'}`} style={{ fontSize: '12px', fontWeight: 700 }}>
                                      {schedule.session.attendance === 'PRESENT' ? 'Có mặt' : schedule.session.attendance === 'ABSENT' ? 'Vắng mặt' : 'Đi trễ'}
                                    </span>
                                  ) : (
                                    <span className={`status-badge ${schedule.status === 'SCHEDULED' ? 'scheduled' : 'completed'}`} style={{ fontSize: '12px', fontWeight: 700 }}>
                                      {schedule.status === 'SCHEDULED' ? 'Chưa học' : 'Đã học'}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ maxWidth: '240px' }}>
                                {schedule.session?.content || schedule.session?.feedback ? (
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={schedule.session.content || schedule.session.feedback}>
                                    {schedule.session.content || schedule.session.feedback}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '12px', color: '#cbd5e1', fontStyle: 'italic' }}>Chưa có nhận xét</span>
                                )}
                              </td>
                              {(user?.role === 'TUTOR' || activeTab === 'COMPLETED') && (
                                <td style={{ textAlign: 'right' }}>
                                  <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                    {user?.role === 'TUTOR' && activeTab === 'SCHEDULED' && (
                                      <>
                                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleMarkAttendance(schedule)}>
                                          <CheckCircle size={14} style={{ marginRight: '4px' }} />
                                          Điểm danh
                                        </button>
                                        <button className="btn-icon" title="Sửa lịch" onClick={() => { setScheduleToEdit(schedule); setIsFormOpen(true); }}>
                                          <Edit2 size={15} />
                                        </button>
                                        <button className="btn-icon danger" title="Xóa lịch" onClick={() => setScheduleToDelete(schedule)}>
                                          <Trash2 size={15} />
                                        </button>
                                      </>
                                    )}
                                    
                                    {user?.role === 'TUTOR' && activeTab === 'COMPLETED' && (
                                      <>
                                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleMarkAttendance(schedule)}>
                                          <Edit3 size={14} style={{ marginRight: '4px' }} />
                                          Sửa điểm danh
                                        </button>
                                        <button className="btn-icon danger" title="Xóa điểm danh" onClick={() => setAttendanceToDelete(schedule)}>
                                          <Trash2 size={15} />
                                        </button>
                                      </>
                                    )}

                                    {activeTab === 'COMPLETED' && schedule.session && (
                                      <button className="btn-icon" title="Xem nhận xét chi tiết" onClick={() => { setSelectedSchedule(schedule); setIsDetailOpen(true); }}>
                                        <FileText size={16} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW MODE 2: FLAT LIST TABLE */}
      {viewMode === 'FLAT_LIST' && (
        <div className="data-table-container glass-panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>Học sinh</th>
                <th>Môn học</th>
                <th>Thời gian</th>
                <th>Hình thức</th>
                <th>Trạng thái</th>
                {(user?.role === 'TUTOR' || activeTab === 'COMPLETED') && <th>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {currentSchedules.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
                      <Calendar size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                      <p>{searchTerm ? 'Không tìm thấy kết quả nào' : 'Chưa có lịch học nào trong mục này'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentSchedules.map(schedule => (
                  <tr key={schedule.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="dash-item-avatar" style={{ width: '32px', height: '32px', background: 'rgba(31, 92, 78, 0.1)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                          {schedule.student.name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 'bold' }}>{schedule.student.name}</span>
                      </div>
                    </td>
                    <td>
                      {schedule.subject ? (
                        <span className="badge" style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', whiteSpace: 'nowrap', display: 'inline-block' }}>
                          {schedule.subject}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Chung</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>{new Date(schedule.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{schedule.start_time} - {schedule.end_time}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {schedule.format === 'ONLINE' ? <Video size={14} /> : <MapPin size={14} />}
                        {schedule.format === 'ONLINE' ? 'Trực tuyến' : 'Trực tiếp'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <span className={`status-badge ${schedule.status === 'SCHEDULED' ? 'scheduled' : 'completed'}`}>
                          {schedule.status === 'SCHEDULED' ? 'Chưa học' : 'Đã học'}
                        </span>
                        {activeTab === 'COMPLETED' && schedule.session && (
                          <span className={`status-badge ${schedule.session.attendance === 'PRESENT' ? 'active' : schedule.session.attendance === 'ABSENT' ? 'inactive' : 'pending'}`} style={{ fontSize: '11px' }}>
                            {schedule.session.attendance === 'PRESENT' ? 'Có mặt' : schedule.session.attendance === 'ABSENT' ? 'Vắng mặt' : 'Đi trễ'}
                          </span>
                        )}
                      </div>
                    </td>
                    {(user?.role === 'TUTOR' || activeTab === 'COMPLETED') && (
                      <td>
                        <div className="action-buttons">
                          {user?.role === 'TUTOR' && activeTab === 'SCHEDULED' && (
                            <>
                              <button className="btn-primary" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => handleMarkAttendance(schedule)}>
                                <CheckCircle size={14} style={{ marginRight: '4px' }} />
                                Điểm danh
                              </button>
                              <button className="btn-icon" title="Sửa lịch" onClick={() => { setScheduleToEdit(schedule); setIsFormOpen(true); }}>
                                <Edit2 size={15} />
                              </button>
                              <button className="btn-icon danger" title="Xóa lịch" onClick={() => setScheduleToDelete(schedule)}>
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                          
                          {user?.role === 'TUTOR' && activeTab === 'COMPLETED' && (
                            <>
                              <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => handleMarkAttendance(schedule)}>
                                <Edit3 size={14} style={{ marginRight: '4px' }} />
                                Sửa điểm danh
                              </button>
                              <button className="btn-icon danger" title="Xóa điểm danh" onClick={() => setAttendanceToDelete(schedule)}>
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}

                          {activeTab === 'COMPLETED' && schedule.session && (
                            <button className="btn-icon" title="Xem nhận xét" onClick={() => { setSelectedSchedule(schedule); setIsDetailOpen(true); }}>
                              <FileText size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', gap: '0.5rem', borderTop: '1px solid var(--border)' }}>
              <button 
                className="btn-secondary" 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                style={{ padding: '4px 12px', fontSize: '14px' }}
              >
                Trang trước
              </button>
              <span style={{ margin: '0 1rem', fontSize: '14px', color: 'var(--text-muted)' }}>
                Trang {currentPage} / {totalPages}
              </span>
              <button 
                className="btn-secondary" 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                style={{ padding: '4px 12px', fontSize: '14px' }}
              >
                Trang sau
              </button>
            </div>
          )}
        </div>
      )}

      {/* FORMS */}
      {isFormOpen && (
        <ScheduleForm
          schedule={scheduleToEdit || undefined}
          onClose={() => {
            setIsFormOpen(false);
            setScheduleToEdit(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setScheduleToEdit(null);
            fetchSchedules();
            showSuccess(scheduleToEdit ? 'Đã cập nhật lịch học!' : 'Đã tạo lịch học thành công!');
          }}
        />
      )}

      {isAttendanceOpen && selectedSchedule && (
        <AttendanceForm
          schedule={selectedSchedule}
          onClose={() => {
            setIsAttendanceOpen(false);
            setSelectedSchedule(null);
          }}
          onSuccess={() => {
            setIsAttendanceOpen(false);
            setSelectedSchedule(null);
            fetchSchedules();
            showSuccess('Đã điểm danh thành công!');
          }}
        />
      )}

      {isDetailOpen && selectedSchedule && (
        <SessionDetailModal
          schedule={selectedSchedule}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedSchedule(null);
          }}
        />
      )}

      {attendanceToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Xác nhận xóa điểm danh</h2>
              <button className="btn-icon" onClick={() => setAttendanceToDelete(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>
                Bạn có chắc chắn muốn xóa điểm danh của buổi học này? Hệ thống sẽ tự động giảm số buổi đã học trong chu kỳ học phí tương ứng (nếu có).
              </p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn-secondary" onClick={() => setAttendanceToDelete(null)}>Hủy</button>
              <button className="btn-primary" style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={confirmDeleteAttendance}>Xóa điểm danh</button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM MODAL */}
      {scheduleToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Xác nhận xóa</h2>
              <button className="btn-icon" onClick={() => setScheduleToDelete(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>
                {scheduleToDelete.status !== 'SCHEDULED' 
                  ? 'Bạn có chắc chắn muốn xóa lịch đã điểm danh này? Toàn bộ dữ liệu điểm danh sẽ bị xóa vĩnh viễn.'
                  : 'Bạn có chắc chắn muốn xóa lịch học này không?'}
              </p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn-secondary" onClick={() => setScheduleToDelete(null)}>Hủy</button>
              <button className="btn-primary" style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={confirmDelete}>Xóa lịch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulesList;
