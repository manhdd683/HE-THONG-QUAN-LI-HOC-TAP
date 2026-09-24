const fs = require('fs');
const fileScoreCard = 'client/src/pages/Scores/StudentScoreCard.tsx';
let contentCard = fs.readFileSync(fileScoreCard, 'utf8');

// A helper for string replace
const replaceTotalRow = (content, label, weight, calcStr) => {
  const regex = new RegExp(`<td style={{ fontWeight: 600 }}>${label}<\/td>\\s*<td style={{ textAlign: 'center', fontWeight: 600, color: 'var\\(--primary\\)' }}>${weight}<\/td>\\s*<td><\/td>`, 'g');
  const replacement = `<td style={{ fontWeight: 600 }}>${label}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>${weight}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>
                        {${calcStr}}
                      </td>`;
  return content.replace(regex, replacement);
};

contentCard = replaceTotalRow(contentCard, 'Tổng điểm thường xuyên', '15', 'board.daily_score !== null ? Number(board.daily_score).toFixed(1) : ""');
contentCard = replaceTotalRow(contentCard, 'Tổng điểm bài về nhà', '20', `(board.homework_1 !== null || board.homework_2 !== null) ? 
                          (((Number(board.homework_1) || 0) + (Number(board.homework_2) || 0)) / ((board.homework_1 !== null && board.homework_1 !== "" ? 1 : 0) + (board.homework_2 !== null && board.homework_2 !== "" ? 1 : 0))).toFixed(1) 
                          : ""`);
contentCard = replaceTotalRow(contentCard, 'Tổng điểm kiểm tra nhỏ', '20', `(board.quiz_1 !== null || board.quiz_2 !== null) ? 
                          (((Number(board.quiz_1) || 0) + (Number(board.quiz_2) || 0)) / ((board.quiz_1 !== null && board.quiz_1 !== "" ? 1 : 0) + (board.quiz_2 !== null && board.quiz_2 !== "" ? 1 : 0))).toFixed(1) 
                          : ""`);
contentCard = replaceTotalRow(contentCard, 'Tổng điểm kiểm tra lớn', '45', 'board.final_score !== null ? Number(board.final_score).toFixed(1) : ""');

fs.writeFileSync(fileScoreCard, contentCard);


const fileReport = 'client/src/pages/Reports/ReportsPage.tsx';
let contentReport = fs.readFileSync(fileReport, 'utf8');

const replaceTotalRowReport = (content, label, weight, calcStr) => {
  const regex = new RegExp(`<td style={{ fontWeight: 600 }}>${label}<\/td>\\s*<td style={{ textAlign: 'center', fontWeight: 600, color: 'var\\(--primary\\)' }}>${weight}<\/td>\\s*<td><\/td>`, 'g');
  const replacement = `<td style={{ fontWeight: 600 }}>${label}</td>
                            <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>${weight}</td>
                            <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>
                              {${calcStr}}
                            </td>`;
  return content.replace(regex, replacement);
};

contentReport = replaceTotalRowReport(contentReport, 'Tổng điểm thường xuyên', '15%', 'board.daily_score !== null ? Number(board.daily_score).toFixed(1) : ""');
contentReport = replaceTotalRowReport(contentReport, 'Tổng điểm bài về nhà', '20%', `(board.homework_1 !== null || board.homework_2 !== null) ? 
                                (((Number(board.homework_1) || 0) + (Number(board.homework_2) || 0)) / ((board.homework_1 !== null ? 1 : 0) + (board.homework_2 !== null ? 1 : 0))).toFixed(1) 
                                : ""`);
contentReport = replaceTotalRowReport(contentReport, 'Tổng điểm kiểm tra nhỏ', '20%', `(board.quiz_1 !== null || board.quiz_2 !== null) ? 
                                (((Number(board.quiz_1) || 0) + (Number(board.quiz_2) || 0)) / ((board.quiz_1 !== null ? 1 : 0) + (board.quiz_2 !== null ? 1 : 0))).toFixed(1) 
                                : ""`);
contentReport = replaceTotalRowReport(contentReport, 'Tổng điểm kiểm tra cuối kỳ', '45%', 'board.final_score !== null ? Number(board.final_score).toFixed(1) : ""');

fs.writeFileSync(fileReport, contentReport);

console.log('Fixed both tables');
