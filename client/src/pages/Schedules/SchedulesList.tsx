import { useState, useEffect } from 'react';
import { Plus, CheckCircle, Clock, Calendar, MapPin, Video, User, Edit2, Trash2, Edit3 } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import ScheduleForm from './ScheduleForm';
import AttendanceForm from './AttendanceForm';

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
    content?: string;
    comments?: any[];
  };
}

const SchedulesList: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<Schedule | null>(null);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [activeTab, setActiveTab] = useState<'SCHEDULED' | 'COMPLETED'>('SCHEDULED');
  const { user } = useAuth();

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

      {/* TABS */}
      <div className="page-tabs">
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

      {/* CARD GRID */}
      {displayList.length === 0 ? (
        <div className="page-empty glass-panel">
          <div className="page-empty-icon">
            <Calendar size={32} />
          </div>
          <h3>Chưa có lịch học</h3>
          <p>Chưa có lịch học nào trong mục này</p>
        </div>
      ) : (
        <div className="schedule-grid">
          {displayList.map(schedule => (
            <div key={schedule.id} className="schedule-card">
              <div className="schedule-card-header">
                <div className="schedule-card-title">
                  {schedule.subject || 'Lịch học'}
                  <span className={`status-badge ${schedule.status === 'SCHEDULED' ? 'scheduled' : 'completed'}`}>
                    {schedule.status === 'SCHEDULED' ? 'Chưa học' : 'Đã học'}
                  </span>
                </div>
                {user?.role === 'TUTOR' && (
                  <div className="action-buttons">
                    <button
                      className="btn-icon"
                      title="Sửa lịch"
                      onClick={() => { setScheduleToEdit(schedule); setIsFormOpen(true); }}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      className="btn-icon danger"
                      title="Xóa lịch"
                      onClick={async () => {
                        if (window.confirm(activeTab === 'COMPLETED'
                          ? 'Bạn có chắc chắn muốn xóa lịch đã điểm danh này? Toàn bộ dữ liệu điểm danh sẽ bị xóa.'
                          : 'Bạn có chắc chắn muốn xóa lịch này?')) {
                          try {
                            await api.delete(`/schedules/${schedule.id}`);
                            fetchSchedules();
                          } catch (error: any) {
                            console.error('Delete error:', error);
                            alert('Không thể xóa lịch học: ' + (error.response?.data?.error || error.message));
                          }
                        }
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              <div className="schedule-student-badge">
                <User size={13} />
                {schedule.student.name}
              </div>

              <div className="schedule-meta">
                <div className="schedule-meta-row">
                  <Calendar size={14} />
                  {new Date(schedule.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="schedule-meta-row">
                  <Clock size={14} />
                  {schedule.start_time} - {schedule.end_time}
                </div>
                <div className="schedule-meta-row">
                  {schedule.format === 'ONLINE' ? <Video size={14} /> : <MapPin size={14} />}
                  {schedule.format === 'ONLINE' ? 'Trực tuyến' : 'Trực tiếp'}
                </div>
              </div>

              {user?.role === 'TUTOR' && activeTab === 'SCHEDULED' && (
                <div className="schedule-actions" style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--glass-border)' }}>
                  <button className="btn-primary" style={{ width: '100%' }} onClick={() => handleMarkAttendance(schedule)}>
                    <CheckCircle size={16} />
                    Điểm danh
                  </button>
                </div>
              )}

              {user?.role === 'TUTOR' && activeTab === 'COMPLETED' && (
                <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
                      <CheckCircle size={14} /> Đã điểm danh
                    </span>
                    <span className={`status-badge ${schedule.session?.attendance === 'PRESENT' ? 'active' : schedule.session?.attendance === 'ABSENT' ? 'inactive' : 'pending'}`}>
                      {schedule.session?.attendance === 'PRESENT' ? 'Có mặt' : schedule.session?.attendance === 'ABSENT' ? 'Vắng mặt' : 'Đi trễ'}
                    </span>
                  </div>
                  <button className="btn-secondary" style={{ width: '100%' }} onClick={() => handleMarkAttendance(schedule)}>
                    <Edit3 size={14} /> Sửa điểm danh
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <ScheduleForm
          onClose={() => setIsFormOpen(false)}
          onSuccess={fetchSchedules}
          initialData={scheduleToEdit}
        />
      )}

      {isAttendanceOpen && selectedSchedule && (
        <AttendanceForm
          schedule={selectedSchedule}
          onClose={() => setIsAttendanceOpen(false)}
          onSuccess={fetchSchedules}
        />
      )}
    </div>
  );
};

export default SchedulesList;
