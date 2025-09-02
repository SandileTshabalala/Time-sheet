import React from 'react';
import NavBar from './NavBar';
import SideNav from './SideNav';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fb' }}>
      <SideNav />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <main style={{ padding: '20px', flex: 1 }}>{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
