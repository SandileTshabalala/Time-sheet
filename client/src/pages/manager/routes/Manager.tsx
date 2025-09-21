import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TimesheetApprovals from '../../../components/manager/TimesheetApprovals';
import ManagerLeaveApprovals from '../../../components/leave/ManagerLeaveApprovals';
import TeamLeaveCalendar from '../../../components/leave/TeamLeaveCalendar';

const ManagerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<TimesheetApprovals />} />
        <Route path="/approvals" element={<TimesheetApprovals />} />
        <Route path="/leave-approvals" element={<ManagerLeaveApprovals />} />
        <Route path="/team-calendar" element={<TeamLeaveCalendar />} />
        <Route path="*" element={<Navigate to="/manager" replace />} />
      </Routes>
    </div>
  );
};

export default ManagerPage;
