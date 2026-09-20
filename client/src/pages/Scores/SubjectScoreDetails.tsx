import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, FileText, ArrowLeft } from 'lucide-react';
import api from '../../utils/api';
import type { Student } from '../Students/StudentsList';

interface ScoreRecord {
  id: string;
  title: string;
  subject: string | null;
  score: number;
  graded_date: string;
}

const SubjectScoreDetails: React.FC = () => {
  const { studentId, subject } = useParams<{ studentId: string; subject: string }>();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentRes = await api.get(`/students/${studentId}`);
        setStudent(studentRes.data);
        
        const scoresRes = await api.get(`/students/${studentId}/scores`);
        const homeworks = scoresRes.data.homeworks || [];
        
        const decodedSubject = decodeURIComponent(subject || '');
        const filteredScores = homeworks.filter((h: any) => (h.subject || 'Chung') === decodedSubject);
        
        setScores(filteredScores);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (studentId) {
      fetchData();
    }
  }, [studentId, subject]);

  const decodedSubject = decodeURIComponent(subject || '');
  const avgScore = scores.length > 0 
    ? (scores.reduce((acc, curr) => acc + curr.score, 0) / scores.length).toFixed(1)
    : '0.0';

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <button className="btn-icon" onClick={() => navigate(-1)} style={{ marginBottom: '1rem', background: 'var(--glass-bg)', padding: '4px 12px', width: 'auto', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} /> Quay lại
          </button>
          <h1>Chi tiết điểm: {decodedSubject}</h1>
          <p>Học sinh: {student?.name || 'Đang tải...'}</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem' }}>
        {isLoading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</p>
        ) : scores.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có điểm bài tập nào cho môn này.</p>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={24} color="var(--primary)" />
                <span style={{ color: 'var(--primary)' }}>{decodedSubject}</span>
              </h3>
              <div style={{ textAlign: 'right', background: 'var(--background)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Điểm trung bình</span>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  {avgScore} / 10
                </p>
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px' }}>Bài tập</th>
                    <th style={{ padding: '12px' }}>Ngày chấm</th>
                    <th style={{ padding: '12px' }}>Điểm số</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map(s => (
                    <tr key={s.id}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} color="var(--text-muted)" />
                          <span>{s.title}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>{new Date(s.graded_date).toLocaleDateString('vi-VN')}</td>
                      <td style={{ padding: '12px' }}>
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
    </div>
  );
};

export default SubjectScoreDetails;
