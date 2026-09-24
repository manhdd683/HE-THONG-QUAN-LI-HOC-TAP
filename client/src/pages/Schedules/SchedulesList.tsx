// @ts-nocheck
import { useState, useEffect } from 'react';
import { Plus, CheckCircle, Clock, Calendar, MapPin, Video, User, Edit2, Trash2, Edit3, Search, FileText } from 'lucide-react';
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
  const itemsPerPage = 5;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<Schedule | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);
  const [attendanceToDelete, setAttendanceToDelete] = useState<Schedule | null>(null);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [activeTab, setActiveTab] = useState<'SCHEDULED' | 'COMPLETED'>('SCHEDULED');
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

  // Pagination logic
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
  }, [searchTerm, activeTab]);


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

      {/* TABS & SEARCH */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-tabs" style={{ marginBottom: 0 }}>
          <button
            className={`page-tab ${activeTab === 'SCHEDULED' ? 'active' : ''}`}
            onClick={() => setActiveTab('SCHEDULED')}
          >
            <Clock size={14} />
            Lịch sắp tới
            {scheduledList.length > 0 && <span className="page-tab-count">{scheduledList.length}</span>}
          </button>
          <button
            className={`page-tab ${activeTab === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setActiveTab('COMPLETED')}
          >
            <CheckCircle size={14} />
            Đã điểm danh
            {completedList.length > 0 && <span className="page-tab-count">{completedList.length}</span>}
          </button>
        </div>

        {user?.role === 'TUTOR' && (
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-solid)', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border)', width: '300px' }}>
            <Search size={16} color="var(--text-muted)" style={{ marginRight: 8 }} />
            <input 
              type="text" 
              placeholder="Tìm học sinh, môn học..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '14px', color: 'var(--text-main)' }}
            />
          </div>
        )}
      </div>

      {/* DATA TABLE */}
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
