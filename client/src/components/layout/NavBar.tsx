import React, { useEffect, useRef, useState } from 'react';
import authService from '../../services/auth.service';
import { useNotifications } from '../../context/NotificationsContext';
 
const NavBar: React.FC = () => {
  const user = authService.getCurrentUser();
  const { unreadCount, items, markAllRead, clear } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);
 
  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  return (
    <header style={{
      height: 60,
      background: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div style={{ fontWeight: 700, color: '#1f2937' }}>Timesheet</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
        {/* Notifications bell */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
            title="Notifications"
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 18,
              border: '1px solid #e5e7eb',
              background: '#fff',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: '#fff', borderRadius: 9999, padding: '0 6px', fontSize: 10, lineHeight: '16px' }}>
                {unreadCount}
              </span>
            )}
          </button>
          {open && (
            <div style={{ position: 'absolute', right: 0, marginTop: 8, width: 360, maxHeight: 420, overflow: 'auto', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ fontWeight: 600, color: '#111827' }}>Notifications</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { markAllRead(); }} style={{ fontSize: 12, color: '#2563eb' }}>Mark all read</button>
                  <button onClick={() => { clear(); }} style={{ fontSize: 12, color: '#6b7280' }}>Clear</button>
                </div>
              </div>
              <div>
                {items.length === 0 && (
                  <div style={{ padding: 16, color: '#6b7280', fontSize: 14 }}>No notifications</div>
                )}
                {items.map((n) => (
                  <div key={n.id} style={{ display: 'flex', gap: 12, padding: 12, background: n.read ? '#fff' : '#eff6ff', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ width: 8, marginTop: 6 }}>
                      {!n.read && <span style={{ display: 'inline-block', width: 8, height: 8, background: '#3b82f6', borderRadius: 9999 }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{n.title}</div>
                        <div style={{ color: '#6b7280', fontSize: 12 }}>{new Date(n.createdAt).toLocaleTimeString()}</div>
                      </div>
                      {n.message && <div style={{ color: '#374151', fontSize: 13, marginTop: 2 }}>{n.message}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ color: '#374151', fontSize: 14 }}>
          {user ? `${user.firstName || ''} ${user.lastName || ''}` : ''}
        </div>
        <button onClick={handleLogout} style={{
          background: '#2563eb', color: 'white', border: 0, padding: '8px 12px', borderRadius: 8
        }}>Logout</button>
      </div>
    </header>
  );
};

export default NavBar;
