import { useState, useEffect } from 'react';
import { Award, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import type { Student } from '../Students/StudentsList';

interface ScoreRecord {
  id: string;
  title: string;
  subject: string | null;
  score: number;
  graded_date: string;
}

const StudentScoreCard: React.FC<{ student: Student }> = ({ student }) => {
  const navigate = useNavigate();
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await api.get(`/students/${student.id}/scores`);
        const homeworks = res.data.homeworks || [];
        setScores(homeworks);
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
    <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
      <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text)' }}>Bảng điểm: {student.name}</h2>
      
      {isLoading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</p>
      ) : scores.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Học sinh chưa có điểm bài tập nào.</p>
      ) : (
        <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.keys(groupedScores).length === 1 ? (
            // ONE SUBJECT: Render inline
            Object.keys(groupedScores).map(subject => {
              const avgScore = (groupedScores[subject].reduce((acc, curr) => acc + curr.score, 0) / groupedScores[subject].length).toFixed(1);
              return (
                <div key={subject} style={{ padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '12px', background: 'var(--glass-bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={20} color="var(--primary)" />
                      Môn học: <span style={{ color: 'var(--primary)' }}>{subject}</span>
                    </h3>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Điểm trung bình</span>
                      <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {avgScore} / 10
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Bài tập</th>
                          <th>Ngày chấm</th>
                          <th>Điểm số</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedScores[subject].map(s => (
                          <tr key={s.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={16} color="var(--text-muted)" />
                                <span>{s.title}</span>
                              </div>
                            </td>
                            <td>{new Date(s.graded_date).toLocaleDateString('vi-VN')}</td>
                            <td>
                              <span style={{ fontWeight: '600', color: s.score >= 8 ? 'var(--success)' : s.score < 5 ? 'var(--danger)' : 'var(--primary)' }}>
                                {s.score} / 10
                              </span>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                                - {s.score * 10}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          ) : (
            // MULTIPLE SUBJECTS: Render cards that navigate
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {Object.keys(groupedScores).map(subject => {
                const avgScore = (groupedScores[subject].reduce((acc, curr) => acc + curr.score, 0) / groupedScores[subject].length).toFixed(1);
                return (
                  <div 
                    key={subject} 
                    className="glass-panel hover-effect"
                    style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid var(--border)' }}
                    onClick={() => navigate(`/parent/scores/${student.id}/${encodeURIComponent(subject)}`)}
                  >
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', color: 'var(--primary)' }}>
                      <Award size={18} /> {subject}
                    </h3>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Có {groupedScores[subject].length} bài tập đã chấm
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--glass-border)' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Điểm TB</span>
                        <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.2rem' }}>{avgScore}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600 }}>
                        Chi tiết <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
};

export default StudentScoreCard;
