import React from 'react';
import { X, BookOpen, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import type { Schedule } from './SchedulesList';

interface SessionDetailModalProps {
  schedule: Schedule;
  onClose: () => void;
}

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({ schedule, onClose }) => {
  const session = schedule.session;

  if (!session) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={24} color="var(--primary)" />
            <h2 style={{ margin: 0 }}>Chi tiết buổi học</h2>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px dashed rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>{schedule.subject || 'Chung'}</h3>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> {new Date(schedule.date).toLocaleDateString('vi-VN')} ({schedule.start_time} - {schedule.end_time})
              </span>
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <span className={`status-badge ${session.attendance === 'PRESENT' ? 'active' : session.attendance === 'ABSENT' ? 'inactive' : 'pending'}`}>
                {session.attendance === 'PRESENT' ? 'Có mặt' : session.attendance === 'ABSENT' ? 'Vắng mặt' : 'Đi trễ'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            
            <div style={{ background: 'var(--surface-solid)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                <BookOpen size={18} />
                <span>Nội dung bài học</span>
              </div>
              <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {session.content || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Không có nội dung</span>}
              </p>
            </div>

            <div style={{ background: 'var(--surface-solid)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                <MessageSquare size={18} />
                <span>Nhận xét của gia sư</span>
              </div>
              
              {session.comments && session.comments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  {session.comments[0].understanding_level && (
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mức độ hiểu bài:</strong>
                      <div style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginTop: '2px' }}>{session.comments[0].understanding_level}</div>
                    </div>
                  )}
                  {session.comments[0].attitude && (
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Thái độ học tập:</strong>
                      <div style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginTop: '2px' }}>{session.comments[0].attitude}</div>
                    </div>
                  )}
                  {session.comments[0].strengths && (
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--success)', textTransform: 'uppercase' }}>Điểm mạnh:</strong>
                      <div style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginTop: '2px', whiteSpace: 'pre-wrap' }}>{session.comments[0].strengths}</div>
                    </div>
                  )}
                  {session.comments[0].weaknesses && (
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--danger)', textTransform: 'uppercase' }}>Điểm yếu cần cải thiện:</strong>
                      <div style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginTop: '2px', whiteSpace: 'pre-wrap' }}>{session.comments[0].weaknesses}</div>
                    </div>
                  )}
                  {!session.comments[0].understanding_level && !session.comments[0].attitude && !session.comments[0].strengths && !session.comments[0].weaknesses && (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Không có nhận xét chi tiết</span>
                  )}
                </div>
              ) : (
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', fontStyle: 'italic' }}>
                  Không có nhận xét
                </p>
              )}
            </div>

            {session.record_link && (
              <div style={{ background: 'var(--surface-solid)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                  </svg>
                  <span>Bản ghi bài học (Record)</span>
                </div>
                <a href={session.record_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline', fontSize: '0.95rem', wordBreak: 'break-all' }}>
                  {session.record_link}
                </a>
              </div>
            )}

          </div>
        </div>
        
        <div className="modal-actions" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailModal;
