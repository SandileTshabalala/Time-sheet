import api from './api';

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
}
 
export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roles: string[];
}

export interface UpdateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
}

export interface RoleDto {
  id: string;
  name: string;
  description: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UsersQueryParams {
  q?: string;
  role?: string;
  status?: 'active' | 'disabled';
  page?: number;
  pageSize?: number;
  sortKey?: 'name'|'email'|'status';
  sortDir?: 'asc'|'desc';
}

class AdminService {
  // Users
  getUsers(params?: UsersQueryParams) {
    return api.get<UserDto[] | PagedResult<UserDto>>('/admin/users', { params });
  }

  getUser(id: string) {
    return api.get<UserDto>(`/admin/users/${id}`);
  }

  createUser(user: CreateUserDto) {
    return api.post('/admin/users', user);
  }

  updateUser(id: string, user: UpdateUserDto) {
    return api.put(`/admin/users/${id}`, user);
  }

  deleteUser(id: string) {
    return api.delete(`/admin/users/${id}`);
  }

  // Roles
  getRoles() {
    return api.get<RoleDto[]>('/admin/roles');
  }

  // Password management
  requestPasswordReset(email: string) {
    return api.post('/admin/users/password/request-reset', { email });
  }

  setPassword(userId: string, newPassword: string, requireChangeOnNextLogin: boolean = true) {
    return api.post<void>(`/admin/users/${userId}/password/set`, { newPassword, requireChangeOnNextLogin });
  }

  forcePasswordChange(userId: string) {
    return api.post(`/admin/users/${userId}/password/force-change`, {});
  }

  // Lock/Unlock
  lockUser(userId: string) {
    return api.post(`/admin/users/${userId}/lock`, {});
  }

  unlockUser(userId: string) {
    return api.post(`/admin/users/${userId}/unlock`, {});
  }

  // Bulk updates
  bulkActivate(userIds: string[]) {
    return api.post('/admin/users/bulk/activate', { userIds });
  }

  bulkDeactivate(userIds: string[]) {
    return api.post('/admin/users/bulk/deactivate', { userIds });
  }

  bulkAssignRole(userIds: string[], role: string) {
    return api.post('/admin/users/bulk/assign-role', { userIds, role });
  }

  bulkRemoveRole(userIds: string[], role: string) {
    return api.post('/admin/users/bulk/remove-role', { userIds, role });
  }

  bulkForcePasswordChange(userIds: string[]) {
    return api.post('/admin/users/bulk/force-password-change', { userIds });
  }

  bulkUnlock(userIds: string[]) {
    return api.post('/admin/users/bulk/unlock', { userIds });
  }

  // Audit logs
  getUserAudit(userId: string) {
    return api.get<{ timestamp: string; actor: string; action: string; details?: string }[]>(`/admin/users/${userId}/audit`);
  }

  // Pending approvals and reassignment
  getPendingApprovals(userId: string) {
    return api.get<{ count: number; items: any[] }>(`/admin/users/${userId}/pending-approvals`).then(r => r.data);
  }

  reassignApprovals(payload: { fromUserId: string; toUserId: string; timesheetIds?: number[] }) {
    return api.post<{ updated: number }>(`/admin/reassign-approvals`, payload).then(r => r.data);
  }

  async getEligibleApprovers(): Promise<UserDto[]> {
    // Fetch Managers and HRAdmins and merge
    const [managersRes, hrRes] = await Promise.all([
      this.getUsers({ role: 'Manager' }),
      this.getUsers({ role: 'HRAdmin' }),
    ]);

    const extract = (res: any): UserDto[] => Array.isArray(res.data?.items) ? res.data.items : (Array.isArray(res.data) ? res.data : res);
    const managers = extract(managersRes as any) as UserDto[];
    const hr = extract(hrRes as any) as UserDto[];
    const map = new Map<string, UserDto>();
    [...managers, ...hr].forEach(u => map.set(u.id, u));
    return Array.from(map.values());
  }
}

export default new AdminService();