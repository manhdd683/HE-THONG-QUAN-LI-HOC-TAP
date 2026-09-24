// @ts-nocheck
import { useState, useEffect } from 'react';
import { Award, FileText, CheckCircle, Save, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';
import type { Student } from '../Students/StudentsList';

interface ScoreBoard {
  id: string;
  student_id: string;
  subject: string;
  daily_score: number | null;
  homework_1: number | null;
  homework_2: number | null;
  quiz_1: number | null;
  quiz_2: number | null;
  final_score: number | null;
  average_score: number | null;
  is_approved: boolean;
}

const StudentScoreCard: React.FC<{ student: Student }> = ({ student }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [boards, setBoards] = useState<ScoreBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit state (only for TUTOR)
  const [editData, setEditData] = useState<Record<string, Partial<ScoreBoard>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<string>('');

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
      const sortedBoards = [...data].sort((a: any, b: any) => a.subject.localeCompare(b.subject));
      setBoards(sortedBoards);
      if (sortedBoards.length > 0) {
        setActiveTab(sortedBoards[0].subject);
      }
      
      const initEdit: any = {};
      sortedBoards.forEach(b => {
        initEdit[b.id] = { ...b };
      });
      setEditData(initEdit);
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải bảng điểm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (boardId: string, field: keyof ScoreBoard, value: string) => {
    setEditData(prev => ({
      ...prev,
      [boardId]: {
        ...prev[boardId],
        [field]: value === '' ? '' : Number(value)
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
    try {
      setSaving(boardId);
      await api.post(`/scoreboards/${boardId}/approve`);
      showSuccess('Đã duyệt bảng điểm. Phụ huynh hiện có thể xem.');
      fetchBoards();
    } catch (error) {
      showError('Lỗi khi duyệt bảng điểm');
    } finally {
      setSaving(null);
    }
  };

  const renderInput = (boardId: string, field: keyof ScoreBoard) => {
    if (user?.role === 'PARENT') {
      const val = editData[boardId]?.[field];
      return <span style={{ fontWeight: 600, color: val !== null ? 'var(--text-main)' : 'var(--text-muted)' }}>{val !== null ? val : '—'}</span>;
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
            {user?.role === 'PARENT' ? 'Gia sư chưa công bố bảng điểm nào.' : 'Chưa có dữ liệu bảng điểm.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
            {boards.map(board => (
              <button
                key={board.id}
                className={`tab-btn ${activeTab === board.subject ? 'active' : ''}`}
                onClick={() => setActiveTab(board.subject)}
                style={{ 
                  background: 'none', border: 'none', borderBottom: activeTab === board.subject ? '2px solid var(--accent)' : '2px solid transparent',
                  color: activeTab === board.subject ? 'var(--accent)' : 'var(--text-muted)', fontWeight: activeTab === board.subject ? 'bold' : 'normal',
                  padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '15px', whiteSpace: 'nowrap'
                }}
              >
                Môn: {board.subject}
              </button>
            ))}
          </div>

          {boards.filter(b => b.subject === activeTab).map(board => (
            <div key={board.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', background: 'var(--surface-solid)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                  <Award size={20} />
                  Môn học: {board.subject}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {board.is_approved ? (
                    <span className="status-badge active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={14} /> Đã duyệt
                    </span>
                  ) : (
                    <span className="status-badge" style={{ background: '#fef3c7', color: '#d97706' }}>
                      Bản nháp
                    </span>
                  )}
                  {user?.role === 'TUTOR' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-secondary" onClick={() => handleSave(board.id)} disabled={saving === board.id} style={{ padding: '6px 12px', fontSize: '13px' }}>
                        <Save size={14} /> Lưu nháp
                      </button>
                      {!board.is_approved && (
                        <button className="btn-primary" onClick={() => handleApprove(board.id)} disabled={saving === board.id} style={{ padding: '6px 12px', fontSize: '13px' }}>
                          <Check size={14} /> Duyệt & Công bố
                        </button>
                      )}
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
                      <td style={{ textAlign: 'center' }}>{renderInput(board.id, 'daily_score')}</td>
                    </tr>
                    <tr style={{ background: 'var(--bg-main)' }}>
                      <td style={{ fontWeight: 600 }}>Tổng điểm thường xuyên</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>15</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>
                        {board.daily_score !== null ? Number(board.daily_score).toFixed(1) : ""}
                      </td>
                    </tr>
                    
                    {/* Bài về nhà */}
                    <tr>
                      <td rowSpan={3} style={{ fontWeight: 600 }}>Điểm bài về nhà</td>
                      <td>Bài về nhà số 1</td>
                      <td style={{ textAlign: 'center' }}>10</td>
                      <td style={{ textAlign: 'center' }}>{renderInput(board.id, 'homework_1')}</td>
                    </tr>
                    <tr>
                      <td>Bài về nhà số 2</td>
                      <td style={{ textAlign: 'center' }}>10</td>
                      <td style={{ textAlign: 'center' }}>{renderInput(board.id, 'homework_2')}</td>
                    </tr>
                    <tr style={{ background: 'var(--bg-main)' }}>
                      <td style={{ fontWeight: 600 }}>Tổng điểm bài về nhà</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>20</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>
                        {(board.homework_1 !== null || board.homework_2 !== null) ? 
                          (((Number(board.homework_1) || 0) + (Number(board.homework_2) || 0)) / ((board.homework_1 !== null && board.homework_1 !== "" ? 1 : 0) + (board.homework_2 !== null && board.homework_2 !== "" ? 1 : 0))).toFixed(1) 
                          : ""}
                      </td>
                    </tr>

                    {/* Kiểm tra nhỏ */}
                    <tr>
                      <td rowSpan={3} style={{ fontWeight: 600 }}>Kiểm tra nhỏ</td>
                      <td>Kiểm tra nhỏ 1</td>
                      <td style={{ textAlign: 'center' }}>10</td>
                      <td style={{ textAlign: 'center' }}>{renderInput(board.id, 'quiz_1')}</td>
                    </tr>
                    <tr>
                      <td>Kiểm tra nhỏ 2</td>
                      <td style={{ textAlign: 'center' }}>10</td>
                      <td style={{ textAlign: 'center' }}>{renderInput(board.id, 'quiz_2')}</td>
                    </tr>
                    <tr style={{ background: 'var(--bg-main)' }}>
                      <td style={{ fontWeight: 600 }}>Tổng điểm kiểm tra nhỏ</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>20</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>
                        {(board.quiz_1 !== null || board.quiz_2 !== null) ? 
                          (((Number(board.quiz_1) || 0) + (Number(board.quiz_2) || 0)) / ((board.quiz_1 !== null && board.quiz_1 !== "" ? 1 : 0) + (board.quiz_2 !== null && board.quiz_2 !== "" ? 1 : 0))).toFixed(1) 
                          : ""}
                      </td>
                    </tr>

                    {/* Kiểm tra lớn */}
                    <tr>
                      <td rowSpan={2} style={{ fontWeight: 600 }}>Điểm kiểm tra lớn</td>
                      <td>Điểm kiểm tra lớn</td>
                      <td style={{ textAlign: 'center' }}>45</td>
                      <td style={{ textAlign: 'center' }}>{renderInput(board.id, 'final_score')}</td>
                    </tr>
                    <tr style={{ background: 'var(--bg-main)' }}>
                      <td style={{ fontWeight: 600 }}>Tổng điểm kiểm tra lớn</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>45</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>
                        {board.final_score !== null ? Number(board.final_score).toFixed(1) : ""}
                      </td>
                    </tr>

                    {/* TỔNG KẾT */}
                    <tr style={{ background: 'var(--primary-light)' }}>
                      <td colSpan={2} style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>ĐIỂM TRUNG BÌNH TỔNG KẾT</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>100</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem', color: board.average_score && board.average_score >= 5 ? 'var(--success)' : 'var(--danger)' }}>
                        {board.average_score !== null ? board.average_score.toFixed(1) : '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentScoreCard;
