import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EmployeeDashboard from '../../../components/employee/EmployeeDashboard';
import TimesheetList from '../../../components/employee/TimesheetList';
import TimesheetForm from '../../../components/employee/TimesheetForm';

const EmployeePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<EmployeeDashboard />} />
        <Route path="/timesheets" element={<TimesheetList />} />
        <Route path="/timesheets/new" element={<TimesheetForm />} />
        <Route path="/timesheets/:id" element={<TimesheetForm isEdit={false} />} />
        <Route path="/timesheets/:id/edit" element={<TimesheetForm isEdit={true} />} />
        <Route path="*" element={<Navigate to="/employee" replace />} />
      </Routes>
    </div>
  );
};

export default EmployeePage;
