import { X } from 'lucide-react';
import type { Student } from './StudentsList';
import StudentScoreCard from '../Scores/StudentScoreCard';

interface StudentScoreModalProps {
  student: Student;
  onClose: () => void;
}

const StudentScoreModal: React.FC<StudentScoreModalProps> = ({ student, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>Quản lý Bảng điểm</h2>
          <button className="btn-icon" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div style={{ marginTop: '1rem' }}>
          <StudentScoreCard student={student} />
        </div>

        <div className="modal-actions" style={{ marginTop: '1rem' }}>
          <button className="btn-secondary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default StudentScoreModal;
