import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import leaveService, { type LeaveRequestDto, LeaveStatus } from '../../services/leave.service';

const MyLeaves: React.FC = () => {
  const [items, setItems] = useState<LeaveRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await leaveService.myLeaves();
      setItems(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load leaves');
    } finally { setLoading(false); }
  };

  const statusLabel = (s: number) => {
    switch (s) {
      case LeaveStatus.Draft: return 'Draft';
      case LeaveStatus.Submitted: return 'Submitted';
      case LeaveStatus.ManagerApproved: return 'Manager Approved';
      case LeaveStatus.Approved: return 'Approved';
      case LeaveStatus.Rejected: return 'Rejected';
      default: return 'Unknown';
    }
  };
  const statusClass = (s: number) => {
    switch (s) {
      case LeaveStatus.Submitted: return 'text-blue-600 bg-blue-100';
      case LeaveStatus.ManagerApproved: return 'text-indigo-600 bg-indigo-100';
      case LeaveStatus.Approved: return 'text-green-600 bg-green-100';
      case LeaveStatus.Rejected: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">My Leave Requests</h2>
        <Link to="/employee/leaves/new" className="bg-blue-600 text-white px-4 py-2 rounded">New Request</Link>
      </div>
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 mb-3">{error}</div>}
      {loading ? (
        <div className="py-12 text-center">Loading...</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No leave requests yet</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Dates</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Days</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Reason</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id}>
                <td className="px-4 py-2">{new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}</td>
                <td className="px-4 py-2">{item.type}</td>
                <td className="px-4 py-2">{item.days}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex px-2 py-1 rounded-full ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
                </td>
                <td className="px-4 py-2">{item.reason || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyLeaves;
