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
    <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
      <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text)' }}>Bảng điểm: {student.name}</h2>
      
      {isLoading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</p>
      ) : scores.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Học sinh chưa có điểm bài tập nào.</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
            {Object.keys(groupedScores).map(subject => (
              <button
                key={subject}
                className={`tab-btn ${activeTab === subject ? 'active' : ''}`}
                onClick={() => setActiveTab(subject)}
                style={{ 
                  background: 'none', border: 'none', borderBottom: activeTab === subject ? '2px solid var(--accent)' : '2px solid transparent',
                  color: activeTab === subject ? 'var(--accent)' : 'var(--text-muted)', fontWeight: activeTab === subject ? 'bold' : 'normal',
                  padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '15px'
                }}
              >
                {subject}
              </button>
            ))}
          </div>

          {activeTab && groupedScores[activeTab] && (
            <div style={{ padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '12px', background: 'var(--glass-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={20} color="var(--primary)" />
                  Môn học: <span style={{ color: 'var(--primary)' }}>{activeTab}</span>
                </h3>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Điểm trung bình</span>
                  <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {(groupedScores[activeTab].reduce((acc, curr) => acc + curr.score, 0) / groupedScores[activeTab].length).toFixed(1)} / 10
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
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>- {Math.round(s.score * 10)}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentScoreCard;
