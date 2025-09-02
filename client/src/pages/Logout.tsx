import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    authService.logout();
    navigate('/login', { replace: true });
  }, [navigate]);

  return <div>Signing out...</div>;
}
