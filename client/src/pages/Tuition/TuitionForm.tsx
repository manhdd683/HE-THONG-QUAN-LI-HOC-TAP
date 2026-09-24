// @ts-nocheck
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../utils/api';

interface Student {
  id: string;
  name: string;
  price_per_session: number;
  student_subjects?: {
    subject: string;
    price_per_session: number;
  }[];
}

interface TuitionFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const TuitionForm: React.FC<TuitionFormProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    student_id: '',
    name: 'Chu kỳ học phí tháng ' + (new Date().getMonth() + 1),
    subject: '',
    total_sessions: '10',
    price_per_session: '0'
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // New state for mixed subjects
  const [mixedSessions, setMixedSessions] = useState<{ [subject: string]: number }>({});
  
  // New state for unbilled sessions
  const [unbilledSessions, setUnbilledSessions] = useState<any[]>([]);
  const [isLoadingUnbilled, setIsLoadingUnbilled] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.get('/students');
        setStudents(response.data);
        if (response.data.length > 0) {
          const firstStudent = response.data[0];
          setFormData(prev => ({ 
            ...prev, 
            student_id: firstStudent.id,
            price_per_session: firstStudent.price_per_session?.toString() || '0'
          }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStudents();
  }, []);

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const studentId = e.target.value;
    const student = students.find(s => s.id === studentId);
    
    // Auto-select AUTO_CALCULATE if exists
    setFormData({
      ...formData,
      student_id: studentId,
      subject: 'AUTO_CALCULATE',
      price_per_session: '0'
    });
    setMixedSessions({});
  };

  useEffect(() => {
    if (formData.subject === 'AUTO_CALCULATE' && formData.student_id) {
      setIsLoadingUnbilled(true);
      api.get(`/tuition/unbilled/${formData.student_id}`)
        .then(res => setUnbilledSessions(res.data))
        .catch(err => {
          console.error(err);
          setError('Không thể lấy lịch sử điểm danh');
        })
        .finally(() => setIsLoadingUnbilled(false));
    }
  }, [formData.subject, formData.student_id]);

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subjectName = e.target.value;
    const student = students.find(s => s.id === formData.student_id);
    const selectedSubj = student?.student_subjects?.find(s => s.subject === subjectName);
    
    setFormData({
      ...formData,
      subject: subjectName,
      price_per_session: (selectedSubj?.price_per_session || student?.price_per_session || 0).toString()
    });
    
    if (subjectName === 'MIXED_SUBJECTS' && student?.student_subjects) {
      const initialMixed: { [key: string]: number } = {};
      student.student_subjects.forEach(s => initialMixed[s.subject] = 0);
      setMixedSessions(initialMixed);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let finalTotalSessions = parseInt(formData.total_sessions);
      let payload: any = {
        ...formData,
        total_sessions: finalTotalSessions,
        price_per_session: parseFloat(formData.price_per_session)
      };

      if (formData.subject === 'MIXED_SUBJECTS') {
        const student = students.find(s => s.id === formData.student_id);
        let totalAmt = 0;
        let totalSess = 0;
        const subjectNames: string[] = [];
        
        Object.entries(mixedSessions).forEach(([subj, count]) => {
          if (count > 0) {
            const subjPrice = student?.student_subjects?.find(s => s.subject === subj)?.price_per_session || 0;
            totalAmt += count * subjPrice;
            totalSess += count;
            subjectNames.push(`${subj} (${count}b)`);
          }
        });
        
        if (totalSess === 0) {
          setError('Vui lòng nhập ít nhất 1 buổi học');
          setIsLoading(false);
          return;
        }

        payload.total_sessions = totalSess;
        payload.total_amount = totalAmt;
        payload.subject = `Gộp: ${subjectNames.join(', ')}`;
        payload.price_per_session = 0;
      } else if (formData.subject === 'AUTO_CALCULATE') {
        const student = students.find(s => s.id === formData.student_id);
        const grouped = unbilledSessions.reduce((acc, curr) => {
          const subj = curr.schedule.subject;
          acc[subj] = (acc[subj] || 0) + 1;
          return acc;
        }, {} as any);

        let totalAmt = 0;
        let totalSess = unbilledSessions.length;
        const subjectNames: string[] = [];

        Object.entries(grouped).forEach(([subj, count]: [string, any]) => {
          const subjPrice = student?.student_subjects?.find(s => s.subject === subj)?.price_per_session || 0;
          totalAmt += count * subjPrice;
          subjectNames.push(`${subj} (${count}b)`);
        });

        if (totalSess === 0) {
          setError('Không có buổi học nào chưa chốt tiền. Vui lòng chọn cách tạo thủ công.');
          setIsLoading(false);
          return;
        }

        payload.total_sessions = totalSess;
        payload.total_amount = totalAmt;
        payload.subject = `Chốt tự động: ${subjectNames.join(', ')}`;
        payload.price_per_session = 0;
        payload.session_ids = unbilledSessions.map(s => s.id);
      }

      await api.post('/tuition', payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra khi tạo chu kỳ học phí');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h2>Tạo Chu Kỳ Học Phí</h2>
          <button className="btn-icon" onClick={onClose}><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          
          <div className="form-group">
            <label>Học sinh *</label>
            <select
              name="student_id"
              className="form-input"
              value={formData.student_id}
              onChange={handleStudentChange}
              required
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tên chu kỳ *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Môn học (Tùy chọn)</label>
            {(() => {
              const selectedStudent = students.find(s => s.id === formData.student_id);
              if (selectedStudent?.student_subjects && selectedStudent.student_subjects.length > 0) {
                return (
                  <select
                    name="subject"
                    className="form-input"
                    value={formData.subject}
                    onChange={handleSubjectChange}
                  >
                    <option value="AUTO_CALCULATE">✨ Tự động tính (Theo lịch sử điểm danh)</option>
                    <option value="">-- Mặc định (Tự tạo) --</option>
                    <option value="MIXED_SUBJECTS">Gộp nhiều môn (Tự nhập số buổi)</option>
                    {selectedStudent.student_subjects.map((sub, idx) => (
                      <option key={idx} value={sub.subject}>{sub.subject} ({sub.price_per_session.toLocaleString()}đ)</option>
                    ))}
                  </select>
                );
              }
              
              return (
                <input
                  type="text"
                  name="subject"
                  className="form-input"
                  placeholder="VD: Toán, Tiếng Anh... (Bỏ trống nếu áp dụng chung)"
                  value={formData.subject}
                  onChange={handleChange}
                />
              );
            })()}
          </div>

          {formData.subject === 'MIXED_SUBJECTS' ? (
            <div className="mixed-subjects-container" style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-main)' }}>Nhập số buổi cho từng môn</h4>
              {(() => {
                const selectedStudent = students.find(s => s.id === formData.student_id);
                return selectedStudent?.student_subjects?.map((sub, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>
                      {sub.subject} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '12px' }}>({sub.price_per_session.toLocaleString()}đ/b)</span>
                    </div>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '80px', padding: '6px 10px', textAlign: 'center' }}
                      min="0"
                      value={mixedSessions[sub.subject] || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setMixedSessions(prev => ({ ...prev, [sub.subject]: val }));
                      }}
                    />
                  </div>
                ));
              })()}
              
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                <span>Tổng tiền dự kiến:</span>
                <span style={{ color: 'var(--primary)' }}>
                  {(() => {
                    const student = students.find(s => s.id === formData.student_id);
                    let total = 0;
                    Object.entries(mixedSessions).forEach(([subj, count]) => {
                      const price = student?.student_subjects?.find(s => s.subject === subj)?.price_per_session || 0;
                      total += count * price;
                    });
                    return total.toLocaleString() + 'đ';
                  })()}
                </span>
              </div>
            </div>
          ) : formData.subject === 'AUTO_CALCULATE' ? (
            <div className="auto-calc-container" style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #bbf7d0' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Dữ liệu chưa thanh toán
              </h4>
              {isLoadingUnbilled ? (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Đang quét dữ liệu điểm danh...</div>
              ) : unbilledSessions.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Không tìm thấy buổi học nào chưa tính tiền. (Nếu bạn vừa tạo tay chu kỳ, các buổi trước đó không tự liên kết. Tính năng này chỉ dùng cho các buổi điểm danh từ bây giờ).
                </div>
              ) : (
                <>
                  {(() => {
                    const student = students.find(s => s.id === formData.student_id);
                    const grouped = unbilledSessions.reduce((acc, curr) => {
                      const subj = curr.schedule.subject;
                      acc[subj] = (acc[subj] || 0) + 1;
                      return acc;
                    }, {} as any);

                    return Object.entries(grouped).map(([subj, count]: [string, any], idx) => {
                      const price = student?.student_subjects?.find(s => s.subject === subj)?.price_per_session || 0;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                          <div>{subj}</div>
                          <div><strong style={{ color: 'var(--text-main)' }}>{count} buổi</strong> <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>(x {price.toLocaleString()}đ)</span></div>
                        </div>
                      );
                    });
                  })()}
                  
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #bbf7d0', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>Tổng hóa đơn ({unbilledSessions.length} buổi):</span>
                    <span style={{ color: 'var(--success)' }}>
                      {(() => {
                        const student = students.find(s => s.id === formData.student_id);
                        let total = 0;
                        unbilledSessions.forEach(s => {
                          const subj = s.schedule.subject;
                          const price = student?.student_subjects?.find(sub => sub.subject === subj)?.price_per_session || 0;
                          total += price;
                        });
                        return total.toLocaleString() + 'đ';
                      })()}
                    </span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Số buổi học *</label>
                <input
                  type="number"
                  name="total_sessions"
                  className="form-input"
                  min="1"
                  value={formData.total_sessions}
                  onChange={handleChange}
                  required
                />
              </div>

              {formData.subject !== '' && (
                <div className="form-group">
                  <label>Học phí / Buổi (VNĐ) *</label>
                  <input
                    type="number"
                    name="price_per_session"
                    className="form-input"
                    min="0"
                    value={formData.price_per_session}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}
            </>
          )}

          {formData.subject === '' && (
            <div className="form-group" style={{ background: 'var(--glass-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '13px', color: 'var(--accent)' }}>
                💡 <strong>Tính tiền tự động:</strong> Hệ thống sẽ tự động cộng dồn tiền học phí theo từng buổi dựa trên môn học thực tế mà học sinh tham gia điểm danh. Tổng tiền ban đầu sẽ là 0 VNĐ.
              </span>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Đang tạo...' : 'Tạo chu kỳ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TuitionForm;
