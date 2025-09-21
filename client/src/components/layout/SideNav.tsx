import React from 'react';
import { NavLink } from 'react-router-dom';
import authService from '../../services/auth.service';

const linkStyle: React.CSSProperties = {
  display: 'block',
  padding: '10px 14px',
  color: '#374151',
  textDecoration: 'none',
  borderRadius: 8,
};

const activeStyle: React.CSSProperties = {
  background: '#e5e7eb',
  fontWeight: 600,
};

const SideNav: React.FC = () => {
  const can = (roles: string[]) => roles.some(r => authService.hasRole(r));

  return (
    <aside style={{ width: 240, background: '#fff', borderRight: '1px solid #e5e7eb', padding: 16 }}>
      <nav style={{ display: 'grid', gap: 6 }}>
        {can(['Employee','Manager']) && (
          <NavLink to="/employee" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>My Timesheets</NavLink>
        )}
        {can(['Employee','Manager']) && (
          <NavLink to="/employee/leaves" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>My Leaves</NavLink>
        )}
        {can(['Manager']) && (
          <NavLink to="/manager" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>Timesheet Approvals</NavLink>
        )}
        {can(['Manager']) && (
          <NavLink to="/manager/leave-approvals" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>Leave Approvals</NavLink>
        )}
        {can(['Manager']) && (
          <NavLink to="/manager/team-calendar" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>Team Leave Calendar</NavLink>
        )}
        {can(['Manager']) && (
          <NavLink to="/reports" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>Reports</NavLink>
        )}
        
        {/* HR Admin Section */}
        {can(['HRAdmin']) && !can(['SystemAdmin']) && (
          <div style={{ margin: '8px 0', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>HR ADMIN</div>
        )}
        {can(['HRAdmin']) && !can(['SystemAdmin']) && (
          <NavLink to="/hradmin" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>📊 Analytics</NavLink>
        )}
        {can(['HRAdmin']) && !can(['SystemAdmin']) && (
          <NavLink to="/employee" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>📋 My Timesheets</NavLink>
        )}
        {can(['HRAdmin']) && !can(['SystemAdmin']) && (
          <NavLink to="/employee/leaves" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>🏖️ My Leaves</NavLink>
        )}
        {can(['HRAdmin']) && !can(['SystemAdmin']) && (
          <NavLink to="/manager" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>✅ Timesheet Approvals</NavLink>
        )}
        {can(['HRAdmin']) && !can(['SystemAdmin']) && (
          <NavLink to="/manager/leave-approvals" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>📏 Leave Approvals</NavLink>
        )}
        {can(['HRAdmin']) && !can(['SystemAdmin']) && (
          <NavLink to="/manager/team-calendar" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>📅 Team Leave Calendar</NavLink>
        )}
        {can(['HRAdmin']) && !can(['SystemAdmin']) && (
          <NavLink to="/reports" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>📊 Reports</NavLink>
        )}
        {can(['HRAdmin']) && !can(['SystemAdmin']) && (
          <NavLink to="/hradmin/alerts" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>🚨 Alerts & Escalations</NavLink>
        )}
        
        {/* System Admin Section */}
        {can(['SystemAdmin']) && (
          <div style={{ margin: '8px 0', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>SYSTEM ADMIN</div>
        )}
        {can(['SystemAdmin']) && (
          <NavLink to="/admin" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>📊 Dashboard</NavLink>
        )}
        {can(['SystemAdmin']) && (
          <NavLink to="/admin/analytics" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>📊 Analytics</NavLink>
        )}
        {can(['SystemAdmin']) && (
          <NavLink to="/admin/users" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>👥 User Management</NavLink>
        )}
        {can(['SystemAdmin']) && (
          <NavLink to="/admin/users/new" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>➕ Create User</NavLink>
        )}
        {can(['SystemAdmin']) && (
          <NavLink to="/admin/alerts" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>🚨 Alerts Dashboard</NavLink>
        )}
        {can(['SystemAdmin']) && (
          <NavLink to="/admin/reassign-approvals" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>🔄 Role Management</NavLink>
        )}
        {can(['SystemAdmin']) && (
          <NavLink to="/reports" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>📊 Reports</NavLink>
        )}
        {can(['SystemAdmin']) && (
          <NavLink to="/admin/system-settings" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>⚙️ System Settings</NavLink>
        )}
        {can(['SystemAdmin']) && (
          <NavLink to="/admin/integrations" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>🔗 Integrations</NavLink>
        )}
      </nav>
    </aside>
  );
};

export default SideNav;
