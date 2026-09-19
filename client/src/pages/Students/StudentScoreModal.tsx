import { useState, useEffect } from 'react';
import { X, Award, FileText } from 'lucide-react';
import api from '../../utils/api';
import type { Student } from './StudentsList';

interface StudentScoreModalProps {
  student: Student;
  onClose: () => void;
}

interface ScoreRecord {
  id: string;
  title: string;
  subject: string | null;
  score: number;
  graded_date: string;
}

const StudentScoreModal: React.FC<StudentScoreModalProps> = ({ student, onClose }) => {
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await api.get(`/students/${student.id}/scores`);
        const homeworks = res.data.homeworks || [];
        setScores(homeworks);
        
        // Find the first subject to set as active tab
        const subjects = Array.from(new Set(homeworks.map((h: any) => h.subject || 'Chung')));
        if (subjects.length > 0) {
          setActiveTab(subjects[0] as string);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchScores();
  }, [student.id]);

  // Group scores by subject
  const groupedScores = scores.reduce((acc, curr) => {
    const subject = curr.subject || 'Chung';
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(curr);
    return acc;
  }, {} as Record<string, ScoreRecord[]>);

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>Bảng điểm: {student.name}</h2>
          <button className="btn-icon" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="data-table-container glass-panel" style={{ marginTop: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
          {isLoading ? (
            <p style={{ textAlign: 'center', padding: '1rem' }}>Đang tải...</p>
          ) : scores.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '1rem' }}>Học sinh chưa có điểm bài tập nào.</p>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                {Object.keys(groupedScores).map(subject => (
                  <button
                    key={subject}
                    className={`tab-btn ${activeTab === subject ? 'active' : ''}`}
                    onClick={() => setActiveTab(subject)}
                    style={{ 
                      background: 'none', border: 'none', borderBottom: activeTab === subject ? '2px solid var(--accent)' : '2px solid transparent',
                      color: activeTab === subject ? 'var(--accent)' : 'var(--text-muted)', fontWeight: activeTab === subject ? 'bold' : 'normal',
                      padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '14px'
                    }}
                  >
                    {subject}
                  </button>
                ))}
              </div>

              {activeTab && groupedScores[activeTab] && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0.5rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px' }}>
                    <h5 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={16} /> Môn: {activeTab}
                    </h5>
                    <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                      TB: {(groupedScores[activeTab].reduce((acc, curr) => acc + curr.score, 0) / groupedScores[activeTab].length).toFixed(1)} / 10
                    </span>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Bài tập</th>
                        <th>Ngày chấm</th>
                        <th>Điểm số</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedScores[activeTab].map(s => (
                        <tr key={s.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText size={16} color="var(--text-muted)" />
                              {s.title}
                            </div>
                          </td>
                          <td>{new Date(s.graded_date).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{s.score} / 10</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudentScoreModal;
