import React, { useState } from 'react';
import timesheetService from '../../services/timesheet.service';
import { useQuery } from '@tanstack/react-query';
import authService from '../../services/auth.service';
import reportsService from '../../services/reports.service';

const fmt = (d: Date) => d.toISOString().slice(0,10);

const MyReport: React.FC = () => {
  const me = authService.getCurrentUser();
  const [startDate, setStartDate] = useState(() => fmt(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [endDate, setEndDate] = useState(() => fmt(new Date()));

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-report', me?.id, startDate, endDate],
    queryFn: () => timesheetService.getEmployeeReport(me?.id || '', startDate, endDate),
    enabled: !!me?.id,
  });

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>My Report</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        <button onClick={() => refetch()}>Run</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={() => me?.id && reportsService.exportEmployeeReport(me.id, startDate, endDate, 'excel')}
            title="Download Excel (.xlsx)"
          >
            Export Excel
          </button>
          <button
            onClick={() => me?.id && reportsService.exportEmployeeReport(me.id, startDate, endDate, 'pdf')}
            title="Download PDF (.pdf)"
          >
            Export PDF
          </button>
        </div>
      </div>

      {isLoading && <div>Loading...</div>}
      {isError && <div>Error loading report</div>}

      {data && (
        <>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div>Total Hours: <b>{data.totalHours.toFixed(2)}</b></div>
            <div>Overtime: <b>{data.totalOvertimeHours.toFixed(2)}</b></div>
            <div>Total Days: <b>{data.totalDays}</b></div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Project</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Task</th>
                  <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #eee' }}>Hours</th>
                  <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #eee' }}>Overtime</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.timesheets.map(t => (
                  <tr key={t.id}>
                    <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{new Date(t.date).toLocaleDateString()}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{t.projectName || '-'}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{t.taskDescription || '-'}</td>
                    <td style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{t.hoursWorked.toFixed(2)}</td>
                    <td style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{(t.overtimeHours || 0).toFixed(2)}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default MyReport;
