import React, { createContext, useContext, useMemo, useState } from 'react';

export type AppNotification = {
  id: string;
  type:
    | 'TimesheetCreated'
    | 'TimesheetUpdated'
    | 'TimesheetSubmitted'
    | 'TimesheetApproved'
    | 'TimesheetRejected'
    | 'TimesheetDeleted'
    | 'TimesheetEscalation'
    | 'TimesheetManagerApproved';
  title: string;
  message?: string;
  createdAt: string; // ISO
  read?: boolean;
  payload?: any;
};

export type NotificationsContextType = {
  items: AppNotification[];
  unreadCount: number;
  add: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markAllRead: () => void;
  clear: () => void;
  markAsRead: (id: string) => void;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<AppNotification[]>([]);

  const add: NotificationsContextType['add'] = (n) => {
    setItems((prev) => [
      { id: crypto.randomUUID(), createdAt: new Date().toISOString(), read: false, ...n },
      ...prev,
    ].slice(0, 50)); // keep last 50
  };

  const markAllRead = () => setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  const clear = () => setItems([]);
  const markAsRead = (id: string) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, read: true } : i));

  const value = useMemo<NotificationsContextType>(() => ({
    items,
    unreadCount: items.filter((i) => !i.read).length,
    add,
    markAllRead,
    clear,
    markAsRead,
  }), [items]);

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
