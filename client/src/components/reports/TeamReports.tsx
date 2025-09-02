import React, { useMemo, useState } from 'react';
import timesheetService from '../../services/timesheet.service';
import { useQuery } from '@tanstack/react-query';
import reportsService from '../../services/reports.service';

const fmt = (d: Date) => d.toISOString().slice(0,10);

const TeamReports: React.FC = () => {
  const [startDate, setStartDate] = useState(() => fmt(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [endDate, setEndDate] = useState(() => fmt(new Date()));

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['team-report', startDate, endDate],
    queryFn: () => timesheetService.getTeamReport(startDate, endDate),
  });

  const totals = useMemo(() => {
    const totalHours = (data || []).reduce((s, r) => s + r.totalHours, 0);
    const overtime = (data || []).reduce((s, r) => s + r.totalOvertimeHours, 0);
    const days = (data || []).reduce((s, r) => s + r.totalDays, 0);
    return { totalHours, overtime, days };
  }, [data]);
  

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-serif font-bold text-foreground">Team Reports</h1>
        <p className="text-muted-foreground mt-1">View and export team timesheet data</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex gap-3">
              <div className="space-y-1">
                <label htmlFor="start-date" className="text-sm font-medium text-foreground block">
                  Start Date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="end-date" className="text-sm font-medium text-foreground block">
                  End Date
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                />
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors font-medium mt-6 sm:mt-0"
            >
              Run Report
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => reportsService.exportTeamReport(startDate, endDate, "excel")}
              title="Download Excel (.xlsx)"
              className="px-4 py-2 border border-input rounded-md bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors font-medium"
            >
              Export Excel
            </button>
            <button
              onClick={() => reportsService.exportTeamReport(startDate, endDate, "pdf")}
              title="Download PDF (.pdf)"
              className="px-4 py-2 border border-input rounded-md bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors font-medium"
            >
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading report data...</span>
        </div>
      )}

      {isError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive font-medium">Error loading report</p>
          <p className="text-destructive/80 text-sm mt-1">Please try again or contact support if the issue persists.</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-bold text-foreground">{totals.totalHours.toFixed(2)}</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overtime Hours</p>
                  <p className="text-2xl font-bold text-foreground">{totals.overtime.toFixed(2)}</p>
                </div>
                <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Days</p>
                  <p className="text-2xl font-bold text-foreground">{totals.days}</p>
                </div>
                <div className="h-12 w-12 bg-muted/50 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Employee Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-foreground border-b border-border">
                      Employee
                    </th>
                    <th className="text-right py-3 px-6 font-semibold text-foreground border-b border-border">Hours</th>
                    <th className="text-right py-3 px-6 font-semibold text-foreground border-b border-border">
                      Overtime
                    </th>
                    <th className="text-right py-3 px-6 font-semibold text-foreground border-b border-border">Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((r) => (
                    <tr key={r.employeeId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-6 text-foreground font-medium">{r.employeeName}</td>
                      <td className="py-4 px-6 text-right text-foreground tabular-nums">{r.totalHours.toFixed(2)}</td>
                      <td className="py-4 px-6 text-right text-foreground tabular-nums">
                        {r.totalOvertimeHours.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right text-foreground tabular-nums">{r.totalDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamReports