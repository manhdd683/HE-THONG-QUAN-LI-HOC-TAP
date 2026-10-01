import { useState, useEffect } from 'react';
import { Award, FileText, CheckCircle, Save, Check, ChevronDown, ChevronUp, Clock, BookOpen } from 'lucide-react';
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
  cycle_id: string | null;
  cycle?: {
    id: string;
    name: string;
    start_date: string;
    end_date: string | null;
    completed_sessions: number;
    total_sessions: number;
  } | null;
}

// ─── Sub-component: Score Table ───────────────────────────────────────────────
const ScoreTable: React.FC<{
  board: ScoreBoard;
  editData: Partial<ScoreBoard>;
  isEditable: boolean;
  onInputChange: (field: keyof ScoreBoard, value: string) => void;
}> = ({ board, editData, isEditable, onInputChange }) => {
  const renderCell = (field: keyof ScoreBoard) => {
    const val = editData[field];
    if (!isEditable) {
      return (
        <span style={{ fontWeight: 600, color: val !== null && val !== undefined && val !== '' ? 'var(--text-main)' : 'var(--text-muted)' }}>
          {val !== null && val !== undefined && val !== '' ? String(val) : '—'}
        </span>
      );
    }
    return (
      <input
        type="number"
        min="0" max="10" step="0.1"
        className="form-control"
        style={{ width: '80px', textAlign: 'center', padding: '4px' }}
        value={val === null ? '' : (val as any) || ''}
        onChange={(e) => onInputChange(field, e.target.value)}
      />
    );
  };

  const hw1 = Number(board.homework_1) || 0;
  const hw2 = Number(board.homework_2) || 0;
  const hwCount = (board.homework_1 !== null && board.homework_1 !== ('' as any) ? 1 : 0) + (board.homework_2 !== null && board.homework_2 !== ('' as any) ? 1 : 0);
  const hwAvg = hwCount > 0 ? ((hw1 + hw2) / hwCount).toFixed(1) : '';

  const q1 = Number(board.quiz_1) || 0;
  const q2 = Number(board.quiz_2) || 0;
  const qCount = (board.quiz_1 !== null && board.quiz_1 !== ('' as any) ? 1 : 0) + (board.quiz_2 !== null && board.quiz_2 !== ('' as any) ? 1 : 0);
  const qAvg = qCount > 0 ? ((q1 + q2) / qCount).toFixed(1) : '';

  return (
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
            <td style={{ textAlign: 'center' }}>{renderCell('daily_score')}</td>
          </tr>
          <tr style={{ background: 'var(--bg-main)' }}>
            <td style={{ fontWeight: 600 }}>Tổng điểm thường xuyên</td>
            <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>15</td>
            <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>
              {board.daily_score !== null ? Number(board.daily_score).toFixed(1) : ''}
            </td>
          </tr>

          {/* Bài về nhà */}
          <tr>
            <td rowSpan={3} style={{ fontWeight: 600 }}>Điểm bài về nhà</td>
            <td>Bài về nhà số 1</td>
            <td style={{ textAlign: 'center' }}>10</td>
            <td style={{ textAlign: 'center' }}>{renderCell('homework_1')}</td>
          </tr>
          <tr>
            <td>Bài về nhà số 2</td>
            <td style={{ textAlign: 'center' }}>10</td>
            <td style={{ textAlign: 'center' }}>{renderCell('homework_2')}</td>
          </tr>
          <tr style={{ background: 'var(--bg-main)' }}>
            <td style={{ fontWeight: 600 }}>Tổng điểm bài về nhà</td>
            <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>20</td>
            <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>{hwAvg}</td>
          </tr>

          {/* Kiểm tra nhỏ */}
          <tr>
            <td rowSpan={3} style={{ fontWeight: 600 }}>Kiểm tra nhỏ</td>
            <td>Kiểm tra nhỏ 1</td>
            <td style={{ textAlign: 'center' }}>10</td>
            <td style={{ textAlign: 'center' }}>{renderCell('quiz_1')}</td>
          </tr>
          <tr>
            <td>Kiểm tra nhỏ 2</td>
            <td style={{ textAlign: 'center' }}>10</td>
            <td style={{ textAlign: 'center' }}>{renderCell('quiz_2')}</td>
          </tr>
          <tr style={{ background: 'var(--bg-main)' }}>
            <td style={{ fontWeight: 600 }}>Tổng điểm kiểm tra nhỏ</td>
            <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>20</td>
            <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>{qAvg}</td>
          </tr>

          {/* Kiểm tra lớn */}
          <tr>
            <td rowSpan={2} style={{ fontWeight: 600 }}>Điểm kiểm tra lớn</td>
            <td>Điểm kiểm tra lớn</td>
            <td style={{ textAlign: 'center' }}>45</td>
            <td style={{ textAlign: 'center' }}>{renderCell('final_score')}</td>
          </tr>
          <tr style={{ background: 'var(--bg-main)' }}>
            <td style={{ fontWeight: 600 }}>Tổng điểm kiểm tra lớn</td>
            <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>45</td>
            <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>
              {board.final_score !== null ? Number(board.final_score).toFixed(1) : ''}
            </td>
          </tr>

          {/* Tổng kết */}
          <tr style={{ background: 'var(--primary-light)' }}>
            <td colSpan={2} style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>
              ĐIỂM TRUNG BÌNH TỔNG KẾT
            </td>
            <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>100</td>
            <td style={{
              textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem',
              color: board.average_score && board.average_score >= 5 ? 'var(--success)' : (board.average_score !== null ? 'var(--danger)' : 'var(--text-muted)')
            }}>
              {board.average_score !== null ? board.average_score.toFixed(1) : '—'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// ─── History Card (collapsed view) ────────────────────────────────────────────
const HistoryCard: React.FC<{ board: ScoreBoard; index: number }> = ({ board, index }) => {
  const [expanded, setExpanded] = useState(false);
  const score = board.average_score;
  const scoreColor = score !== null ? (score >= 8 ? '#059669' : score >= 6.5 ? '#d97706' : score >= 5 ? '#2563eb' : '#dc2626') : 'var(--text-muted)';
  const rankLabel = score !== null ? (score >= 8 ? 'Giỏi' : score >= 6.5 ? 'Khá' : score >= 5 ? 'TB' : 'Yếu') : '—';

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '10px',
      overflow: 'hidden',
      background: 'var(--surface-solid)',
      transition: 'box-shadow 0.2s'
    }}>
      {/* Card Header - always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        {/* Index badge */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--bg-main)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0
        }}>
          {index + 1}
        </div>

        {/* Cycle + title info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>
              {board.cycle ? board.cycle.name : board.title || 'Bảng điểm'}
            </span>
            {board.cycle && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                · {board.cycle.completed_sessions}/{board.cycle.total_sessions} buổi
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            <Clock size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Chốt ngày {new Date(board.created_at).toLocaleDateString('vi-VN')}
            {board.cycle?.start_date && (
              <span> · Từ {new Date(board.cycle.start_date).toLocaleDateString('vi-VN')}</span>
            )}
          </div>
        </div>

        {/* Score summary */}
        <div style={{ display: 'flex', align: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
              {score !== null ? score.toFixed(1) : '—'}
            </div>
            <div style={{ fontSize: '11px', color: scoreColor, fontWeight: 600 }}>{rankLabel}</div>
          </div>
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <ScoreTable
            board={board}
            editData={board}
            isEditable={false}
            onInputChange={() => {}}
          />
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const StudentScoreCard: React.FC<{ student: Student }> = ({ student }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [boards, setBoards] = useState<ScoreBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editData, setEditData] = useState<Record<string, Partial<ScoreBoard>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<string>('');
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => { fetchBoards(); }, [student.id]);

  const fetchBoards = async () => {
    try {
      const res = await api.get(`/students/${student.id}/scoreboards`);
      const rawData = res.data.boards || res.data;
      let data = rawData as ScoreBoard[];
      if (user?.role === 'PARENT') {
        data = data.filter(b => b.is_approved);
      }
      const sorted = [...data].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setBoards(sorted);
      const subjects = Array.from(new Set(sorted.map(b => b.subject)));
      if (subjects.length > 0 && (!activeSubject || !subjects.includes(activeSubject))) {
        setActiveSubject(subjects[0]);
      }
      const initEdit: any = {};
      sorted.forEach(b => { initEdit[b.id] = { ...b }; });
      setEditData(initEdit);
    } catch (err) {
      console.error(err);
      showError('Lỗi khi tải bảng điểm');
    } finally {
      setIsLoading(false);
    }
  };

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
      await api.put(`/scoreboards/${boardId}`, editData[boardId]);
      showSuccess('Đã lưu điểm thành công');
      fetchBoards();
    } catch { showError('Lỗi khi lưu điểm'); }
    finally { setSaving(null); }
  };

  const handleApprove = async (boardId: string) => {
    if (!window.confirm('Sau khi duyệt, bảng điểm này sẽ được lưu vào lịch sử và tự động tạo bảng điểm mới cho chu kỳ tiếp theo. Tiếp tục?')) return;
    try {
      setSaving(boardId);
      await api.put(`/scoreboards/${boardId}`, editData[boardId]);
      await api.post(`/scoreboards/${boardId}/approve`);
      showSuccess('Đã chốt bảng điểm và tạo chu kỳ mới!');
      fetchBoards();
    } catch { showError('Lỗi khi duyệt bảng điểm'); }
    finally { setSaving(null); }
  };

  const subjects = Array.from(new Set(boards.map(b => b.subject)));
  const subjectBoards = boards.filter(b => b.subject === activeSubject);
  // newest-first: first unapproved = current, rest = history
  const currentBoard = subjectBoards.find(b => !b.is_approved) || null;
  const historyBoards = subjectBoards.filter(b => b.is_approved);

  return (
    <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
        <div style={{
          background: 'var(--primary-light)', color: 'var(--primary)',
          width: 48, height: 48, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.25rem', fontWeight: 'bold'
        }}>
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

          {/* ── Tabs Môn Học ── */}
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
            {subjects.map(sub => (
              <button
                key={sub}
                onClick={() => setActiveSubject(sub)}
                style={{
                  background: 'none', border: 'none',
                  borderBottom: activeSubject === sub ? '2px solid var(--accent)' : '2px solid transparent',
                  color: activeSubject === sub ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: activeSubject === sub ? 'bold' : 'normal',
                  padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '15px', whiteSpace: 'nowrap'
                }}
              >
                Môn: {sub}
                {/* Badge: số lịch sử */}
                {(() => {
                  const hist = boards.filter(b => b.subject === sub && b.is_approved).length;
                  return hist > 0 ? (
                    <span style={{
                      marginLeft: '6px', background: 'var(--bg-main)',
                      border: '1px solid var(--border)', borderRadius: '10px',
                      fontSize: '11px', padding: '1px 6px', color: 'var(--text-muted)'
                    }}>{hist} lịch sử</span>
                  ) : null;
                })()}
              </button>
            ))}
          </div>

          {/* ── Bảng điểm ĐANG HỌC ── */}
          {currentBoard ? (
            <div>
              {/* Section label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#f59e0b', boxShadow: '0 0 0 3px #fef3c7'
                }} />
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                  Bảng điểm hiện tại
                </span>
                {currentBoard.cycle && (
                  <span style={{
                    fontSize: '12px', background: 'rgba(245,158,11,0.1)',
                    color: '#d97706', padding: '2px 10px', borderRadius: '12px', fontWeight: 600
                  }}>
                    📋 {currentBoard.cycle.name} · {currentBoard.cycle.completed_sessions}/{currentBoard.cycle.total_sessions} buổi
                  </span>
                )}
              </div>

              <div style={{ border: '2px solid #f59e0b', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(245,158,11,0.12)' }}>
                {/* Board header */}
                <div style={{
                  padding: '14px 20px', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                  borderBottom: '1px solid #fde68a',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    {user?.role === 'TUTOR' ? (
                      <input
                        type="text"
                        className="form-control"
                        value={editData[currentBoard.id]?.title || currentBoard.title || ''}
                        onChange={(e) => handleInputChange(currentBoard.id, 'title', e.target.value)}
                        style={{ fontSize: '1rem', fontWeight: 'bold', color: '#92400e', padding: '4px 8px', width: '100%', maxWidth: '280px', background: 'rgba(255,255,255,0.7)', border: '1px solid #fde68a' }}
                        placeholder="Tên bảng điểm (VD: Tháng 10)..."
                      />
                    ) : (
                      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e' }}>
                        <Award size={18} />
                        {currentBoard.title || `Bảng điểm ${currentBoard.subject}`}
                      </h3>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ background: '#fde68a', color: '#92400e', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                      ⏳ Đang học
                    </span>
                    {user?.role === 'TUTOR' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-secondary"
                          onClick={() => handleSave(currentBoard.id)}
                          disabled={saving === currentBoard.id}
                          style={{ padding: '6px 14px', fontSize: '13px' }}
                        >
                          <Save size={14} /> Lưu điểm
                        </button>
                        <button
                          className="btn-primary"
                          onClick={() => handleApprove(currentBoard.id)}
                          disabled={saving === currentBoard.id}
                          style={{ padding: '6px 14px', fontSize: '13px' }}
                        >
                          <Check size={14} /> Duyệt & Công bố
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Score table */}
                <ScoreTable
                  board={{ ...currentBoard, ...editData[currentBoard.id] } as ScoreBoard}
                  editData={editData[currentBoard.id] || currentBoard}
                  isEditable={user?.role === 'TUTOR'}
                  onInputChange={(field, value) => handleInputChange(currentBoard.id, field, value)}
                />
              </div>
            </div>
          ) : (
            user?.role !== 'PARENT' && (
              <div style={{
                padding: '16px', background: 'var(--bg-main)', borderRadius: '10px',
                border: '1px dashed var(--border)', color: 'var(--text-muted)',
                fontSize: '14px', textAlign: 'center'
              }}>
                Không có bảng điểm đang hoạt động cho môn này.
              </div>
            )
          )}

          {/* ── Lịch sử bảng điểm ── */}
          {historyBoards.length > 0 && (
            <div>
              {/* Section toggle header */}
              <button
                onClick={() => setShowHistory(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                  background: 'var(--bg-main)', border: '1px solid var(--border)',
                  borderRadius: showHistory ? '10px 10px 0 0' : '10px',
                  padding: '10px 16px', cursor: 'pointer', marginBottom: 0
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#10b981', boxShadow: '0 0 0 3px #d1fae5'
                }} />
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)', flex: 1, textAlign: 'left' }}>
                  <BookOpen size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Lịch sử bảng điểm
                </span>
                <span style={{
                  background: '#d1fae5', color: '#065f46',
                  padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, marginRight: '8px'
                }}>
                  {historyBoards.length} chu kỳ
                </span>
                {showHistory ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
              </button>

              {showHistory && (
                <div style={{
                  border: '1px solid var(--border)', borderTop: 'none',
                  borderRadius: '0 0 10px 10px',
                  padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px',
                  background: 'var(--surface-solid)'
                }}>
                  {historyBoards.map((b, idx) => (
                    <HistoryCard key={b.id} board={b} index={idx} />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default StudentScoreCard;
