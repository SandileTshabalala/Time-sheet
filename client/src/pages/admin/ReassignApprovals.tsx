import React, { useEffect, useMemo, useState } from 'react';
import adminService, { type UserDto } from '../../services/admin.service';
import { toast } from 'react-toastify';
import NavBar from '@/components/layout/NavBar';

interface PendingItem {
  id: number;
  date: string;
  employeeId: string;
  employeeName: string;
  projectName?: string;
  hoursWorked: number;
  status: number;
}
 
const ReassignApprovals: React.FC = () => {
  const [managers, setManagers] = useState<UserDto[]>([]);
  const [fromManagerId, setFromManagerId] = useState('');
  const [toApproverId, setToApproverId] = useState('');
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const approvers = await adminService.getEligibleApprovers();
        // Prefer Managers for FROM dropdown, but allow HR admins too
        setManagers(approvers);
      } catch (e: any) {
        toast.error(e?.response?.data || 'Failed to load approvers');
      }
    })();
  }, []);

  const selectedCount = selectedIds.size;

  const loadPending = async (userId: string) => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await adminService.getPendingApprovals(userId);
      setPending(data.items as any);
      setSelectedIds(new Set());
      setSelectAll(false);
    } catch (e: any) {
      toast.error(e?.response?.data || 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const onToggleAll = () => {
    const next = !selectAll;
    setSelectAll(next);
    setSelectedIds(next ? new Set(pending.map(p => p.id)) : new Set());
  };

  const onToggleOne = (id: number) => {
    setSelectedIds(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id); else copy.add(id);
      return copy;
    });
  };

  const handleReassign = async (mode: 'all' | 'selected') => {
    if (!fromManagerId || !toApproverId) {
      toast.warn('Select both the source and destination approver');
      return;
    }
    if (fromManagerId === toApproverId) {
      toast.warn('Source and destination must be different');
      return;
    }
    try {
      setLoading(true);
      const payload: any = { fromUserId: fromManagerId, toUserId: toApproverId };
      if (mode === 'selected') payload.timesheetIds = Array.from(selectedIds);
      const res = await adminService.reassignApprovals(payload);
      toast.success(`Reassigned ${res.updated} item(s)`);
      await loadPending(fromManagerId);
    } catch (e: any) {
      toast.error(e?.response?.data || 'Failed to reassign approvals');
    } finally {
      setLoading(false);
    }
  };

  const countText = useMemo(() => {
    return pending.length === 1 ? '1 pending timesheet' : `${pending.length} pending timesheets`;
  }, [pending.length]);

  const fmtDate = (s: string) => new Date(s).toLocaleDateString();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col gap-4">
        <NavBar />
        <h1 className="text-xl font-semibold">Reassign Pending Approvals</h1>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">From (leaving/locked) Manager/HR</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={fromManagerId}
              onChange={e => { setFromManagerId(e.target.value); loadPending(e.target.value); }}
            >
              <option value="">Select user…</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName} ({m.roles.join(', ')})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">To (new approver)</label>
            <select className="w-full border rounded px-3 py-2" value={toApproverId} onChange={e => setToApproverId(e.target.value)}>
              <option value="">Select user…</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName} ({m.roles.join(', ')})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => handleReassign('all')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={!fromManagerId || !toApproverId || loading || pending.length === 0}
            >
              Reassign All
            </button>
            <button
              onClick={() => handleReassign('selected')}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50"
              disabled={!fromManagerId || !toApproverId || loading || selectedCount === 0}
            >
              Reassign Selected ({selectedCount})
            </button>
          </div>
        </div>

        {/* Banner */}
        {fromManagerId && (
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 rounded px-4 py-3 flex items-center justify-between">
            <div>
              This user has <b>{countText}</b> awaiting approval.
            </div>
            {pending.length > 0 && (
              <div className="text-sm text-indigo-700">Select a new approver and choose bulk or per-item reassignment.</div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading…</div>
          ) : pending.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No pending approvals</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2"><input type="checkbox" checked={selectAll} onChange={onToggleAll} /></th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Employee</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Project</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Hours</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pending.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => onToggleOne(item.id)} />
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.employeeName}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{fmtDate(item.date)}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.projectName || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.hoursWorked}h</td>
                    <td className="px-4 py-2 text-sm">
                      <button
                        onClick={() => handleReassign('selected')}
                        className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                        disabled={!toApproverId}
                        title="Reassign selected to chosen approver"
                      >
                        Reassign Selected
                      </button>
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

export default ReassignApprovals;
