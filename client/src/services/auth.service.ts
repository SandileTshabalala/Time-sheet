import api from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
  mustChangePassword?: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  async login(loginData: LoginData) {
    const response = await api.post('/auth/login', loginData);
    console.log("Login response:", response.data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken); // ✅ store refresh token
      localStorage.setItem('user', JSON.stringify(response.data.user));  // includes mustChangePassword if provided
    }

    return response.data;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.roles.includes(role) : false;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const res = await api.post('/auth/change-password', { currentPassword, newPassword });
    // On success, back end clears MustChangePassword. Update local user cache accordingly.
    const user = this.getCurrentUser();
    if (user) {
      user.mustChangePassword = false;
      localStorage.setItem('user', JSON.stringify(user));
    }
    return res.data;
  }
}

export default new AuthService();