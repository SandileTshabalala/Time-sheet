import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import timesheetService, { TimesheetStatus, type TimesheetDto } from '../../services/timesheet.service';

const EmployeeDashboard: React.FC = () => {
  const [timesheets, setTimesheets] = useState<TimesheetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecentTimesheets();
  }, []);

  const loadRecentTimesheets = async () => {
    try {
      setLoading(true);
      // Get timesheets from the last 30 days
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const data = await timesheetService.getMyTimesheets(startDate, endDate);
      setTimesheets(data);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to load dashboard data';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCounts = () => {
    return {
      draft: timesheets.filter(t => t.status === TimesheetStatus.Draft).length,
      submitted: timesheets.filter(t => t.status === TimesheetStatus.Submitted).length,
      approved: timesheets.filter(t => t.status === TimesheetStatus.Approved).length,
      rejected: timesheets.filter(t => t.status === TimesheetStatus.Rejected).length,
    };
  };

  const getTotalHours = () => {
    return timesheets.reduce((sum, t) => sum + t.hoursWorked + (t.overtimeHours || 0), 0);
  };

  const getRecentTimesheets = () => {
    return timesheets
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();
  const totalHours = getTotalHours();
  const recentTimesheets = getRecentTimesheets();

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Employee Dashboard</h1>
        <p className="text-gray-600 mt-1 text-sm">Welcome back! Here's your timesheet overview.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            to="/employee/timesheets/new"
            className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors transform hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-base font-medium">Create Timesheet</h3>
                <p className="text-blue-100 text-xs">Log your work hours</p>
              </div>
            </div>
          </Link>

          <Link
            to="/employee/timesheets"
            className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors transform hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-base font-medium">View All Timesheets</h3>
                <p className="text-green-100 text-xs">Manage your timesheets</p>
              </div>
            </div>
          </Link>

          <div className="bg-purple-600 text-white p-4 rounded-lg transform hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-base font-medium">Total Hours (30 days)</h3>
                <p className="text-purple-100 text-xs">{totalHours} hours logged</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Timesheet Statistics (Last 30 Days)</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold text-sm">{statusCounts.draft}</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-xs font-medium text-gray-500">Draft</h3>
                <p className="text-xl font-bold text-gray-900">{statusCounts.draft}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">{statusCounts.submitted}</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-xs font-medium text-gray-500">Submitted</h3>
                <p className="text-xl font-bold text-blue-600">{statusCounts.submitted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">{statusCounts.approved}</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-xs font-medium text-gray-500">Approved</h3>
                <p className="text-xl font-bold text-green-600">{statusCounts.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-semibold text-sm">{statusCounts.rejected}</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-xs font-medium text-gray-500">Rejected</h3>
                <p className="text-xl font-bold text-red-600">{statusCounts.rejected}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Timesheets */}
      <div className="bg-white shadow-lg rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Timesheets</h2>
            <Link
              to="/employee/timesheets"
              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              View All →
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          {recentTimesheets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No timesheets found</p>
              <Link
                to="/employee/timesheets/new"
                className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
              >
                Create Your First Timesheet
              </Link>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-4 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-4 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTimesheets.map((timesheet) => (
                  <tr key={timesheet.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-gray-900">
                      {formatDate(timesheet.date)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-900">
                      {timesheet.projectName || '-'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-900">
                      {timesheet.hoursWorked + (timesheet.overtimeHours || 0)}h
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${timesheetService.getStatusColor(timesheet.status)}`}>
                        {timesheetService.getStatusText(timesheet.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs font-medium">
                      <Link
                        to={`/employee/timesheets/${timesheet.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
