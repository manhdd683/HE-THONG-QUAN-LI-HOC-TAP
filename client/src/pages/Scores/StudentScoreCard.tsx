import { useState, useEffect } from 'react';
import { Award, FileText, CheckCircle, Save, Check, History } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';
import type { Student } from '../Students/StudentsList';

interface ScoreBoard {
  id: string;
  student_id: string;
  subject: string;
  title: string;
  daily_score: number | null;
  homework_1: number | null;
  homework_2: number | null;
  quiz_1: number | null;
  quiz_2: number | null;
  final_score: number | null;
  average_score: number | null;
  is_approved: boolean;
  created_at: string;
}

const StudentScoreCard: React.FC<{ student: Student }> = ({ student }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [boards, setBoards] = useState<ScoreBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit state (only for TUTOR)
  const [editData, setEditData] = useState<Record<string, Partial<ScoreBoard>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  
  const [activeSubject, setActiveSubject] = useState<string>('');
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');

  useEffect(() => {
    fetchBoards();
  }, [student.id]);

  const fetchBoards = async () => {
    try {
      const res = await api.get(`/students/${student.id}/scoreboards`);
      const rawData = res.data.boards || res.data;
      let data = rawData as ScoreBoard[];
      if (user?.role === 'PARENT') {
        data = data.filter(b => b.is_approved);
      }
      // Sort by created_at desc (newest first)
      const sortedBoards = [...data].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setBoards(sortedBoards);
      
      const subjects = Array.from(new Set(sortedBoards.map(b => b.subject)));
      if (subjects.length > 0) {
        if (!activeSubject || !subjects.includes(activeSubject)) {
          setActiveSubject(subjects[0]);
        }
      }
      
      const initEdit: any = {};
      sortedBoards.forEach(b => {
        initEdit[b.id] = { ...b };
      });
      setEditData(initEdit);
    } catch (err) {
      console.error(err);
      showError('Lỗi khi tải bảng điểm');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Auto-select latest board when subject changes
  useEffect(() => {
    if (activeSubject) {
      const subjectBoards = boards.filter(b => b.subject === activeSubject);
      if (subjectBoards.length > 0) {
        setSelectedBoardId(subjectBoards[0].id);
      }
    }
  }, [activeSubject, boards]);

  const handleInputChange = (boardId: string, field: keyof ScoreBoard, value: string) => {
    setEditData(prev => ({
      ...prev,
      [boardId]: {
        ...prev[boardId],
        [field]: field === 'title' ? value : (value === '' ? '' : Number(value))
      }
    }));
  };

  const handleSave = async (boardId: string) => {
    try {
      setSaving(boardId);
      const dataToSave = editData[boardId];
      await api.put(`/scoreboards/${boardId}`, dataToSave);
      showSuccess('Đã lưu điểm thành công');
      fetchBoards();
    } catch (error) {
      showError('Lỗi khi lưu điểm');
    } finally {
      setSaving(null);
    }
  };

  const handleApprove = async (boardId: string) => {
    if (!window.confirm('Sau khi duyệt, bảng điểm này sẽ được lưu vào lịch sử và tự động tạo một bảng điểm trống mới cho chu kỳ tiếp theo. Tiếp tục?')) return;
    try {
      setSaving(boardId);
      const dataToSave = editData[boardId];
      await api.put(`/scoreboards/${boardId}`, dataToSave);
      await api.post(`/scoreboards/${boardId}/approve`);
      showSuccess('Đã chốt bảng điểm và tạo chu kỳ mới!');
      fetchBoards();
    } catch (error) {
      showError('Lỗi khi duyệt bảng điểm');
    } finally {
      setSaving(null);
    }
  };

  const renderInput = (boardId: string, field: keyof ScoreBoard) => {
    const board = boards.find(b => b.id === boardId);
    if (user?.role === 'PARENT' || board?.is_approved) {
      const val = editData[boardId]?.[field];
      return <span style={{ fontWeight: 600, color: val !== null && val !== undefined && val !== '' ? 'var(--text-main)' : 'var(--text-muted)' }}>{val !== null && val !== undefined && val !== '' ? val : '—'}</span>;
    }
    return (
      <input 
        type="number" 
        min="0" max="10" step="0.1"
        className="form-control"
        style={{ width: '80px', textAlign: 'center', padding: '4px' }}
        value={editData[boardId]?.[field] === null ? '' : (editData[boardId]?.[field] as any) || ''}
        onChange={(e) => handleInputChange(boardId, field, e.target.value)}
      />
    );
  };

  const subjects = Array.from(new Set(boards.map(b => b.subject)));
  const currentSubjectBoards = boards.filter(b => b.subject === activeSubject);
  const activeBoard = boards.find(b => b.id === selectedBoardId);

  return (
    <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
        <div className="avatar-circle" style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>
          {student.name.charAt(0)}
        </div>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem' }}>Học sinh: {student.name}</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Mã: {student.student_code}</span>
        </div>
      </div>
      
      {isLoading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải bảng điểm...</p>
      ) : boards.length === 0 ? (
        <div className="dash-empty" style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '2rem' }}>
          <FileText size={36} strokeWidth={1} />
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
            {user?.role === 'PARENT' ? 'Gia sư chưa công bố bảng điểm nào.' : 'Học sinh chưa được đăng ký môn học nào.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Tabs Môn Học */}
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', overflowX: 'auto', alignItems: 'center' }}>
            {subjects.map(sub => (
              <button
                key={sub}
                className={"tab-btn " + (activeSubject === sub ? 'active' : '')}
                onClick={() => setActiveSubject(sub)}
                style={{ 
                  background: 'none', border: 'none', borderBottom: activeSubject === sub ? '2px solid var(--accent)' : '2px solid transparent',
                  color: activeSubject === sub ? 'var(--accent)' : 'var(--text-muted)', fontWeight: activeSubject === sub ? 'bold' : 'normal',
                  padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '15px', whiteSpace: 'nowrap'
                }}
              >
                Môn: {sub}
              </button>
            ))}
          </div>

          {/* Chọn Bảng điểm theo chu kỳ (Lịch sử) */}
          {currentSubjectBoards.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px' }}>
              <History size={20} color="var(--text-muted)" />
              <strong style={{ color: 'var(--text-main)' }}>Chọn xem bảng điểm:</strong>
              <select 
                className="form-control" 
                style={{ maxWidth: '300px', fontWeight: 'bold' }}
                value={selectedBoardId}
                onChange={e => setSelectedBoardId(e.target.value)}
              >
                {currentSubjectBoards.map((b, index) => (
                  <option key={b.id} value={b.id}>
                    {b.title || `Bảng điểm chưa đặt tên`} {index === 0 && !b.is_approved ? '(Hiện tại)' : '(Lịch sử)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Chi tiết bảng điểm được chọn */}
          {activeBoard && (
            <div key={activeBoard.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', background: 'var(--surface-solid)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  {!activeBoard.is_approved && user?.role === 'TUTOR' ? (
                    <input 
                      type="text" 
                      className="form-control"
                      value={editData[activeBoard.id]?.title || activeBoard.title || ''}
                      onChange={(e) => handleInputChange(activeBoard.id, 'title', e.target.value)}
                      style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)', padding: '4px 8px', width: '100%', maxWidth: '300px' }}
                      placeholder="Tên bảng điểm (VD: Tháng 10)..."
                    />
                  ) : (
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                      <Award size={20} />
                      {activeBoard.title || `Bảng điểm Môn ${activeBoard.subject}`}
                    </h3>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {activeBoard.is_approved ? (
                    <span className="status-badge active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={14} /> Đã chốt (Lịch sử)
                    </span>
                  ) : (
                    <span className="status-badge" style={{ background: '#fef3c7', color: '#d97706' }}>
                      Đang học (Hiện tại)
                    </span>
                  )}
                  {user?.role === 'TUTOR' && !activeBoard.is_approved && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-secondary" onClick={() => handleSave(activeBoard.id)} disabled={saving === activeBoard.id} style={{ padding: '6px 12px', fontSize: '13px' }}>
                        <Save size={14} /> Lưu điểm
                      </button>
                      <button className="btn-primary" onClick={() => handleApprove(activeBoard.id)} disabled={saving === activeBoard.id} style={{ padding: '6px 12px', fontSize: '13px' }}>
                        <Check size={14} /> Duyệt & Công bố
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderBottom: 'none' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Tên loại điểm</th>
                      <th style={{ width: '35%' }}>Mục điểm</th>
                      <th style={{ width: '20%', textAlign: 'center' }}>Trọng số (%)</th>
                      <th style={{ width: '20%', textAlign: 'center' }}>Điểm (Hệ 10)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Thường xuyên */}
                    <tr>
                      <td rowSpan={2} style={{ fontWeight: 600 }}>Điểm thường xuyên</td>
                      <td>Điểm thường xuyên</td>
                      <td style={{ textAlign: 'center' }}>15</td>
                      <td style={{ textAlign: 'center' }}>{renderInput(activeBoard.id, 'daily_score')}</td>
                    </tr>
                    <tr style={{ background: 'var(--bg-main)' }}>
                      <td style={{ fontWeight: 600 }}>Tổng điểm thường xuyên</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>15</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>
                        {activeBoard.daily_score !== null ? Number(activeBoard.daily_score).toFixed(1) : ""}
                      </td>
                    </tr>
                    
                    {/* Bài về nhà */}
                    <tr>
                      <td rowSpan={3} style={{ fontWeight: 600 }}>Điểm bài về nhà</td>
                      <td>Bài về nhà số 1</td>
                      <td style={{ textAlign: 'center' }}>10</td>
                      <td style={{ textAlign: 'center' }}>{renderInput(activeBoard.id, 'homework_1')}</td>
                    </tr>
                    <tr>
                      <td>Bài về nhà số 2</td>
                      <td style={{ textAlign: 'center' }}>10</td>
                      <td style={{ textAlign: 'center' }}>{renderInput(activeBoard.id, 'homework_2')}</td>
                    </tr>
                    <tr style={{ background: 'var(--bg-main)' }}>
                      <td style={{ fontWeight: 600 }}>Tổng điểm bài về nhà</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>20</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>
                        {(activeBoard.homework_1 !== null || activeBoard.homework_2 !== null) ? 
                          (((Number(activeBoard.homework_1) || 0) + (Number(activeBoard.homework_2) || 0)) / ((activeBoard.homework_1 !== null && activeBoard.homework_1 !== "" ? 1 : 0) + (activeBoard.homework_2 !== null && activeBoard.homework_2 !== "" ? 1 : 0))).toFixed(1) 
                          : ""}
                      </td>
                    </tr>

                    {/* Kiểm tra nhỏ */}
                    <tr>
                      <td rowSpan={3} style={{ fontWeight: 600 }}>Kiểm tra nhỏ</td>
                      <td>Kiểm tra nhỏ 1</td>
                      <td style={{ textAlign: 'center' }}>10</td>
                      <td style={{ textAlign: 'center' }}>{renderInput(activeBoard.id, 'quiz_1')}</td>
                    </tr>
                    <tr>
                      <td>Kiểm tra nhỏ 2</td>
                      <td style={{ textAlign: 'center' }}>10</td>
                      <td style={{ textAlign: 'center' }}>{renderInput(activeBoard.id, 'quiz_2')}</td>
                    </tr>
                    <tr style={{ background: 'var(--bg-main)' }}>
                      <td style={{ fontWeight: 600 }}>Tổng điểm kiểm tra nhỏ</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>20</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>
                        {(activeBoard.quiz_1 !== null || activeBoard.quiz_2 !== null) ? 
                          (((Number(activeBoard.quiz_1) || 0) + (Number(activeBoard.quiz_2) || 0)) / ((activeBoard.quiz_1 !== null && activeBoard.quiz_1 !== "" ? 1 : 0) + (activeBoard.quiz_2 !== null && activeBoard.quiz_2 !== "" ? 1 : 0))).toFixed(1) 
                          : ""}
                      </td>
                    </tr>

                    {/* Kiểm tra lớn */}
                    <tr>
                      <td rowSpan={2} style={{ fontWeight: 600 }}>Điểm kiểm tra lớn</td>
                      <td>Điểm kiểm tra lớn</td>
                      <td style={{ textAlign: 'center' }}>45</td>
                      <td style={{ textAlign: 'center' }}>{renderInput(activeBoard.id, 'final_score')}</td>
                    </tr>
                    <tr style={{ background: 'var(--bg-main)' }}>
                      <td style={{ fontWeight: 600 }}>Tổng điểm kiểm tra lớn</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>45</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>
                        {activeBoard.final_score !== null ? Number(activeBoard.final_score).toFixed(1) : ""}
                      </td>
                    </tr>

                    {/* TỔNG KẾT */}
                    <tr style={{ background: 'var(--primary-light)' }}>
                      <td colSpan={2} style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>ĐIỂM TRUNG BÌNH TỔNG KẾT</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>100</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem', color: activeBoard.average_score && activeBoard.average_score >= 5 ? 'var(--success)' : 'var(--danger)' }}>
                        {activeBoard.average_score !== null ? activeBoard.average_score.toFixed(1) : '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentScoreCard;
