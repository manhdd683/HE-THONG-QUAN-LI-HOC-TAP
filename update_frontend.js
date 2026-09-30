const fs = require('fs');
let content = fs.readFileSync('client/src/pages/Scores/StudentScoreCard.tsx', 'utf8');

// 1. Update ScoreBoard interface
content = content.replace('subject: string;', 'subject: string;\n  title: string;');

// 2. Change activeTab logic to use ID instead of subject
content = content.replace('const [activeTab, setActiveTab] = useState<string>(\'\');', 'const [activeTab, setActiveTab] = useState<string>(\'\');\n  const [creatingBoard, setCreatingBoard] = useState(false);');

content = content.replace('setActiveTab(sortedBoards[0].subject);', 'setActiveTab(sortedBoards[0].id);');
content = content.replace(/activeTab === board\.subject/g, 'activeTab === board.id');
content = content.replace(/setActiveTab\(board\.subject\)/g, 'setActiveTab(board.id)');
content = content.replace(/boards\.filter\(b => b\.subject === activeTab\)/g, 'boards.filter(b => b.id === activeTab)');

// Add handleCreateBoard
const createFn = `
  const handleCreateBoard = async () => {
    try {
      const subject = prompt('Nhập tên môn học (ví dụ: Toán, Văn, Anh):');
      if (!subject) return;
      const title = prompt('Nhập tên chu kỳ/tháng (ví dụ: Bảng điểm Tháng 10):');
      if (!title) return;
      
      setCreatingBoard(true);
      await api.post(\`/students/\${student.id}/scoreboards\`, { subject, title });
      showSuccess('Đã tạo bảng điểm mới');
      fetchBoards();
    } catch (err) {
      showError('Lỗi khi tạo bảng điểm');
    } finally {
      setCreatingBoard(false);
    }
  };
`;
content = content.replace('const handleSave = async', createFn + '\n  const handleSave = async');

// Change Tabs to show title and add Create button
const tabReplacement = `
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', overflowX: 'auto', alignItems: 'center' }}>
            {boards.map(board => (
              <button
                key={board.id}
                className={\`tab-btn \${activeTab === board.id ? 'active' : ''}\`}
                onClick={() => setActiveTab(board.id)}
                style={{ 
                  background: 'none', border: 'none', borderBottom: activeTab === board.id ? '2px solid var(--accent)' : '2px solid transparent',
                  color: activeTab === board.id ? 'var(--accent)' : 'var(--text-muted)', fontWeight: activeTab === board.id ? 'bold' : 'normal',
                  padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '15px', whiteSpace: 'nowrap'
                }}
              >
                {board.title || \`Môn: \${board.subject}\`}
              </button>
            ))}
            {user?.role === 'TUTOR' && (
              <button 
                className="btn-secondary" 
                onClick={handleCreateBoard} 
                disabled={creatingBoard}
                style={{ padding: '6px 12px', fontSize: '13px', marginLeft: 'auto', whiteSpace: 'nowrap' }}
              >
                + Tạo bảng điểm mới
              </button>
            )}
          </div>
`;
const oldTabStart = `<div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', overflowX: 'auto' }}>`;
const oldTabEnd = `</button>\n            ))}\n          </div>`;
const tabRegex = new RegExp(oldTabStart.replace(/[.*+?^$\{key: '()'}|\\]/g, '\\$&') + '[\\s\\S]*?' + oldTabEnd.replace(/[.*+?^$\{key: '()'}|\\]/g, '\\$&'));
content = content.replace(tabRegex, tabReplacement);

// Optional: allow editing title
const titleEditor = `
                <div style={{ flex: 1 }}>
                  {!board.is_approved && user?.role === 'TUTOR' ? (
                    <input 
                      type="text" 
                      className="form-control"
                      value={editData[board.id]?.title || board.title || ''}
                      onChange={(e) => handleInputChange(board.id, 'title' as any, e.target.value)}
                      style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)', padding: '4px 8px', width: '300px' }}
                      placeholder="Tên bảng điểm..."
                    />
                  ) : (
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                      <Award size={20} />
                      {board.title || \`Môn học: \${board.subject}\`}
                    </h3>
                  )}
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Môn học gốc: {board.subject}</div>
                </div>
`;
const oldHeader = `<h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>\n                  <Award size={20} />\n                  Môn học: {board.subject}\n                </h3>`;
content = content.replace(oldHeader, titleEditor);

fs.writeFileSync('client/src/pages/Scores/StudentScoreCard.tsx', Buffer.from(content, 'utf8'));
console.log('Frontend updated.');
