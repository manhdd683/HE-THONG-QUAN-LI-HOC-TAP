import { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import type { Student } from '../Students/StudentsList';
import StudentScoreModal from '../Students/StudentScoreModal';
import StudentScoreCard from './StudentScoreCard';

const ScoresPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.get('/students');
        setStudents(response.data);
      } catch (error) {
        console.error('Lỗi khi tải danh sách học sinh', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Bảng điểm</h1>
          <p>{user?.role === 'PARENT' ? 'Bảng điểm và xếp loại học tập của con' : 'Danh sách học sinh và điểm số trung bình'}</p>
        </div>
      </div>

      {user?.role === 'PARENT' ? (
        <div>
          {isLoading ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</p>
          ) : students.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
              <p>Chưa có dữ liệu học sinh.</p>
            </div>
          ) : (
            students.map(student => (
              <StudentScoreCard key={student.id} student={student} />
            ))
          )}
        </div>
      ) : (
        <div className="data-table-container glass-panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã HS</th>
                <th>Họ và tên</th>
                <th>Lớp/Môn</th>
                <th>Phụ huynh</th>
                <th>Trạng thái</th>
                <th>Bảng điểm</th>
              </tr>
            </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Chưa có dữ liệu</td>
              </tr>
            ) : (
              students.map(student => (
                <tr key={student.id}>
                  <td>{student.student_code}</td>
                  <td>{student.name}</td>
                  <td>{student.grade} - {student.subject}</td>
                  {user?.role === 'TUTOR' && (
                    <td>
                      <div>{student.parent?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.parent?.phone}</div>
                    </td>
                  )}
                  <td>
                    <span className={`status-badge status-${student.status.toLowerCase()}`}>
                      {student.status === 'ACTIVE' ? 'Đang học' : 
                       student.status === 'INACTIVE' ? 'Tạm nghỉ' : 'Đã nghỉ'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '12px' }} 
                      onClick={() => { setSelectedStudent(student); setIsScoreModalOpen(true); }} 
                      title="Xem chi tiết điểm số"
                    >
                      <Award size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} color="var(--primary)" />
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      {isScoreModalOpen && selectedStudent && (
        <StudentScoreModal 
          student={selectedStudent} 
          onClose={() => setIsScoreModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default ScoresPage;
