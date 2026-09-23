const fs = require('fs');
const file = 'client/src/pages/Reports/ReportsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const badTableBody = `                        <tbody>
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
                        </tbody>`;

const goodTableBody = `                        <tbody>
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
                        </tbody>`;

content = content.replace(badTableBody, goodTableBody);
fs.writeFileSync(file, content);
console.log('Fixed ReportsPage scoreboard render');
