// @ts-nocheck
import { useState, useEffect } from 'react';
import { Plus, DollarSign, ReceiptText } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import TuitionForm from './TuitionForm';
import PaymentForm from './PaymentForm';
import TuitionDetailModal from './TuitionDetailModal';

export interface TuitionCycle {
  id: string;
  name: string;
  subject?: string;
  total_sessions: number;
  completed_sessions: number;
  price_per_session: number;
  total_amount: number;
  paid_amount: number;
  status: string;
  start_date: string;
  student: {
    id: string;
    name: string;
  };
}

const TuitionList: React.FC = () => {
  const [cycles, setCycles] = useState<TuitionCycle[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<TuitionCycle | null>(null);
  const { user } = useAuth();
  const { showInfo } = useToast();

  const fetchCycles = async () => {
    try {
      const response = await api.get('/tuition');
      setCycles(response.data);
    } catch (error) {
      console.error('Failed to fetch tuition cycles', error);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  const handlePayment = (cycle: TuitionCycle) => {
    setSelectedCycle(cycle);
    setIsPaymentOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Học phí</h1>
          <p>Quản lý các chu kỳ học phí và thanh toán</p>
        </div>
        {user?.role === 'TUTOR' && (
          <button className="btn-primary" onClick={() => setIsFormOpen(true)} style={{ display: 'flex', gap: '8px', width: 'auto' }}>
            <Plus size={20} />
            <span>Tạo Chu Kỳ Mới</span>
          </button>
        )}
      </div>

      <div className="data-table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Học sinh</th>
              <th>Chu kỳ</th>
              <th>Tiến độ học</th>
              <th>Tổng tiền</th>
              <th>Đã thu</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {cycles.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Chưa có dữ liệu học phí</td>
              </tr>
            ) : (
              cycles.map(cycle => (
                <tr key={cycle.id}>
                  <td>{cycle.student.name}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      <strong style={{ whiteSpace: 'nowrap' }}>{cycle.name}</strong>
                      {cycle.subject ? (
                        <span className="subject-badge">{cycle.subject}</span>
                      ) : (
                        <span className="subject-badge empty">Tất cả các môn</span>
                      )}
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Từ: {new Date(cycle.start_date).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: cycle.completed_sessions >= cycle.total_sessions ? 'bold' : 'normal', color: cycle.completed_sessions >= cycle.total_sessions ? 'var(--accent)' : 'inherit' }}>
                        {cycle.completed_sessions} / {cycle.total_sessions} buổi
                      </span>
                    </div>
                  </td>
                  <td>
                    {formatCurrency(cycle.total_amount)}
                    {!cycle.subject && cycle.completed_sessions < cycle.total_sessions && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Tạm tính)</div>
                    )}
                  </td>
                  <td>
                    <span style={{ color: cycle.paid_amount >= cycle.total_amount ? 'var(--success)' : 'inherit' }}>
                      {formatCurrency(cycle.paid_amount)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${cycle.status.toLowerCase()}`}>
                      {cycle.status === 'PAID' ? 'Đã thanh toán' : cycle.status === 'UNPAID' ? 'Chưa thanh toán' : cycle.status === 'PARTIAL' ? 'Thanh toán một phần' : cycle.status === 'OVERDUE' ? 'Quá hạn' : cycle.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {user?.role === 'TUTOR' && cycle.status !== 'PAID' && (
                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handlePayment(cycle)}>
                          <DollarSign size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                          Thu tiền
                        </button>
                      )}
                      
                      <button className="btn-icon" title="Hóa đơn / Chi tiết" onClick={() => { setSelectedCycle(cycle); setIsDetailOpen(true); }}>
                        <ReceiptText size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <TuitionForm
          onClose={() => setIsFormOpen(false)}
          onSuccess={fetchCycles}
        />
      )}

      {isPaymentOpen && selectedCycle && (
        <PaymentForm
          cycle={selectedCycle}
          onClose={() => setIsPaymentOpen(false)}
          onSuccess={fetchCycles}
        />
      )}

      {isDetailOpen && selectedCycle && (
        <TuitionDetailModal
          cycle={selectedCycle}
          onClose={() => setIsDetailOpen(false)}
        />
      )}
    </div>
  );
};

export default TuitionList;
