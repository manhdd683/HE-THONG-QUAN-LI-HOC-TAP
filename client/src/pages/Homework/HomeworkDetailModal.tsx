// @ts-nocheck
import React from 'react';
import { X, Book, Calendar, CheckCircle, MessageCircle, FileText, Award, Download, Paperclip } from 'lucide-react';
import type { Homework } from './HomeworkList';

interface HomeworkDetailModalProps {
  homework: Homework;
  onClose: () => void;
}

const HomeworkDetailModal: React.FC<HomeworkDetailModalProps> = ({ homework, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
        <div className="modal-header">
          <h2>Chi tiết bài tập</h2>
          <button className="btn-icon" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
          {/* Header info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--primary)' }}>{homework.title}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="badge" style={{ background: 'var(--primary)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>
                  {homework.subject || 'Chung'}
                </span>
                <span className={`status-badge status-${homework.status.toLowerCase()}`}>
                  {homework.status === 'PENDING' ? 'Chờ nộp' : homework.status === 'SUBMITTED' ? 'Đã nộp' : homework.status === 'GRADED' ? 'Đã chấm' : homework.status}
                </span>
              </div>
            </div>
            {homework.score !== null && (
              <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.02)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Điểm số</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{homework.score}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/10</span></div>
              </div>
            )}
          </div>

          {/* Details list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.02)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <FileText size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Nội dung / Mô tả:</strong>
                <p style={{ margin: 0, color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {homework.description || 'Không có mô tả'}
                </p>
              </div>
            </div>

            {/* Attachments */}
            {homework.attachments && homework.attachments.length > 0 && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Paperclip size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <div style={{ width: '100%' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Tệp đính kèm:</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {homework.attachments.map(att => {
                      const isImage = att.type.startsWith('image/');
                      const isVideo = att.type.startsWith('video/');
                      
                      return (
                        <div key={att.id} style={{ padding: '1rem', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          {isImage ? (
                            <div>
                              <img src={att.url} alt={att.title} style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px', objectFit: 'contain' }} />
                              <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                                <a href={att.url} target="_blank" rel="noreferrer" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 8px', textDecoration: 'none' }}><Download size={12} style={{ marginRight: '4px', display: 'inline' }} /> Tải ảnh xuống</a>
                              </div>
                            </div>
                          ) : isVideo ? (
                            <div>
                              <video src={att.url} controls style={{ width: '100%', maxHeight: '400px', borderRadius: '4px' }} />
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={16} color="var(--primary)" />
                                <span>{att.title}</span>
                              </div>
                              <a href={att.url} target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Download size={14} /> Tải xuống
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <Calendar size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Hạn nộp:</strong>
                <p style={{ margin: 0, color: 'var(--text)' }}>
                  {homework.due_date ? new Date(homework.due_date).toLocaleDateString('vi-VN') : 'Không có hạn'}
                </p>
              </div>
            </div>

            {homework.submission_text && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <CheckCircle size={20} color="var(--success)" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Nội dung đã nộp:</strong>
                  <p style={{ margin: 0, color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: '1.5', background: 'rgba(255,255,255,0.5)', padding: '0.75rem', borderRadius: '6px' }}>
                    {homework.submission_text}
                  </p>
                </div>
              </div>
            )}

            {homework.feedback && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <MessageCircle size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Nhận xét của Gia sư:</strong>
                  <p style={{ margin: 0, color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: '1.5', background: 'rgba(224, 142, 69, 0.1)', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid var(--accent)' }}>
                    {homework.feedback}
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>
        
        <div className="modal-actions" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default HomeworkDetailModal;
