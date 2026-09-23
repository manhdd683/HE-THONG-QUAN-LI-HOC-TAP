import { useState, useEffect } from 'react';
import { GraduationCap, Calendar, Clock, DollarSign, CalendarCheck, BookOpen, MessageSquare, Award, Printer, FileText, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';


interface Student {
  id: string;
  name: string;
}

interface ReportData {
  student: {
    name: string;
    code: string;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  attendance: {
    total: number;
    present: number;
    absent: number;
    rate: number;
  };
  homework: {
    total: number;
    completed: number;
    averageScore: number | null;
    rate: number;
  };
  ranking: string;
  aggregatedComment: string;
  tuition: {
    estimatedAmount: number;
    pricePerSession: number;
    cycles: any[];
  };
  scoreboards: any[];
  cycleName?: string;
  sessionList: any[];
}

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [reportHistory, setReportHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (user?.role === 'TUTOR') {
          const response = await api.get('/students');
          setStudents(response.data);
          if (response.data.length > 0) {
            setSelectedStudent(response.data[0].id);
            const cyclesRes = await api.get(`/tuition/student/${response.data[0].id}`);
            setCycles(cyclesRes.data);
            if (cyclesRes.data.length > 0) setSelectedCycle(cyclesRes.data[0].id);
          }
        }
        
        // Fetch history for both tutor and parent
        const historyRes = await api.get('/reports/history');
        setReportHistory(historyRes.data);
        
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    };
    fetchInitialData();
  }, [user?.role]);

  const handleGenerateReport = async () => {
    if (!selectedStudent) return;
    
    setIsLoading(true);
    try {
      const response = await api.get(`/reports/student/${selectedStudent}?cycleId=${selectedCycle}`);
      setReportData(response.data);
      setEmailSent(false);

      // Save to history automatically
      await api.post('/reports/history', {
        student_id: selectedStudent,
        name: `Báo cáo ` + cycles.find(c => c.id === selectedCycle)?.name,
        report_type: 'MONTHLY',
        start_date: response.data.period.startDate,
        end_date: response.data.period.endDate
      });
      
    } catch (err) {
      console.error('Failed to generate report', err);
      showError('Không thể tạo báo cáo');
    } finally {
      setIsLoading(false);
    }
  };

  const viewHistoryReport = async (history: any) => {
    setIsLoading(true);
    try {
      const start = new Date(history.start_date);
      const month = start.getMonth() + 1;
      const year = start.getFullYear();
      
      
      setSelectedStudent(history.student_id);
      
      const response = await api.get(`/reports/student/${history.student_id}`);
      setReportData(response.data);
      setEmailSent(history.email_sent);
      
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      showError('Không thể mở báo cáo này.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    if (!reportData) return;
    
    // Giả lập gửi email
    const btn = document.getElementById('btn-send-email');
    if (btn) btn.innerHTML = '<span class="lucide-icon spin">⏳</span> Đang gửi...';
    
    setTimeout(() => {
      setEmailSent(true);
      showSuccess('Đã gửi báo cáo thành công qua Email cho Phụ huynh!');
    }, 1500);
  };

  return (
    <div className="page-container reports-page">
      <div className="page-header no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(31, 92, 78, 0.1)', color: 'var(--primary)', width: '48px', height: '48px', borderRadius: '12px' }}>
            <FileText size={24} />
          </div>
          <div>
            <h1>Báo Cáo Học Tập</h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
              {user?.role === 'TUTOR' ? 'Tạo và in báo cáo kết quả học tập cho học sinh' : 'Xem báo cáo kết quả học tập từ gia sư'}
            </p>
          </div>
        </div>
      </div>

      {user?.role === 'TUTOR' && (
        <div className="report-controls glass-panel no-print" style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '32px' }}>
          <div className="control-group" style={{ flex: 1 }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Học sinh</label>
            <select 
              className="form-input" 
              value={selectedStudent} 
              onChange={async (e) => {
                setSelectedStudent(e.target.value);
                const cyclesRes = await api.get(`/tuition/student/${e.target.value}`);
                setCycles(cyclesRes.data);
                if (cyclesRes.data.length > 0) setSelectedCycle(cyclesRes.data[0].id);
                else setSelectedCycle('');
              }}
              style={{ width: '100%' }}
            >
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          
          <div className="control-group" style={{ flex: 2 }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Chu kỳ học phí</label>
            <select className="form-input" value={selectedCycle} onChange={e => setSelectedCycle(e.target.value)} style={{ width: '100%' }}>
              {cycles.length === 0 && <option value="">Không có chu kỳ nào</option>}
              {cycles.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({new Date(c.start_date).toLocaleDateString('vi-VN')} - {c.completed_sessions}/{c.total_sessions} buổi)</option>
              ))}
            </select>
          </div>

          <button className="btn-primary" onClick={handleGenerateReport} disabled={isLoading || !selectedStudent} style={{ padding: '12px 24px', height: '42px', flexShrink: 0 }}>
            <FileText size={18} style={{ marginRight: '8px' }} />
            {isLoading ? 'Đang tạo...' : 'Tạo Báo Cáo Mới'}
          </button>
        </div>
      )}

      {/* Report History Section */}
      {reportHistory.length > 0 && !reportData && (
        <div className="history-section no-print" style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="var(--primary)" /> Lịch sử Báo Cáo
          </h3>
          
          <div className="data-table-container glass-panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên báo cáo</th>
                  <th>Học sinh</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reportHistory.map(history => (
                  <tr key={history.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', background: 'rgba(31,92,78,0.1)', color: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={16} />
                        </div>
                        {history.name}
                      </div>
                    </td>
                    <td>{history.student?.name || students.find(s => s.id === history.student_id)?.name || history.student_id}</td>
                    <td>{new Date(history.created_at).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => viewHistoryReport(history)}>
                        <BookOpen size={14} style={{ marginRight: '6px' }} />
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportData && (
        <div className="report-preview-container">
          <div className="report-actions no-print" style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
            <button className="btn-secondary" onClick={() => setReportData(null)}>
              Quay lại
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" onClick={handlePrint}>
                <Printer size={18} />
                In Báo Cáo / Xuất PDF
              </button>
              {user?.role === 'TUTOR' && (
                <button 
                  id="btn-send-email"
                  className="btn-primary" 
                  onClick={handleSendEmail} 
                  disabled={emailSent}
                  style={{ background: emailSent ? 'var(--success)' : 'var(--primary)' }}
                >
                  <FileText size={18} />
                  {emailSent ? 'Đã Gửi Email' : 'Gửi Phụ Huynh'}
                </button>
              )}
            </div>
          </div>

          {/* This is the printable area */}
          <div className="report-document printable-area professional-report">
            <div className="pr-header">
              <div className="pr-logo">
                <h1>TUTORING CENTER</h1>
                <p>Nền tảng Quản lý Giáo dục</p>
              </div>
              <div className="pr-title-area">
                <h2 className="pr-title">BÁO CÁO KẾT QUẢ HỌC TẬP</h2>
                <p className="pr-subtitle">Kỳ báo cáo: {reportData.cycleName} (Từ {new Date(reportData.period.startDate).toLocaleDateString('vi-VN')})</p>
              </div>
            </div>

            <div className="pr-section">
              <h3 className="pr-section-title">I. THÔNG TIN HỌC SINH</h3>
              <table className="pr-info-table">
                <tbody>
                  <tr>
                    <td className="pr-label">Họ và tên:</td>
                    <td className="pr-value"><strong>{reportData.student.name}</strong></td>
                    <td className="pr-label">Mã học sinh:</td>
                    <td className="pr-value">{reportData.student.code}</td>
                  </tr>
                  <tr>
                    <td className="pr-label">Ngày xuất báo cáo:</td>
                    <td className="pr-value">{new Date().toLocaleDateString('vi-VN')}</td>
                    <td className="pr-label"></td>
                    <td className="pr-value"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pr-section">
              <h3 className="pr-section-title">II. TỔNG QUAN HỌC TẬP</h3>
              <div className="pr-overview-grid">
                <div className="pr-overview-box">
                  <div className="pr-box-title">Chuyên Cần</div>
                  <div className="pr-progress-container">
                    <div className="pr-progress-bar" style={{ width: `${reportData.attendance.rate}%` }}></div>
                  </div>
                  <div className="pr-box-stats">
                    <span>Có mặt: {reportData.attendance.present}/{reportData.attendance.total} buổi</span>
                    <strong>{reportData.attendance.rate}%</strong>
                  </div>
                </div>
                
                <div className="pr-overview-box">
                  <div className="pr-box-title">Học phí chu kỳ</div>
                  <div className="pr-progress-container">
                    <div className="pr-progress-bar pr-progress-alt" style={{ width: '100%' }}></div>
                  </div>
                  <div className="pr-box-stats">
                    <span>Tổng tạm tính:</span>
                    <strong>{reportData.tuition.estimatedAmount.toLocaleString()}đ</strong>
                  </div>
                </div>

                <div className="pr-overview-box pr-box-highlight">
                  <div className="pr-box-title">Điểm Trung Bình</div>
                  <div className="pr-score-value">
                    {reportData.homework.averageScore !== null ? reportData.homework.averageScore.toFixed(1) : '-'} <small>/ 10</small>
                  </div>
                  <div className="pr-rank">Xếp loại: <strong>{reportData.ranking}</strong></div>
                </div>
              </div>
            </div>

            <div className="pr-section">
              <h3 className="pr-section-title">III. BẢNG ĐIỂM CHI TIẾT</h3>
              {reportData.scoreboards && reportData.scoreboards.length > 0 ? (
                <div>
                  {reportData.scoreboards.map((board: any) => (
                    <div key={board.id} style={{ marginBottom: '20px' }}>
                      <h4 style={{ color: 'var(--primary)', marginBottom: '8px' }}>Môn: {board.subject}</h4>
                      <table className="pr-data-table">
                        <thead>
                          <tr>
                            <th>Tên loại điểm</th>
                            <th>Mục điểm</th>
                            <th style={{ textAlign: 'center', width: '100px' }}>Trọng số</th>
                            <th style={{ textAlign: 'center', width: '100px' }}>Điểm (Hệ 10)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Thường xuyên */}
                          <tr>
                            <td rowSpan={2} style={{ fontWeight: 600 }}>Điểm thường xuyên</td>
                            <td>Điểm thường xuyên</td>
                            <td style={{ textAlign: 'center' }}>15%</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{board.daily_score !== null ? board.daily_score : '-'}</td>
                          </tr>
                          <tr style={{ background: '#f8f9fa' }}>
                            <td style={{ fontWeight: 600 }}>Tổng điểm thường xuyên</td>
                            <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>15%</td>
                            <td></td>
                          </tr>
                          
                          {/* Bài về nhà */}
                          <tr>
                            <td rowSpan={3} style={{ fontWeight: 600 }}>Điểm bài về nhà</td>
                            <td>Bài về nhà số 1</td>
                            <td style={{ textAlign: 'center' }}>10%</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{board.homework_1 !== null ? board.homework_1 : '-'}</td>
                          </tr>
                          <tr>
                            <td>Bài về nhà số 2</td>
                            <td style={{ textAlign: 'center' }}>10%</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{board.homework_2 !== null ? board.homework_2 : '-'}</td>
                          </tr>
                          <tr style={{ background: '#f8f9fa' }}>
                            <td style={{ fontWeight: 600 }}>Tổng điểm bài về nhà</td>
                            <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>20%</td>
                            <td></td>
                          </tr>

                          {/* Kiểm tra nhỏ */}
                          <tr>
                            <td rowSpan={3} style={{ fontWeight: 600 }}>Kiểm tra nhỏ</td>
                            <td>Kiểm tra nhỏ 1</td>
                            <td style={{ textAlign: 'center' }}>10%</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{board.quiz_1 !== null ? board.quiz_1 : '-'}</td>
                          </tr>
                          <tr>
                            <td>Kiểm tra nhỏ 2</td>
                            <td style={{ textAlign: 'center' }}>10%</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{board.quiz_2 !== null ? board.quiz_2 : '-'}</td>
                          </tr>
                          <tr style={{ background: '#f8f9fa' }}>
                            <td style={{ fontWeight: 600 }}>Tổng điểm kiểm tra nhỏ</td>
                            <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>20%</td>
                            <td></td>
                          </tr>

                          {/* Kiểm tra cuối kỳ */}
                          <tr>
                            <td rowSpan={2} style={{ fontWeight: 600 }}>Kiểm tra cuối kỳ</td>
                            <td>Bài kiểm tra cuối kỳ</td>
                            <td style={{ textAlign: 'center' }}>45%</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{board.final_score !== null ? board.final_score : '-'}</td>
                          </tr>
                          <tr style={{ background: '#f8f9fa' }}>
                            <td style={{ fontWeight: 600 }}>Tổng điểm kiểm tra cuối kỳ</td>
                            <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>45%</td>
                            <td></td>
                          </tr>

                          {/* Tổng kết */}
                          <tr style={{ background: 'rgba(31, 92, 78, 0.1)' }}>
                            <td colSpan={2} style={{ fontWeight: 'bold', fontSize: '15px' }}>ĐIỂM TRUNG BÌNH MÔN</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px', color: 'var(--primary)' }}>100%</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: 'var(--primary)' }}>
                              {board.average_score !== null ? board.average_score.toFixed(1) : '-'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="pr-empty-text">Không có dữ liệu bảng điểm trong kỳ này.</p>
              )}
            </div>

            <div className="pr-section">
              <h3 className="pr-section-title">IV. NHẬT KÝ BUỔI HỌC</h3>
              {reportData.sessionList && reportData.sessionList.length > 0 ? (
                <table className="pr-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>STT</th>
                      <th style={{ width: '120px' }}>Ngày học</th>
                      <th style={{ width: '120px' }}>Điểm danh</th>
                      <th>Nhận xét buổi học</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.sessionList.map((session, index) => {
                      const comment = session.comments?.[0];
                      return (
                        <tr key={session.id}>
                          <td>{index + 1}</td>
                          <td>{new Date(session.schedule?.date || session.created_at).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <span className={`pr-status ${session.attendance.toLowerCase()}`}>
                              {session.attendance === 'PRESENT' ? 'Có mặt' : (session.attendance === 'ABSENT' ? 'Vắng mặt' : session.attendance)}
                            </span>
                          </td>
                          <td style={{ color: '#555' }}>
                            {comment || session.content ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                                {session.content && <div><strong>Nội dung:</strong> {session.content}</div>}
                                {comment?.understanding_level && <div><strong>Hiểu bài:</strong> {comment.understanding_level}</div>}
                                {comment?.attitude && <div><strong>Thái độ:</strong> {comment.attitude}</div>}
                                {comment?.strengths && <div><strong>Điểm mạnh:</strong> {comment.strengths}</div>}
                                {comment?.weaknesses && <div><strong>Cần cải thiện:</strong> {comment.weaknesses}</div>}
                              </div>
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="pr-empty-text">Không có dữ liệu buổi học trong kỳ này.</p>
              )}
            </div>

            <div className="pr-section">
              <h3 className="pr-section-title">V. ĐÁNH GIÁ CHUNG</h3>
              <div className="pr-remarks-box">
                {reportData.aggregatedComment}
              </div>
            </div>


          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
