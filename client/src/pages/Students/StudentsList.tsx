import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import StudentForm from './StudentForm';
import StudentScoreModal from './StudentScoreModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export interface Student {
  id: string;
  student_code: string;
  name: string;
  dob: string | null;
  gender: string | null;
  school: string | null;
  grade: string | null;
  subject: string | null;
  price_per_session: number;
  start_date: string | null;
  status: string;
  parent: {
    name: string;
    email: string;
    phone: string | null;
  };
  parent_id: string;
  student_subjects?: {
    subject: string;
    price_per_session: number;
  }[];
}

const StudentsList: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { user } = useAuth();

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách học sinh', error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAdd = () => {
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await api.delete(`/students/${studentToDelete.id}`);
      setToastMsg({ type: 'success', text: 'Đã xóa học sinh thành công!' });
      setStudentToDelete(null);
      fetchStudents();
      setTimeout(() => setToastMsg(null), 3000);
    } catch (error: any) {
      console.error('Delete error:', error);
      setToastMsg({ type: 'error', text: 'Không thể xóa học sinh: ' + (error.response?.data?.error || error.response?.data?.message || error.message) });
      setStudentToDelete(null);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>{user?.role === 'TUTOR' ? 'Danh sách Học sinh' : 'Hồ sơ của con'}</h1>
          <p>{user?.role === 'TUTOR' ? 'Quản lý thông tin học sinh trong hệ thống' : 'Xem thông tin hồ sơ và trạng thái học tập của con'}</p>
        </div>
        {user?.role === 'TUTOR' && (
          <button className="btn-primary" onClick={handleAdd} style={{ display: 'flex', gap: '0.5rem', width: 'auto' }}>
            <Plus size={20} />
            <span>Thêm học sinh</span>
          </button>
        )}
      </div>

      <div className="data-table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã HS</th>
              <th>Họ và tên</th>
              <th>Lớp/Môn</th>
              {user?.role === 'TUTOR' && <th>Phụ huynh</th>}
              <th>Trạng thái</th>
              {user?.role === 'TUTOR' && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={user?.role === 'TUTOR' ? 6 : 4} style={{ textAlign: 'center', padding: '2rem' }}>Chưa có dữ liệu</td>
              </tr>
            ) : (
              students.map(student => (
                <tr key={student.id}>
                  <td>{student.student_code}</td>
                  <td>{student.name}</td>
                  <td>
                    <div style={{ fontWeight: '600' }}>
                      {student.grade ? `Lớp ${student.grade}` : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa cập nhật lớp</span>}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      {student.student_subjects && student.student_subjects.length > 0 ? (
                        student.student_subjects.map((s: any, idx: number) => (
                          <span key={idx} className="subject-badge">
                            {s.subject} <span className="subject-price">({s.price_per_session.toLocaleString()}đ)</span>
                          </span>
                        ))
                      ) : (
                        <span className="subject-badge empty">
                          {student.subject || 'Chưa cập nhật môn'} <span className="subject-price">({student.price_per_session?.toLocaleString() || 0}đ)</span>
                        </span>
                      )}
                    </div>
                  </td>
                  {user?.role === 'TUTOR' && <td>{student.parent?.name}</td>}
                  <td>
                    <span className={`status-badge status-${student.status.toLowerCase()}`}>
                      {student.status === 'ACTIVE' ? 'Hoạt động' : student.status === 'INACTIVE' ? 'Vô hiệu hóa' : student.status}
                    </span>
                  </td>
                  {user?.role === 'TUTOR' && (
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" onClick={() => handleEdit(student)} title="Chỉnh sửa">
                          <Edit size={18} />
                        </button>
                        <button className="btn-icon danger" title="Khóa/Xóa" onClick={() => setStudentToDelete(student)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && user?.role === 'TUTOR' && (
        <StudentForm 
          student={selectedStudent} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchStudents} 
        />
      )}

      {isScoreModalOpen && selectedStudent && (
        <StudentScoreModal 
          student={selectedStudent} 
          onClose={() => setIsScoreModalOpen(false)} 
        />
      )}

      {/* CUSTOM CONFIRM MODAL */}
      {studentToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Xác nhận xóa</h2>
              <button className="btn-icon" onClick={() => setStudentToDelete(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa học sinh <strong>{studentToDelete.name}</strong> không? Các dữ liệu liên quan sẽ bị ẩn.</p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn-secondary" onClick={() => setStudentToDelete(null)}>Hủy</button>
              <button className="btn-primary" style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={confirmDelete}>Xóa học sinh</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST MESSAGE */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', 
          backgroundColor: toastMsg.type === 'success' ? 'var(--success)' : 'var(--danger)',
          color: '#fff', padding: '12px 24px', borderRadius: '8px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999,
          fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {toastMsg.type === 'success' ? <span style={{ fontSize: '18px' }}>✓</span> : null}
          {toastMsg.text}
        </div>
      )}
    </div>
  );
};

export default StudentsList;
