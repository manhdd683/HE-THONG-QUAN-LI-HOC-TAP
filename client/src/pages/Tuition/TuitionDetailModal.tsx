import React from 'react';
import { X, Receipt, Calendar, User, BookOpen, CreditCard, CheckCircle, Clock } from 'lucide-react';
import type { TuitionCycle } from './TuitionList';

interface TuitionDetailModalProps {
  cycle: TuitionCycle;
  onClose: () => void;
}

const TuitionDetailModal: React.FC<TuitionDetailModalProps> = ({ cycle, onClose }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const isFullyPaid = cycle.paid_amount >= cycle.total_amount;
  const isOverdue = cycle.status === 'OVERDUE';
  const isPartial = cycle.status === 'PARTIAL';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Receipt size={24} color="var(--primary)" />
            <h2 style={{ margin: 0 }}>Chi tiết học phí</h2>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Header section - Receipt Style */}
          <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px dashed rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>{cycle.name}</h3>
            <div style={{ display: 'inline-block', padding: '4px 12px', background: isFullyPaid ? 'var(--success-bg)' : isOverdue ? 'var(--danger-bg)' : isPartial ? 'var(--info-bg)' : 'var(--warning-bg)', color: isFullyPaid ? 'var(--success)' : isOverdue ? 'var(--danger)' : isPartial ? 'var(--info)' : 'var(--warning)', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 'bold' }}>
              {cycle.status === 'PAID' ? 'Đã thanh toán' : cycle.status === 'UNPAID' ? 'Chưa thanh toán' : cycle.status === 'PARTIAL' ? 'Thanh toán một phần' : cycle.status === 'OVERDUE' ? 'Quá hạn' : cycle.status}
            </div>
          </div>

          {/* Details list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <User size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Học sinh</span>
                <strong style={{ color: 'var(--text-main)' }}>{cycle.student.name}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <BookOpen size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Môn học</span>
                <strong style={{ color: 'var(--text-main)' }}>{cycle.subject || 'Tất cả các môn'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Calendar size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ngày bắt đầu</span>
                <strong style={{ color: 'var(--text-main)' }}>{new Date(cycle.start_date).toLocaleDateString('vi-VN')}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Clock size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tiến độ buổi học</span>
                <strong style={{ color: 'var(--text-main)' }}>{cycle.completed_sessions} / {cycle.total_sessions} buổi</strong>
              </div>
            </div>

          </div>

          {/* Financials */}
          <div style={{ background: 'var(--surface-solid)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Đơn giá (1 buổi)</span>
              <span>{formatCurrency(cycle.price_per_session)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Tổng số buổi</span>
              <span>x {cycle.total_sessions}</span>
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px dashed var(--border)', margin: '0.5rem 0' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '1.1rem' }}>Tổng tiền</strong>
              <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{formatCurrency(cycle.total_amount)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Đã thu</span>
              <span style={{ color: 'var(--success)' }}>{formatCurrency(cycle.paid_amount)}</span>
            </div>

            {cycle.total_amount - cycle.paid_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0.75rem', background: 'var(--danger-bg)', borderRadius: '6px' }}>
                <strong style={{ color: 'var(--danger)' }}>Còn nợ</strong>
                <strong style={{ color: 'var(--danger)' }}>{formatCurrency(cycle.total_amount - cycle.paid_amount)}</strong>
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

export default TuitionDetailModal;
