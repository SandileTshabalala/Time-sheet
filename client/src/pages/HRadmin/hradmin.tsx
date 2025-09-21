import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TimesheetApprovals from '../../components/manager/TimesheetApprovals';
import HRAnalytics from './Analytics';
import EscalationDashboard from '../../components/alerts/EscalationDashboard';

const HRadmin: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HRAnalytics />} />
        <Route path="/analytics" element={<HRAnalytics />} />
        <Route path="/approvals" element={<TimesheetApprovals />} />
        <Route path="/alerts" element={<EscalationDashboard />} />
        <Route path="*" element={<Navigate to="/hradmin" replace />} />
      </Routes>
    </div>
  );
};

export default HRadmin;