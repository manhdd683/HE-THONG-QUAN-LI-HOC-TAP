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
  homeworkList: any[];
  sessionList: any[];
}

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
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
      const response = await api.get(`/reports/student/${selectedStudent}?month=${selectedMonth}&year=${selectedYear}`);
      setReportData(response.data);
      setEmailSent(false);

      // Save to history automatically
      await api.post('/reports/history', {
        student_id: selectedStudent,
        name: `Báo cáo tháng ${selectedMonth}/${selectedYear}`,
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
      
      setSelectedMonth(month.toString());
      setSelectedYear(year.toString());
      setSelectedStudent(history.student_id);
      
      const response = await api.get(`/reports/student/${history.student_id}?month=${month}&year=${year}`);
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
              onChange={e => setSelectedStudent(e.target.value)}
              style={{ width: '100%' }}
            >
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          
          <div className="control-group" style={{ flex: 1 }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Tháng</label>
            <select className="form-input" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ width: '100%' }}>
              {[...Array(12)].map((_, i) => (
                <option key={i+1} value={i+1}>Tháng {i+1}</option>
              ))}
            </select>
          </div>

          <div className="control-group" style={{ flex: 1 }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Năm</label>
            <select className="form-input" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ width: '100%' }}>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
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
                    <td>{students.find(s => s.id === history.student_id)?.name || history.student_id}</td>
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
                <p className="pr-subtitle">Kỳ báo cáo: {new Date(reportData.period.startDate).toLocaleDateString('vi-VN')} đến {new Date(reportData.period.endDate).toLocaleDateString('vi-VN')}</p>
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
                    <td className="pr-label">Giáo viên phụ trách:</td>
                    <td className="pr-value">{reportData.tutorName || user?.name || 'Gia sư'}</td>
                    <td className="pr-label">Ngày xuất báo cáo:</td>
                    <td className="pr-value">{new Date().toLocaleDateString('vi-VN')}</td>
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
                  <div className="pr-box-title">Bài Tập Về Nhà</div>
                  <div className="pr-progress-container">
                    <div className="pr-progress-bar pr-progress-alt" style={{ width: `${reportData.homework.rate}%` }}></div>
                  </div>
                  <div className="pr-box-stats">
                    <span>Hoàn thành: {reportData.homework.completed}/{reportData.homework.total} bài</span>
                    <strong>{reportData.homework.rate}%</strong>
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
              {reportData.homeworkList && reportData.homeworkList.length > 0 ? (
                <table className="pr-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>STT</th>
                      <th>Tên bài tập / Kiểm tra</th>
                      <th style={{ width: '120px' }}>Ngày giao</th>
                      <th style={{ width: '120px' }}>Trạng thái</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Điểm số</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.homeworkList.map((hw, index) => (
                      <tr key={hw.id}>
                        <td>{index + 1}</td>
                        <td><strong>{hw.title}</strong></td>
                        <td>{new Date(hw.created_at).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <span className={`pr-status ${hw.status.toLowerCase()}`}>
                            {hw.status === 'GRADED' ? 'Đã chấm' : (hw.status === 'SUBMITTED' ? 'Đã nộp' : 'Chưa nộp')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                          {hw.score !== null ? hw.score : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="pr-empty-text">Không có dữ liệu bài tập trong kỳ này.</p>
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
                      const comments = session.comments || [];
                      const textComments = comments.map((c: any) => c.content).filter(Boolean).join('; ');
                      return (
                        <tr key={session.id}>
                          <td>{index + 1}</td>
                          <td>{new Date(session.schedule?.date || session.created_at).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <span className={`pr-status ${session.attendance.toLowerCase()}`}>
                              {session.attendance === 'PRESENT' ? 'Có mặt' : (session.attendance === 'ABSENT' ? 'Vắng mặt' : session.attendance)}
                            </span>
                          </td>
                          <td style={{ fontStyle: 'italic', color: '#555' }}>
                            {textComments || '-'}
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

            <div className="pr-footer">
              <div className="pr-signature-area">
                <p>Ngày ...... tháng ...... năm 2026</p>
                <p><strong>XÁC NHẬN CỦA GIÁO VIÊN</strong></p>
                <div className="pr-signature-space"></div>
                <p>{user?.name || 'Gia sư'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
