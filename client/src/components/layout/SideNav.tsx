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
        {can(['Employee','Manager','HRAdmin','SystemAdmin']) && (
          <NavLink to="/employee" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>My Timesheets</NavLink>
        )}
        {can(['Manager','HRAdmin','SystemAdmin']) && (
          <NavLink to="/manager" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>Approvals</NavLink>
        )}
        {can(['Manager','HRAdmin','SystemAdmin']) && (
          <NavLink to="/reports" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>Reports</NavLink>
        )}
        {can(['HRAdmin','SystemAdmin']) && (
          <NavLink to="/hradmin" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>HR Admin</NavLink>
        )}
        {can(['SystemAdmin']) && (
          <NavLink to="/admin" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>System Admin</NavLink>
        )}
      </nav>
    </aside>
  );
};

export default SideNav;
