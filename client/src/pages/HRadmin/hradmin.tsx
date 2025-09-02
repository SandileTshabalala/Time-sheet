import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TimesheetApprovals from '../../components/manager/TimesheetApprovals';

const HRadmin: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<TimesheetApprovals />} />
        <Route path="/approvals" element={<TimesheetApprovals />} />
        <Route path="*" element={<Navigate to="/hradmin" replace />} />
      </Routes>
    </div>
  );
};

export default HRadmin;