import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../utils/api';
import type { TuitionCycle } from './TuitionList';

interface PaymentFormProps {
  cycle: TuitionCycle;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ cycle, onClose, onSuccess }) => {
  const remainingAmount = cycle.total_amount - cycle.paid_amount;
  
  const [formData, setFormData] = useState({
    amount: remainingAmount > 0 ? remainingAmount.toString() : '0',
    method: 'CASH',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post(`/tuition/${cycle.id}/payment`, formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra khi ghi nhận thanh toán');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h2>Thu Tiền: {cycle.name}</h2>
          <button className="btn-icon" onClick={onClose}><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          
          <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
            <p><strong>Học sinh:</strong> {cycle.student.name}</p>
            <p><strong>Tổng tiền:</strong> {formatCurrency(cycle.total_amount)}</p>
            <p><strong>Đã thu:</strong> <span style={{ color: 'var(--success)' }}>{formatCurrency(cycle.paid_amount)}</span></p>
            <p><strong>Còn lại cần thu:</strong> <span style={{ color: 'var(--error)' }}>{formatCurrency(remainingAmount)}</span></p>
          </div>

          <div className="form-group">
            <label>Số tiền thu (VNĐ) *</label>
            <input
              type="number"
              name="amount"
              min="1"
              max={remainingAmount}
              className="form-input"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Phương thức thanh toán *</label>
            <select
              name="method"
              className="form-input"
              value={formData.method}
              onChange={handleChange}
            >
              <option value="CASH">Tiền mặt</option>
              <option value="BANK_TRANSFER">Chuyển khoản</option>
              <option value="E_WALLET">Ví điện tử (Momo, ZaloPay...)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Ghi chú</label>
            <textarea
              name="notes"
              className="form-input"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Ghi chú thêm về khoản thanh toán..."
            />
          </div>

          <div className="form-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : 'Xác nhận Đã Thu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
