import { useState, useEffect } from 'react';
import { Plus, CheckSquare, FileText, Send } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import HomeworkForm from './HomeworkForm';
import GradeForm from './GradeForm';
import HomeworkDetailModal from './HomeworkDetailModal';

export interface Homework {
  id: string;
  title: string;
  subject: string | null;
  description: string;
  due_date: string;
  status: string;
  score: number | null;
  feedback: string | null;
  student: {
    id: string;
    name: string;
  };
}

const HomeworkList: React.FC = () => {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [selectedDetailHomework, setSelectedDetailHomework] = useState<Homework | null>(null);
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const fetchHomeworks = async () => {
    try {
      const response = await api.get('/homework');
      setHomeworks(response.data);
    } catch (error) {
      console.error('Failed to fetch homeworks', error);
    }
  };

  useEffect(() => {
    fetchHomeworks();
  }, []);

  const handleGrade = (hw: Homework) => {
    setSelectedHomework(hw);
    setIsGradeOpen(true);
  };

  const handleSubmit = async (id: string) => {
    try {
      await api.patch(`/homework/${id}/status`, { status: 'SUBMITTED', submission_text: 'Đã nộp bài qua hệ thống' });
      fetchHomeworks();
      showSuccess('Đã nộp bài thành công!');
    } catch (err) {
      console.error(err);
      showError('Lỗi nộp bài');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Bài tập</h1>
          <p>{user?.role === 'PARENT' ? 'Theo dõi bài tập về nhà và điểm số của con' : 'Quản lý bài tập về nhà và điểm số'}</p>
        </div>
        {user?.role === 'TUTOR' && (
          <button className="btn-primary" onClick={() => setIsFormOpen(true)} style={{ display: 'flex', gap: '8px', width: 'auto' }}>
            <Plus size={20} />
            <span>Giao Bài Tập</span>
          </button>
        )}
      </div>

      <div className="data-table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Học sinh</th>
              <th>Môn học</th>
              <th>Bài tập</th>
              <th>Hạn nộp</th>
              <th>Trạng thái</th>
              <th>Điểm</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {homeworks.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Chưa có bài tập nào</td>
              </tr>
            ) : (
              homeworks.map(hw => (
                <tr key={hw.id}>
                  <td>{hw.student.name}</td>
                  <td>
                    {hw.subject ? (
                      <span className="badge" style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                        {hw.subject}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Chung</span>
                    )}
                  </td>
                  <td>
                    <strong>{hw.title}</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>{hw.description}</p>
                  </td>
                  <td>{hw.due_date ? new Date(hw.due_date).toLocaleDateString('vi-VN') : 'Không có hạn'}</td>
                  <td>
                    <span className={`status-badge status-${hw.status.toLowerCase()}`}>
                      {hw.status === 'PENDING' ? 'Chờ nộp' : hw.status === 'SUBMITTED' ? 'Đã nộp' : hw.status === 'GRADED' ? 'Đã chấm' : hw.status}
                    </span>
                  </td>
                  <td>
                    {hw.score !== null ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{hw.score} / 10</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({Math.round(hw.score * 10)}%)</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {user?.role === 'TUTOR' && (hw.status === 'PENDING' || hw.status === 'SUBMITTED') && (
                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleGrade(hw)}>
                          <CheckSquare size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                          Chấm điểm
                        </button>
                      )}
                      
                      {user?.role === 'PARENT' && hw.status === 'PENDING' && (
                         <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--secondary)' }} onClick={() => handleSubmit(hw.id)}>
                         <Send size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                         Nộp bài (Demo)
                       </button>
                      )}
                      
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} 
                        onClick={() => { setSelectedDetailHomework(hw); setDetailModalOpen(true); }}
                      >
                        <FileText size={14} />
                        Chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <HomeworkForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={() => {
            fetchHomeworks();
            showSuccess('Đã giao bài tập thành công!');
          }} 
        />
      )}

      {isGradeOpen && selectedHomework && (
        <GradeForm 
          homework={selectedHomework} 
          onClose={() => setIsGradeOpen(false)} 
          onSuccess={() => {
            fetchHomeworks();
            showSuccess('Đã chấm điểm thành công!');
          }} 
        />
      )}

      {detailModalOpen && selectedDetailHomework && (
        <HomeworkDetailModal 
          homework={selectedDetailHomework}
          onClose={() => setDetailModalOpen(false)}
        />
      )}
    </div>
  );
};

export default HomeworkList;
