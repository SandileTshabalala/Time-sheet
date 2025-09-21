import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TimesheetReportsView from '../../../components/reports/TimesheetReportsView';
import TeamReports from '../../../components/reports/TeamReports';
import MyReport from '../../../components/reports/MyReport';

const ReportsPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100%' }}>
      <Routes>
        <Route path="/" element={<TimesheetReportsView />} />
        <Route path="/analytics" element={<TimesheetReportsView />} />
        <Route path="/team" element={<TeamReports />} />
        <Route path="/me" element={<MyReport />} />
        <Route path="*" element={<Navigate to="/reports" replace />} />
      </Routes>
    </div>
  );
};

export default ReportsPage;
