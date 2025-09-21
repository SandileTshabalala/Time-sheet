import React, { useEffect, useState } from 'react';
import leaveService, { type LeaveRequestDto, type ApproveLeaveDto } from '../../services/leave.service';

const ManagerLeaveApprovals: React.FC = () => {
  const [items, setItems] = useState<LeaveRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LeaveRequestDto | null>(null);
  const [approveData, setApproveData] = useState<ApproveLeaveDto>({ isApproved: true });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await leaveService.pendingApprovals();
      setItems(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load pending leave approvals');
    } finally { setLoading(false); }
  };

  const openModal = (item: LeaveRequestDto, approve: boolean) => {
    setSelected(item);
    setApproveData({ isApproved: approve, rejectionReason: '' });
  };

  const submit = async () => {
    if (!selected) return;
    try {
      await leaveService.approve(selected.id, approveData);
      setSelected(null);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to process approval');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Pending Leave Approvals</h2>
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 mb-3">{error}</div>}
      {loading ? <div className="py-12 text-center">Loading...</div> : (
        items.length === 0 ? <div className="py-12 text-center text-gray-500">No pending approvals</div> : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Employee</th>
                <th className="px-4 py-2 text-left">Dates</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Days</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-2">{item.employeeName}</td>
                  <td className="px-4 py-2">{new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{item.type}</td>
                  <td className="px-4 py-2">{item.days}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => openModal(item, true)}>Approve</button>
                    <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => openModal(item, false)}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-5 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3">{approveData.isApproved ? 'Approve' : 'Reject'} Leave</h3>
            {!approveData.isApproved && (
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Rejection Reason</label>
                <textarea className="w-full border rounded px-3 py-2" rows={3} value={approveData.rejectionReason || ''}
                  onChange={e => setApproveData({ ...approveData, rejectionReason: e.target.value })} />
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <button className="px-3 py-1" onClick={() => setSelected(null)}>Cancel</button>
              <button disabled={!approveData.isApproved && !(approveData.rejectionReason || '').trim()} className={`px-4 py-2 text-white rounded ${approveData.isApproved ? 'bg-green-600' : 'bg-red-600'}`} onClick={submit}>
                {approveData.isApproved ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerLeaveApprovals;
