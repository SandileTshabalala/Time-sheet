import { useNavigate } from 'react-router-dom';
import UsersList from '../../components/admin/UsersList';
import authService from '../../services/auth.service';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin {user ? `(${user.firstName} ${user.lastName})` : ''}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/reassign-approvals')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Reassign Approvals
          </button>
          <button
            onClick={() => { authService.logout(); navigate('/login'); }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded border"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <UsersList />
      </div>
    </div>
  );
};

export default Dashboard;