import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import TutorDashboard from './pages/Dashboard/TutorDashboard';
import ParentDashboard from './pages/Dashboard/ParentDashboard';
import ParentsList from './pages/Parents/ParentsList';
import StudentsList from './pages/Students/StudentsList';
import SchedulesList from './pages/Schedules/SchedulesList';
import HomeworkList from './pages/Homework/HomeworkList';
import TuitionList from './pages/Tuition/TuitionList';
import ReportsPage from './pages/Reports/ReportsPage';
import ScoresPage from './pages/Scores/ScoresPage';
import SettingsPage from './pages/Settings/SettingsPage';
import ParentSettings from './pages/Settings/ParentSettings';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route element={<ProtectedRoute allowedRoles={['TUTOR']} />}>
            <Route element={<Layout />}>
              <Route path="/tutor/dashboard" element={<TutorDashboard />} />
              <Route path="/tutor/parents" element={<ParentsList />} />
              <Route path="/tutor/students" element={<StudentsList />} />
              <Route path="/tutor/schedule" element={<SchedulesList />} />
              <Route path="/tutor/homework" element={<HomeworkList />} />
              <Route path="/tutor/scores" element={<ScoresPage />} />
              <Route path="/tutor/tuition" element={<TuitionList />} />
              <Route path="/tutor/reports" element={<ReportsPage />} />
              <Route path="/tutor/settings" element={<SettingsPage />} />
              <Route path="/tutor/*" element={<Navigate to="/tutor/dashboard" replace />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['PARENT']} />}>
            <Route element={<Layout />}>
              <Route path="/parent/dashboard" element={<ParentDashboard />} />
              <Route path="/parent/students" element={<StudentsList />} />
              <Route path="/parent/schedule" element={<SchedulesList />} />
              <Route path="/parent/homework" element={<HomeworkList />} />
              <Route path="/parent/scores" element={<ScoresPage />} />
              <Route path="/parent/tuition" element={<TuitionList />} />
              <Route path="/parent/reports" element={<ReportsPage />} />
              <Route path="/parent/settings" element={<ParentSettings />} />
              <Route path="/parent/*" element={<Navigate to="/parent/dashboard" replace />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
