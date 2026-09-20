import { useState, useEffect } from 'react';
import { Award, Star } from 'lucide-react';
import api from '../../utils/api';

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

const ParentAchievements: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    fetchAchievements();
  }, []);

  if (isLoading) {
    return <div className="page-container" style={{ textAlign: 'center', paddingTop: '3rem' }}>Đang tải danh hiệu...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Thành tích của con</h1>
          <p>Lưu giữ những nỗ lực và sự tiến bộ tuyệt vời của con qua từng giai đoạn học tập.</p>
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {achievements.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <Award size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ color: 'var(--text-muted)', margin: 0 }}>Chưa có thành tích nào</h3>
            <p style={{ color: 'var(--text-muted)' }}>Các chứng nhận sẽ tự động được cấp khi con hoàn thành tốt 10 buổi học liên tiếp.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
            {achievements.map((ach) => {
              let metrics = { attendanceRate: 0, homeworkRate: 0, avgScore: 0 };
              try { metrics = JSON.parse(ach.metrics); } catch (e) {}

              return (
                <div key={ach.id} style={{
                  position: 'relative',
                  background: 'linear-gradient(135deg, #fffbf2 0%, #fff0d4 100%)',
                  borderRadius: '16px',
                  padding: '2rem',
                  boxShadow: '0 10px 25px rgba(224, 142, 69, 0.15)',
                  border: '2px solid #E08E45',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  {/* Decorative corners */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '40px', height: '40px', borderBottom: '2px solid #E08E45', borderRight: '2px solid #E08E45', borderBottomRightRadius: '12px' }}></div>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '40px', borderBottom: '2px solid #E08E45', borderLeft: '2px solid #E08E45', borderBottomLeftRadius: '12px' }}></div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '40px', height: '40px', borderTop: '2px solid #E08E45', borderRight: '2px solid #E08E45', borderTopRightRadius: '12px' }}></div>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '40px', height: '40px', borderTop: '2px solid #E08E45', borderLeft: '2px solid #E08E45', borderTopLeftRadius: '12px' }}></div>
                  
                  {/* Seal / Ribbon */}
                  <div style={{
                    background: 'var(--accent)',
                    color: 'white',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    marginBottom: '1rem',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    <Star size={32} fill="white" />
                  </div>
                  
                  <h2 style={{ fontFamily: 'Georgia, serif', color: 'var(--primary)', margin: '0 0 0.5rem 0', fontSize: '1.5rem', letterSpacing: '1px' }}>
                    GIẤY CHỨNG NHẬN
                  </h2>
                  <p style={{ color: 'var(--text-muted)', margin: '0 0 1.5rem 0', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    Trao tặng cho học sinh
                  </p>
                  
                  <h3 style={{ fontSize: '1.75rem', color: '#1F2A24', margin: '0 0 1.5rem 0', borderBottom: '1px dashed var(--accent)', paddingBottom: '0.5rem', width: '80%' }}>
                    {ach.student.name}
                  </h3>
                  
                  <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>
                    Đã xuất sắc đạt danh hiệu <strong>{ach.title}</strong>.<br/>
                    {ach.description}
                  </p>
                  
                  <div style={{ background: 'rgba(255,255,255,0.6)', padding: '1rem', borderRadius: '8px', width: '100%', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-around' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Điểm TB</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>{metrics.avgScore.toFixed(1)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Chuyên cần</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>{metrics.attendanceRate.toFixed(0)}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bài tập</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>{metrics.homeworkRate.toFixed(0)}%</div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-end' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderBottom: '1px solid var(--text-muted)', width: '80px', marginBottom: '4px' }}></div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chữ ký gia sư</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Cấp ngày: {new Date(ach.achieved_date).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentAchievements;
