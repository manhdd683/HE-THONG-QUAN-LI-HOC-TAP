import { useState, useEffect } from 'react';
import { Award, FileText } from 'lucide-react';
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
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await api.get(`/students/${student.id}/scores`);
        const homeworks = res.data.homeworks || [];
        setScores(homeworks);
        
        // Expand the first subject by default
        const subjects = Array.from(new Set(homeworks.map((h: any) => h.subject || 'Chung')));
        if (subjects.length > 0) {
          setExpandedSubjects([subjects[0] as string]);
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
    <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
      <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text)' }}>Bảng điểm: {student.name}</h2>
      
      {isLoading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</p>
      ) : scores.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Học sinh chưa có điểm bài tập nào.</p>
      ) : (
        <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.keys(groupedScores).map(subject => {
            const isExpanded = expandedSubjects.includes(subject);
            const toggleExpand = () => {
              setExpandedSubjects(prev => 
                isExpanded ? prev.filter(s => s !== subject) : [...prev, subject]
              );
            };

            const avgScore = (groupedScores[subject].reduce((acc, curr) => acc + curr.score, 0) / groupedScores[subject].length).toFixed(1);

            return (
              <div key={subject} style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', background: 'var(--glass-bg)', overflow: 'hidden' }}>
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', cursor: 'pointer', background: isExpanded ? 'rgba(255, 255, 255, 0.4)' : 'transparent' }}
                  onClick={toggleExpand}
                >
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                    <Award size={18} color="var(--primary)" />
                    Môn học: <span style={{ color: 'var(--primary)' }}>{subject}</span>
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Điểm TB</span>
                      <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {avgScore} / 10
                      </p>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {isExpanded ? '▲ Thu gọn' : '▼ Chi tiết'}
                    </span>
                  </div>
                </div>
                
                {isExpanded && (
                  <div style={{ padding: '0 1rem 1rem 1rem' }}>
                    <div style={{ overflowX: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                      <table className="data-table" style={{ width: '100%', fontSize: '0.9rem' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '8px 12px' }}>Bài tập</th>
                            <th style={{ padding: '8px 12px' }}>Ngày chấm</th>
                            <th style={{ padding: '8px 12px' }}>Điểm số</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedScores[subject].map(s => (
                            <tr key={s.id}>
                              <td style={{ padding: '8px 12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <FileText size={14} color="var(--text-muted)" />
                                  <span>{s.title}</span>
                                </div>
                              </td>
                              <td style={{ padding: '8px 12px' }}>{new Date(s.graded_date).toLocaleDateString('vi-VN')}</td>
                              <td style={{ padding: '8px 12px' }}>
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
                )}
              </div>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
};

export default StudentScoreCard;
