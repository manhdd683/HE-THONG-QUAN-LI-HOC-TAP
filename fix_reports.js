const fs = require('fs');
const file = 'client/src/pages/Reports/ReportsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldBlock = `                    {reportData.sessionList.map((session, index) => {
                      const comments = session.comments || [];
                      const textComments = comments.map((c: any) => c.content).filter(Boolean).join('; ');
                      return (
                        <tr key={session.id}>
                          <td>{index + 1}</td>
                          <td>{new Date(session.schedule?.date || session.created_at).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <span className={\`pr-status \${session.attendance.toLowerCase()}\`}>
                              {session.attendance === 'PRESENT' ? 'Có mặt' : (session.attendance === 'ABSENT' ? 'Vắng mặt' : session.attendance)}
                            </span>
                          </td>
                          <td style={{ fontStyle: 'italic', color: '#555' }}>
                            {textComments || '-'}
                          </td>
                        </tr>
                      );
                    })}`;

const newBlock = `                    {reportData.sessionList.map((session, index) => {
                      const comment = session.comments?.[0];
                      return (
                        <tr key={session.id}>
                          <td>{index + 1}</td>
                          <td>{new Date(session.schedule?.date || session.created_at).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <span className={\`pr-status \${session.attendance.toLowerCase()}\`}>
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
                    })}`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync(file, content);
console.log('Replaced reports comment logic');
