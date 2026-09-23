import { useState, useEffect, useRef } from 'react';
import { Award, Star, Download } from 'lucide-react';
import api from '../../utils/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

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

  const downloadPDF = async (achievementId: string, studentName: string) => {
    const element = document.getElementById(`certificate-${achievementId}`);
    if (!element) return;
    
    // Temporarily adjust scale for high-quality render
    try {
      const canvas = await html2canvas(element, { scale: 3, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // A4 Landscape: 297mm x 210mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
      pdf.save(`Chung_Nhan_${studentName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF', err);
    }
  };

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {achievements.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <Award size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ color: 'var(--text-muted)', margin: 0 }}>Chưa có thành tích nào</h3>
            <p style={{ color: 'var(--text-muted)' }}>Các chứng nhận sẽ tự động được cấp khi con hoàn thành tốt 10 buổi học liên tiếp.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {achievements.map((ach) => {
              let metrics = { attendanceRate: 0, homeworkRate: 0, avgScore: 0, startDate: '', endDate: '' };
              try { metrics = JSON.parse(ach.metrics); } catch (e) {}
              const startDateStr = metrics.startDate ? new Date(metrics.startDate).toLocaleDateString('vi-VN') : '...';
              const endDateStr = metrics.endDate ? new Date(metrics.endDate).toLocaleDateString('vi-VN') : new Date(ach.achieved_date).toLocaleDateString('vi-VN');

              return (
                <div 
                  key={ach.id} 
                  onClick={() => setSelectedAchievement(ach)}
                  style={{ 
                    cursor: 'pointer',
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'all 0.2s ease'
                  }}
                  className="hover-scale"
                >
                  <div style={{
                    background: 'var(--accent)',
                    color: 'white',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Star size={24} fill="white" />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: 'var(--primary)' }}>{ach.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Cấp ngày: {new Date(ach.achieved_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal View */}
      {selectedAchievement && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '2rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAchievement(null);
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto' }}>
            {(() => {
              const ach = selectedAchievement;
              let metrics = { attendanceRate: 0, homeworkRate: 0, avgScore: 0, startDate: '', endDate: '' };
              try { metrics = JSON.parse(ach.metrics); } catch (e) {}

              const startDateStr = metrics.startDate ? new Date(metrics.startDate).toLocaleDateString('vi-VN') : '...';
              const endDateStr = metrics.endDate ? new Date(metrics.endDate).toLocaleDateString('vi-VN') : new Date(ach.achieved_date).toLocaleDateString('vi-VN');

              return (
                <>
                  <div 
                    id={`certificate-${ach.id}`}
                    style={{
                      position: 'relative',
                      background: 'linear-gradient(135deg, #fffbf2 0%, #fff0d4 100%)',
                      width: '100%',
                      aspectRatio: '1.414 / 1', // A4 Landscape ratio
                      padding: '2rem 3rem',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                      border: '4px double #E08E45',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Decorative corners */}
                    <div style={{ position: 'absolute', top: 10, left: 10, width: '60px', height: '60px', borderTop: '4px solid #E08E45', borderLeft: '4px solid #E08E45' }}></div>
                    <div style={{ position: 'absolute', top: 10, right: 10, width: '60px', height: '60px', borderTop: '4px solid #E08E45', borderRight: '4px solid #E08E45' }}></div>
                    <div style={{ position: 'absolute', bottom: 10, left: 10, width: '60px', height: '60px', borderBottom: '4px solid #E08E45', borderLeft: '4px solid #E08E45' }}></div>
                    <div style={{ position: 'absolute', bottom: 10, right: 10, width: '60px', height: '60px', borderBottom: '4px solid #E08E45', borderRight: '4px solid #E08E45' }}></div>
                    
                    {/* Seal / Ribbon */}
                    <div style={{
                      background: 'var(--accent)',
                      color: 'white',
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                      marginBottom: '0.25rem',
                      position: 'relative',
                      zIndex: 2
                    }}>
                      <Star size={24} fill="white" />
                    </div>
                    
                    {/* Fix font and text-transform for Vietnamese tone marks */}
                    <h2 style={{ fontFamily: 'Arial, sans-serif', color: 'var(--primary)', margin: '0 0 0.25rem 0', fontSize: '2rem', fontWeight: 'bold' }}>
                      GIẤY CHỨNG NHẬN
                    </h2>
                    <p style={{ color: 'var(--text-muted)', margin: '0 0 0.75rem 0', fontStyle: 'italic', fontSize: '1rem' }}>
                      Trao tặng cho học sinh
                    </p>
                    
                    <h3 style={{ fontSize: '2rem', color: '#1F2A24', margin: '0 0 0.75rem 0', borderBottom: '2px dashed var(--accent)', paddingBottom: '0.25rem', width: '70%', fontFamily: 'Georgia, serif' }}>
                      {ach.student.name}
                    </h3>
                    
                    <p style={{ color: 'var(--text)', fontSize: '1rem', lineHeight: '1.4', margin: '0 0 0.25rem 0' }}>
                      Đã xuất sắc đạt danh hiệu <strong>{ach.title}</strong>.<br/>
                      {ach.description}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', margin: '0 0 1rem 0' }}>
                      (Khóa học: Từ ngày {startDateStr} đến ngày {endDateStr})
                    </p>
                    
                    <div style={{ background: 'rgba(255,255,255,0.7)', padding: '0.5rem', borderRadius: '8px', width: '80%', marginBottom: 'auto', display: 'flex', justifyContent: 'space-around', border: '1px solid rgba(224, 142, 69, 0.3)' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Điểm TB</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{metrics.avgScore?.toFixed(1) || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Chuyên cần</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{metrics.attendanceRate?.toFixed(0) || '0'}%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bài tập</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{metrics.homeworkRate?.toFixed(0) || '0'}%</div>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 2rem', alignItems: 'flex-end' }}>
                      <div style={{ textAlign: 'center', width: '220px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '1rem' }}>
                        <div style={{ fontSize: '1.1rem', color: '#1F2A24', fontStyle: 'italic' }}>
                          Cấp ngày: {new Date(ach.achieved_date).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'center', width: '220px' }}>
                        <div style={{ fontSize: '1rem', color: '#1F2A24', fontWeight: 'bold', textTransform: 'uppercase' }}>
                          Gia sư hướng dẫn
                        </div>
                        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                          <style>
                            {`@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');`}
                          </style>
                          <div style={{ 
                            fontFamily: '"Dancing Script", cursive', 
                            fontSize: '2.8rem', 
                            color: '#1F5C4E', 
                            marginTop: '0.25rem',
                            marginBottom: '0.25rem',
                            transform: 'rotate(-5deg)',
                            position: 'relative',
                            zIndex: 2
                          }}>
                            Mạnh
                          </div>
                          {/* Con dấu */}
                          <img 
                            src={`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="56" fill="none" stroke="%23c21c1c" stroke-width="4"/><circle cx="60" cy="60" r="50" fill="none" stroke="%23c21c1c" stroke-width="1.5"/><path d="M 60 40 Q 45 30 25 35 L 25 70 Q 45 60 60 70 Q 75 60 95 70 L 95 35 Q 75 30 60 40 Z" fill="none" stroke="%23c21c1c" stroke-width="2.5" stroke-linejoin="round"/><line x1="60" y1="40" x2="60" y2="70" stroke="%23c21c1c" stroke-width="2.5"/><path d="M 25 45 Q 45 40 55 45 M 25 55 Q 45 50 55 55" fill="none" stroke="%23c21c1c" stroke-width="1.5" stroke-dasharray="2 2"/><path d="M 95 45 Q 75 40 65 45 M 95 55 Q 75 50 65 55" fill="none" stroke="%23c21c1c" stroke-width="1.5" stroke-dasharray="2 2"/><text x="60" y="98" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="%23c21c1c" text-anchor="middle" letter-spacing="1">MANHDD</text></svg>`}
                            alt="Con dấu MANHDD"
                            style={{
                              position: 'absolute',
                              top: '55%',
                              left: '30%',
                              transform: 'translate(-50%, -50%) rotate(-15deg)',
                              width: '110px',
                              height: '110px',
                              opacity: 0.85,
                              zIndex: 1,
                              mixBlendMode: 'multiply'
                            }}
                          />
                        </div>
                        <div style={{ borderTop: '1px solid var(--text-muted)', paddingTop: '0.25rem', color: '#1F2A24', fontWeight: 'bold', fontSize: '1rem' }}>
                          Dương Đức Mạnh
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button 
                      onClick={() => setSelectedAchievement(null)}
                      className="btn btn-secondary"
                    >
                      Đóng
                    </button>
                    <button 
                      onClick={() => downloadPDF(ach.id, ach.student.name)}
                      className="btn btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Download size={20} />
                      Tải xuống PDF
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentAchievements;
