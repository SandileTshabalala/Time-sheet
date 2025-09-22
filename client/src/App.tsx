import { Routes, Route } from 'react-router-dom'; 
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAnalytics from './pages/admin/Analytics';
import AdminUserForm from './components/admin/UserForm';
import AdminRoute from './components/admin/AdminRoute';
import ProtectedRoute from './components/common/ProtectedRoute';
import EmployeePage from './pages/employee/routes/Employee';
import ManagerPage from './pages/manager/routes/Manager';
import HRadmin from './pages/HRadmin/hradmin';
import SystemSettings from './pages/admin/SystemSettings';
import MainLayout from './components/layout/MainLayout';
import ReportsPage from './pages/reports/routes/Reports';
import Logout from './pages/Logout';
import ReassignApprovals from './pages/admin/ReassignApprovals';
import ChangePassword from './pages/ChangePassword';
import SignalRListener from './components/common/SignalRListener';
import EscalationPanel from './components/alerts/EscalationPanel';
import EscalationDashboard from './components/alerts/EscalationDashboard';
import UsersList from './components/admin/UsersList';
import { NotificationsProvider } from './context/NotificationsContext';
import IntegrationsPage from './pages/admin/Integrations';
 
function App() {
  return (
    <NotificationsProvider>
      <ToastContainer position="top-right" newestOnTop closeOnClick pauseOnHover theme="colored" />
      <SignalRListener />
      <EscalationPanel />
      {/* <UserDebug /> */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/logout" element={<Logout />} />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminRoute>
              <MainLayout>
                <AdminAnalytics />
              </MainLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reassign-approvals"
          element={
            <AdminRoute>
              <MainLayout>
                <ReassignApprovals />
              </MainLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/integrations"
          element={
            <AdminRoute>
              <MainLayout>
                <IntegrationsPage />
              </MainLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/system-settings"
          element={
            <AdminRoute>
              <MainLayout>
                <SystemSettings />
              </MainLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <MainLayout>
                <UsersList />
              </MainLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/alerts"
          element={
            <AdminRoute>
              <MainLayout>
                <EscalationDashboard />
              </MainLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/hradmin/alerts"
          element={
            <ProtectedRoute roles={["HRAdmin","SystemAdmin"]}>
              <MainLayout>
                <EscalationDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/new"
          element={
            <AdminRoute>
              <MainLayout>
                <AdminUserForm />
              </MainLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users/:id/edit"
          element={
            <AdminRoute>
              <MainLayout>
                <AdminUserForm isEdit />
              </MainLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/employee/*"
          element={
            <ProtectedRoute roles={["Employee","Manager","HRAdmin","SystemAdmin"]}>
              <MainLayout>
                <EmployeePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/*"
          element={
            <ProtectedRoute roles={["Manager","SystemAdmin","HRAdmin"]}>
              <MainLayout>
                <ManagerPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hradmin/*"
          element={
            <ProtectedRoute roles={["HRAdmin","SystemAdmin"]}>
              <MainLayout>
                <HRadmin />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/*"
          element={
            <ProtectedRoute roles={["Manager","HRAdmin","SystemAdmin"]}>
              <MainLayout>
                <ReportsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </NotificationsProvider>
  );
}

export default App;
