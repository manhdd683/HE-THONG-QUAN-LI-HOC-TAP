const fs = require('fs');
let content = fs.readFileSync('client/src/pages/Scores/StudentScoreCard.tsx', 'utf8');

const oldHandleInput = `  const handleInputChange = (boardId: string, field: keyof ScoreBoard, value: string) => {
    setEditData(prev => ({
      ...prev,
      [boardId]: {
        ...prev[boardId],
        [field]: value === '' ? '' : Number(value)
      }
    }));
  };`;
const newHandleInput = `  const handleInputChange = (boardId: string, field: keyof ScoreBoard, value: string) => {
    setEditData(prev => ({
      ...prev,
      [boardId]: {
        ...prev[boardId],
        [field]: field === 'title' ? value : (value === '' ? '' : Number(value))
      }
    }));
  };`;

content = content.replace(oldHandleInput, newHandleInput);
fs.writeFileSync('client/src/pages/Scores/StudentScoreCard.tsx', Buffer.from(content, 'utf8'));
console.log('Fixed handleInputChange.');
