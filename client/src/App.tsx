import { Routes, Route } from 'react-router-dom'; 
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUserForm from './components/admin/UserForm';
import AdminRoute from './components/admin/AdminRoute';
import ProtectedRoute from './components/common/ProtectedRoute';
import EmployeePage from './pages/employee/routes/Employee';
import ManagerPage from './pages/manager/routes/Manager';
import HRadmin from './pages/HRadmin/hradmin';
import MainLayout from './components/layout/MainLayout';
import ReportsPage from './pages/reports/routes/Reports';
import Logout from './pages/Logout';
import ReassignApprovals from './pages/admin/ReassignApprovals';
import ChangePassword from './pages/ChangePassword';
import SignalRListener from './components/common/SignalRListener';
import { NotificationsProvider } from './context/NotificationsContext';
 
function App() {
  return (
    <NotificationsProvider>
      <ToastContainer position="top-right" newestOnTop closeOnClick pauseOnHover theme="colored" />
      <SignalRListener />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
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
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reassign-approvals"
          element={
            <AdminRoute>
              <ReassignApprovals />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users/new"
          element={
            <AdminRoute>
              <AdminUserForm />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users/:id/edit"
          element={
            <AdminRoute>
              <AdminUserForm isEdit />
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
