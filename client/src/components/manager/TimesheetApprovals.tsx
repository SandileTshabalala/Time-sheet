import React, { useState, useEffect } from 'react';
import timesheetService, { type TimesheetDto, type ApproveTimesheetDto } from '../../services/timesheet.service';

const TimesheetApprovals: React.FC = () => {
  const [timesheets, setTimesheets] = useState<TimesheetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimesheet, setSelectedTimesheet] = useState<TimesheetDto | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState<ApproveTimesheetDto>({
    isApproved: true,
    rejectionReason: ''
  });

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const data = await timesheetService.getPendingApprovals();
      setTimesheets(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = (timesheet: TimesheetDto, isApproved: boolean) => {
    setSelectedTimesheet(timesheet);
    setApprovalData({
      isApproved,
      rejectionReason: ''
    });
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedTimesheet) return;

    try {
      await timesheetService.approveTimesheet(selectedTimesheet.id, approvalData);
      setShowApprovalModal(false);
      setSelectedTimesheet(null);
      await loadPendingApprovals(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process approval');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
          <h2 className="text-2xl font-bold text-gray-900">Pending Timesheet Approvals</h2>
          <p className="text-gray-600 mt-1">Review and approve employee timesheets</p>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          {timesheets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No pending approvals</p>
              <p className="text-gray-400 mt-2">All timesheets have been processed</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
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
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timesheets.map((timesheet) => (
                  <tr key={timesheet.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {timesheet.employeeName}
                      </div>
                    </td>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(timesheet.createdDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleApprovalAction(timesheet, true)}
                        className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprovalAction(timesheet, false)}
                        className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Reject
                      </button>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Pending Approvals: </span>
                <span className="text-gray-900">{timesheets.length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Total Hours: </span>
                <span className="text-gray-900">
                  {timesheets.reduce((sum, t) => sum + getTotalHours(t), 0)}h
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Total Overtime: </span>
                <span className="text-gray-900">
                  {timesheets.reduce((sum, t) => sum + (t.overtimeHours || 0), 0)}h
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedTimesheet && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {approvalData.isApproved ? 'Approve' : 'Reject'} Timesheet
              </h3>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <p><strong>Employee:</strong> {selectedTimesheet.employeeName}</p>
                <p><strong>Date:</strong> {formatDate(selectedTimesheet.date)}</p>
                <p><strong>Hours:</strong> {selectedTimesheet.hoursWorked}h</p>
                <p><strong>Overtime:</strong> {selectedTimesheet.overtimeHours || 0}h</p>
                {selectedTimesheet.projectName && (
                  <p><strong>Project:</strong> {selectedTimesheet.projectName}</p>
                )}
                {selectedTimesheet.taskDescription && (
                  <p><strong>Task:</strong> {selectedTimesheet.taskDescription}</p>
                )}
                {selectedTimesheet.comments && (
                  <p><strong>Comments:</strong> {selectedTimesheet.comments}</p>
                )}
              </div>

              {!approvalData.isApproved && (
                <div className="mb-4">
                  <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    id="rejectionReason"
                    value={approvalData.rejectionReason}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                    rows={3}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Please provide a reason for rejection..."
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedTimesheet(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprovalSubmit}
                  disabled={!approvalData.isApproved && !approvalData.rejectionReason?.trim()}
                  className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 ${
                    approvalData.isApproved 
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
                >
                  {approvalData.isApproved ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimesheetApprovals;
