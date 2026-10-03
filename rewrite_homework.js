const fs = require('fs');

const content = `import { useState, useEffect } from 'react';
import { Plus, FileText, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import HomeworkForm from './HomeworkForm';
import HomeworkDetailModal from './HomeworkDetailModal';

export interface Homework {
  id: string;
  title: string;
  subject: string | null;
  description: string;
  due_date: string;
  status: string;
  student: {
    id: string;
    name: string;
  };
}

const HomeworkList: React.FC = () => {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailHomework, setSelectedDetailHomework] = useState<Homework | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
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

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PENDING' ? 'COMPLETED' : 'PENDING';
    // Optimistic update
    setHomeworks(prev => prev.map(hw => hw.id === id ? { ...hw, status: newStatus } : hw));
    try {
      await api.patch(\`/homework/\${id}/status\`, { status: newStatus });
      if (newStatus === 'COMPLETED') {
        showSuccess('Đã đánh dấu hoàn thành bài tập!');
      } else {
        showSuccess('Đã đánh dấu chưa làm bài tập!');
      }
    } catch (err) {
      console.error(err);
      showError('Lỗi cập nhật trạng thái');
      // Revert on error
      fetchHomeworks();
    }
  };

  const statusPriority: Record<string, number> = {
    PENDING: 1,
    COMPLETED: 2,
    SUBMITTED: 2,
    GRADED: 2,
  };

  const sortedHomeworks = [...homeworks].sort((a, b) => {
    const pA = statusPriority[a.status] || 99;
    const pB = statusPriority[b.status] || 99;
    if (pA !== pB) return pA - pB;
    return new Date(b.due_date || 0).getTime() - new Date(a.due_date || 0).getTime();
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHomeworks = sortedHomeworks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedHomeworks.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Bài tập</h1>
          <p>{user?.role === 'PARENT' ? 'Theo dõi và đánh dấu hoàn thành bài tập của con' : 'Quản lý bài tập về nhà'}</p>
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
              <th style={{ width: '50px', textAlign: 'center' }}>Xong</th>
              <th>Học sinh</th>
              <th>Môn học</th>
              <th>Bài tập</th>
              <th>Hạn nộp</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {currentHomeworks.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Chưa có bài tập nào</td>
              </tr>
            ) : (
              currentHomeworks.map(hw => {
                const isDone = hw.status === 'COMPLETED' || hw.status === 'SUBMITTED' || hw.status === 'GRADED';
                return (
                <tr key={hw.id} style={{ opacity: isDone ? 0.7 : 1 }}>
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={isDone}
                      onChange={() => handleToggleStatus(hw.id, isDone ? 'COMPLETED' : 'PENDING')}
                      style={{ transform: 'scale(1.5)', cursor: 'pointer', accentColor: 'var(--primary)' }}
                    />
                  </td>
                  <td>{hw.student.name}</td>
                  <td>
                    {hw.subject ? (
                      <span className="badge" style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', whiteSpace: 'nowrap', display: 'inline-block' }}>
                        {hw.subject}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Chung</span>
                    )}
                  </td>
                  <td>
                    <strong style={{ textDecoration: isDone ? 'line-through' : 'none' }}>{hw.title}</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>{hw.description}</p>
                  </td>
                  <td>{hw.due_date ? new Date(hw.due_date).toLocaleDateString('vi-VN') : 'Không có hạn'}</td>
                  <td>
                    <div className="action-buttons" style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }} 
                        onClick={() => { setSelectedDetailHomework(hw); setDetailModalOpen(true); }}
                      >
                        <FileText size={14} />
                        Chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })
            )}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', gap: '0.5rem', borderTop: '1px solid #eee' }}>
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

      {isFormOpen && (
        <HomeworkForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={() => {
            fetchHomeworks();
            setIsFormOpen(false);
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
`;

fs.writeFileSync('client/src/pages/Homework/HomeworkList.tsx', content);
console.log('Re-wrote HomeworkList.tsx successfully');
