import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import timesheetService, { type TimesheetDto, TimesheetStatus } from '../../services/timesheet.service';

const TimesheetList: React.FC = () => {
  const [timesheets, setTimesheets] = useState<TimesheetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadTimesheets();
  }, []);

  const loadTimesheets = async () => {
    try {
      setLoading(true);
      const data = await timesheetService.getMyTimesheets(
        startDate || undefined, 
        endDate || undefined
      );
      setTimesheets(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load timesheets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTimesheet = async (id: number) => {
    try {
      await timesheetService.submitTimesheet(id);
      await loadTimesheets(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit timesheet');
    }
  };

  const handleDeleteTimesheet = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this timesheet?')) {
      return;
    }

    try {
      await timesheetService.deleteTimesheet(id);
      await loadTimesheets(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete timesheet');
    }
  };

  const handleFilterChange = () => {
    loadTimesheets();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTotalHours = (timesheet: TimesheetDto) => {
    return timesheet.hoursWorked + (timesheet.overtimeHours || 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">My Timesheets</h2>
            <Link
              to="/employee/timesheets/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create New Timesheet
            </Link>
          </div>

          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleFilterChange}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Filter
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          {timesheets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No timesheets found</p>
              <Link
                to="/employee/timesheets/new"
                className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Create Your First Timesheet
              </Link>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overtime
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timesheets.map((timesheet) => (
                  <tr key={timesheet.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(timesheet.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {timesheet.projectName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {timesheet.hoursWorked}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {timesheet.overtimeHours || 0}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${timesheetService.getStatusColor(timesheet.status)}`}>
                        {timesheetService.getStatusText(timesheet.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        to={`/employee/timesheets/${timesheet.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                      
                      {(timesheet.status === TimesheetStatus.Draft || timesheet.status === TimesheetStatus.Rejected) && (
                        <>
                          <Link
                            to={`/employee/timesheets/${timesheet.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleSubmitTimesheet(timesheet.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Submit
                          </button>
                        </>
                      )}

                      {timesheet.status === TimesheetStatus.Draft && (
                        <button
                          onClick={() => handleDeleteTimesheet(timesheet.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}

                      {timesheet.status === TimesheetStatus.Rejected && timesheet.rejectionReason && (
                        <span 
                          className="text-yellow-600 hover:text-yellow-900 cursor-help"
                          title={timesheet.rejectionReason}
                        >
                          Reason
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary */}
        {timesheets.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Total Timesheets: </span>
                <span className="text-gray-900">{timesheets.length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Total Hours: </span>
                <span className="text-gray-900">
                  {timesheets.reduce((sum, t) => sum + getTotalHours(t), 0)}h
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Approved: </span>
                <span className="text-green-600">
                  {timesheets.filter(t => t.status === TimesheetStatus.Approved).length}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Pending: </span>
                <span className="text-blue-600">
                  {timesheets.filter(t => t.status === TimesheetStatus.Submitted).length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimesheetList;
