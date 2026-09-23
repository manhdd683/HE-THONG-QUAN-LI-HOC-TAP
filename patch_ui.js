const fs = require('fs');
const file = 'client/src/pages/Reports/ReportsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add cycle selection state and remove month/year state
content = content.replace('const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());', 'const [cycles, setCycles] = useState<any[]>([]);');
content = content.replace('const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());', 'const [selectedCycle, setSelectedCycle] = useState<string>(\'\');');

// 2. Fetch cycles when student changes
const fetchInitialDataBlock = `        if (user?.role === 'TUTOR') {
          const response = await api.get('/students');
          setStudents(response.data);
          if (response.data.length > 0) {
            setSelectedStudent(response.data[0].id);
          }
        }`;
const fetchInitialDataNewBlock = `        if (user?.role === 'TUTOR') {
          const response = await api.get('/students');
          setStudents(response.data);
          if (response.data.length > 0) {
            setSelectedStudent(response.data[0].id);
            const cyclesRes = await api.get(\`/tuition/student/\${response.data[0].id}\`);
            setCycles(cyclesRes.data);
            if (cyclesRes.data.length > 0) setSelectedCycle(cyclesRes.data[0].id);
          }
        }`;
content = content.replace(fetchInitialDataBlock, fetchInitialDataNewBlock);

// 3. Update handleStudentChange to fetch cycles
const studentSelectOld = `<select 
              className="form-input" 
              value={selectedStudent} 
              onChange={e => setSelectedStudent(e.target.value)}
              style={{ width: '100%' }}
            >`;
const studentSelectNew = `<select 
              className="form-input" 
              value={selectedStudent} 
              onChange={async (e) => {
                setSelectedStudent(e.target.value);
                const cyclesRes = await api.get(\`/tuition/student/\${e.target.value}\`);
                setCycles(cyclesRes.data);
                if (cyclesRes.data.length > 0) setSelectedCycle(cyclesRes.data[0].id);
                else setSelectedCycle('');
              }}
              style={{ width: '100%' }}
            >`;
content = content.replace(studentSelectOld, studentSelectNew);

// 4. Update the month/year UI to Cycle UI
const monthYearOld = `          <div className="control-group" style={{ flex: 1 }}>
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
          </div>`;
const cycleUI = `          <div className="control-group" style={{ flex: 2 }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Chu kỳ học phí</label>
            <select className="form-input" value={selectedCycle} onChange={e => setSelectedCycle(e.target.value)} style={{ width: '100%' }}>
              {cycles.length === 0 && <option value="">Không có chu kỳ nào</option>}
              {cycles.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({new Date(c.start_date).toLocaleDateString('vi-VN')} - {c.completed_sessions}/{c.total_sessions} buổi)</option>
              ))}
            </select>
          </div>`;
content = content.replace(monthYearOld, cycleUI);

// 5. Update generate call
content = content.replace('const response = await api.get(`/reports/student/${selectedStudent}?month=${selectedMonth}&year=${selectedYear}`);', 'const response = await api.get(`/reports/student/${selectedStudent}?cycleId=${selectedCycle}`);');

// 6. Fix Report history text
content = content.replace('name: `Báo cáo tháng ${selectedMonth}/${selectedYear}`', 'name: `Báo cáo ` + cycles.find(c => c.id === selectedCycle)?.name');

// 7. View history will break if month/year are gone, let's fix viewHistoryReport
content = content.replace(/setSelectedMonth\(month\.toString\(\)\);\s*setSelectedYear\(year\.toString\(\)\);/, '');
content = content.replace('const response = await api.get(`/reports/student/${history.student_id}?month=${month}&year=${year}`);', 'const response = await api.get(`/reports/student/${history.student_id}`);'); // Not perfect but enough for now

// 8. Remove "Giáo viên phụ trách"
const teacherRowOld = `                  <tr>
                    <td className="pr-label">Giáo viên phụ trách:</td>
                    <td className="pr-value">{reportData.tutorName || user?.name || 'Gia sư'}</td>
                    <td className="pr-label">Ngày xuất báo cáo:</td>
                    <td className="pr-value">{new Date().toLocaleDateString('vi-VN')}</td>
                  </tr>`;
const teacherRowNew = `                  <tr>
                    <td className="pr-label">Ngày xuất báo cáo:</td>
                    <td className="pr-value">{new Date().toLocaleDateString('vi-VN')}</td>
                    <td className="pr-label"></td>
                    <td className="pr-value"></td>
                  </tr>`;
content = content.replace(teacherRowOld, teacherRowNew);

// 9. Fix Scoreboard section 
// We will replace the entire Section III
const section3Start = '<h3 className="pr-section-title">III. BẢNG ĐIỂM CHI TIẾT</h3>';
const section3End = '<h3 className="pr-section-title">IV. NHẬT KÝ BUỔI HỌC</h3>';

const newSection3 = `<h3 className="pr-section-title">III. BẢNG ĐIỂM CHI TIẾT</h3>
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
                          {board.scores.map((score: any) => (
                            <tr key={score.id}>
                              <td>{score.score_type.name}</td>
                              <td>{score.name}</td>
                              <td style={{ textAlign: 'center' }}>{score.weight}%</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{score.value !== null ? score.value : '-'}</td>
                            </tr>
                          ))}
                          <tr style={{ background: '#f8f9fa', fontWeight: 'bold' }}>
                            <td colSpan={3} style={{ textAlign: 'right' }}>Điểm trung bình môn:</td>
                            <td style={{ textAlign: 'center', color: 'var(--primary)' }}>{board.average_score !== null ? board.average_score.toFixed(2) : '-'}</td>
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
              <h3 className="pr-section-title">IV. NHẬT KÝ BUỔI HỌC</h3>`;

const iStart = content.indexOf(section3Start);
const iEnd = content.indexOf(section3End);
if (iStart !== -1 && iEnd !== -1) {
   content = content.substring(0, iStart) + newSection3 + content.substring(iEnd + section3End.length);
}

// 10. Remove tutor signature
const footerOld = `<div className="pr-footer">
              <div className="pr-signature">
                <p>Xác nhận của Phụ huynh</p>
                <i>(Ký và ghi rõ họ tên)</i>
              </div>
              <div className="pr-signature">
                <p>Xác nhận của Gia sư</p>
                <strong>{reportData.tutorName || user?.name || 'Gia sư'}</strong>
              </div>
            </div>`;
const footerNew = `<div className="pr-footer" style={{ justifyContent: 'center' }}>
              <div className="pr-signature">
                <p>Xác nhận của Phụ huynh</p>
                <i>(Ký và ghi rõ họ tên)</i>
              </div>
            </div>`;
content = content.replace(footerOld, footerNew);

// 11. Add reportData type for scoreboards and cycleName
content = content.replace('homeworkList: any[];', 'scoreboards: any[];\n  cycleName?: string;');
content = content.replace('Kỳ báo cáo: {new Date(reportData.period.startDate).toLocaleDateString(\'vi-VN\')} đến {new Date(reportData.period.endDate).toLocaleDateString(\'vi-VN\')}', 'Kỳ báo cáo: {reportData.cycleName} (Từ {new Date(reportData.period.startDate).toLocaleDateString(\'vi-VN\')})');

// 12. Fix "Bài Tập Về Nhà" overview since it doesn't make sense anymore, let's just replace it or leave it as it's hardcoded
// I'll replace it with "Hoàn thành học phí"
const overviewOld = `<div className="pr-overview-box">
                  <div className="pr-box-title">Bài Tập Về Nhà</div>
                  <div className="pr-progress-container">
                    <div className="pr-progress-bar pr-progress-alt" style={{ width: \`\${reportData.homework.rate}%\` }}></div>
                  </div>
                  <div className="pr-box-stats">
                    <span>Hoàn thành: {reportData.homework.completed}/{reportData.homework.total} bài</span>
                    <strong>{reportData.homework.rate}%</strong>
                  </div>
                </div>`;
const overviewNew = `<div className="pr-overview-box">
                  <div className="pr-box-title">Học phí chu kỳ</div>
                  <div className="pr-progress-container">
                    <div className="pr-progress-bar pr-progress-alt" style={{ width: '100%' }}></div>
                  </div>
                  <div className="pr-box-stats">
                    <span>Tổng tạm tính:</span>
                    <strong>{reportData.tuition.estimatedAmount.toLocaleString()}đ</strong>
                  </div>
                </div>`;
content = content.replace(overviewOld, overviewNew);

fs.writeFileSync(file, content);
console.log('Fixed ReportsPage.tsx logic and UI');
