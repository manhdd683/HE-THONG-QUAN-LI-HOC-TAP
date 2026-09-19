import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: ('TUTOR' | 'PARENT')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect based on role if they try to access unauthorized route
    return <Navigate to={user.role === 'TUTOR' ? '/tutor/dashboard' : '/parent/dashboard'} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
