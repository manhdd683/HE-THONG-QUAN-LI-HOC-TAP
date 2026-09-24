import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';
import { Award, Zap } from 'lucide-react';

interface Achievement {
  id: string;
  student_id: string;
  title: string;
  description: string;
  metrics: string;
  achieved_date: string;
  student: {
    id: string;
    name: string;
  };
}

const AchievementManagement: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const { showSuccess, showError } = useToast();

  const fetchAchievements = async () => {
    try {
      const res = await api.get('/achievements');
      setAchievements(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    try {
      const res = await api.post('/achievements/evaluate');
      showSuccess(`Đánh giá hoàn tất! Đã cấp phát ${res.data.generated} chứng nhận mới.`);
      fetchAchievements();
    } catch (err) {
      showError('Lỗi khi đánh giá chứng nhận.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Quản lý Thành tích</h1>
          <p>Tự động đánh giá và cấp phát chứng nhận cho học sinh dựa trên quá trình học.</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={handleEvaluate}
          disabled={isEvaluating}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Zap size={18} />
          {isEvaluating ? 'Đang quét...' : 'Đánh giá & Cấp phát tự động'}
        </button>
      </div>

      <div className="data-table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Học sinh</th>
              <th>Danh hiệu</th>
              <th>Mô tả</th>
              <th>Ngày cấp</th>
              <th>Chỉ số lúc cấp</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</td></tr>
            ) : achievements.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Chưa có chứng nhận nào được cấp.</td></tr>
            ) : (
              achievements.map(ach => {
                let metrics = { attendanceRate: 0, homeworkRate: 0, avgScore: 0 };
                try { if (ach.metrics) metrics = { ...metrics, ...JSON.parse(ach.metrics) }; } catch (e) {}

                return (
                  <tr key={ach.id}>
                    <td style={{ fontWeight: 'bold' }}>{ach.student.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: 'bold' }}>
                        <Award size={16} />
                        {ach.title}
                      </div>
                    </td>
                    <td>{ach.description}</td>
                    <td>{new Date(ach.achieved_date).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <div>Điểm: <strong style={{ color: 'var(--primary)' }}>{metrics.avgScore?.toFixed(1) || '—'}</strong></div>
                        {metrics.attendanceRate !== undefined && <div>Chuyên cần: <strong>{metrics.attendanceRate?.toFixed(0) || '0'}%</strong></div>}
                        {metrics.homeworkRate !== undefined && <div>Bài tập: <strong>{metrics.homeworkRate?.toFixed(0) || '0'}%</strong></div>}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AchievementManagement;
