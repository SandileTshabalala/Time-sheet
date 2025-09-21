import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, User, Calendar, Download, Search, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import timesheetService from '../../services/timesheet.service';
import reportsService from '../../services/reports.service';
import authService from '../../services/auth.service';

interface EscalationItem {
  timesheetId: number;
  employeeId: string;
  employeeName: string;
  submittedDate: string;
  daysPending: number;
  hoursWorked: number;
  projectName?: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  employeeId?: string;
  status?: string;
  priority?: string;
}

const EscalationDashboard: React.FC = () => {
  const user = authService.getCurrentUser();
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEscalations, setSelectedEscalations] = useState<number[]>([]);

  // Fetch pending escalations
  const { data: escalations = [], isLoading: escalationsLoading, refetch: refetchEscalations } = useQuery<EscalationItem[]>({
    queryKey: ['escalations', filters],
    queryFn: async () => {
      try {
        const response = await timesheetService.getPendingApprovals();
        const now = new Date();
        
        return (Array.isArray(response) ? response : [])
          .filter((timesheet: any) => {
            const submittedDate = new Date(timesheet?.createdDate || now);
            const daysPending = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));
            return daysPending >= 7;
          })
          .map((timesheet: any) => {
            const submittedDate = new Date(timesheet?.createdDate || now);
            const daysPending = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));

            let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
            if (daysPending >= 14) priority = 'critical';
            else if (daysPending >= 10) priority = 'high';
            else if (daysPending >= 7) priority = 'medium';

            return {
              timesheetId: timesheet?.id,
              employeeId: timesheet?.employeeId || '',
              employeeName: timesheet?.employeeName || 'Unknown Employee',
              submittedDate: timesheet?.createdDate || now.toISOString(),
              daysPending,
              hoursWorked: timesheet?.hoursWorked || 0,
              projectName: timesheet?.projectName || 'N/A',
              status: timesheet?.status || 'Pending',
              priority
            };
          });
      } catch (error) {
        console.error('Error fetching escalations:', error);
        toast.error('Failed to load escalations');
        return [];
      }
    },
    refetchInterval: 30000,
    enabled: !!user
  });

  // Filter escalations
  const filteredEscalations = useMemo(() => {
    if (!escalations) return [];
    return escalations.filter((escalation) => {
      const matchesSearch = !searchTerm || 
        escalation.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        escalation.projectName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEmployee = !filters.employeeId || escalation.employeeId === filters.employeeId;
      
      return matchesSearch && matchesEmployee;
    });
  }, [escalations, searchTerm, filters]);

  const dashboardStats = useMemo(() => {
    if (!filteredEscalations) return null;
    const total = filteredEscalations.length;
    const criticalEscalations = filteredEscalations.filter(e => e.priority === 'critical').length;
    const avgDaysPending = filteredEscalations.length > 0 
      ? Math.round(filteredEscalations.reduce((sum, e) => sum + e.daysPending, 0) / filteredEscalations.length)
      : 0;
    return { total, criticalEscalations, avgDaysPending };
  }, [filteredEscalations]);

  const handleBulkApprove = async () => {
    if (selectedEscalations.length === 0) {
      toast.warning('Please select timesheets to approve');
      return;
    }

    try {
      for (const timesheetId of selectedEscalations) {
        await timesheetService.approveTimesheet(timesheetId, { isApproved: true });
      }
      toast.success(`Approved ${selectedEscalations.length} timesheets`);
      setSelectedEscalations([]);
      refetchEscalations();
    } catch (error) {
      toast.error('Failed to approve timesheets');
    }
  };

  const handleExportEscalations = async () => {
    try {
      await reportsService.exportTeamReport(filters.startDate, filters.endDate, 'excel');
      toast.success('Escalation report exported successfully');
    } catch (error) {
      toast.error('Failed to export escalation report');
    }
  };

  const getEscalationSeverity = (daysPending: number) => {
    if (daysPending >= 14) return { color: 'text-red-600 bg-red-50 border-red-200', label: 'Critical', icon: '🔴' };
    if (daysPending >= 10) return { color: 'text-orange-600 bg-orange-50 border-orange-200', label: 'High', icon: '🟠' };
    return { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', label: 'Medium', icon: '🟡' };
  };

  if (escalationsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Escalation Dashboard</h1>
            <p className="text-gray-600">Loading escalations...</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="h-96 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Escalation Dashboard</h1>
          <p className="text-gray-600">Monitor and manage overdue timesheet approvals</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportEscalations} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={handleBulkApprove} disabled={selectedEscalations.length === 0}>
            Approve Selected ({selectedEscalations.length})
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{dashboardStats?.total || 0}</p>
                <p className="text-sm text-gray-600">Total Escalations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{dashboardStats?.criticalEscalations || 0}</p>
                <p className="text-sm text-gray-600">Critical (14+ days)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{dashboardStats?.avgDaysPending || 0}</p>
                <p className="text-sm text-gray-600">Avg Days Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <User className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(filteredEscalations.map(e => e.employeeId)).size}
                </p>
                <p className="text-sm text-gray-600">Affected Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Employee name or project..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => refetchEscalations()}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Escalations List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Escalated Timesheets</CardTitle>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedEscalations.length === filteredEscalations.length && filteredEscalations.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedEscalations(filteredEscalations.map(e => e.timesheetId));
                  } else {
                    setSelectedEscalations([]);
                  }
                }}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {escalationsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredEscalations.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No escalated timesheets found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEscalations.map((escalation) => {
                const severity = getEscalationSeverity(escalation.daysPending);
                const isSelected = selectedEscalations.includes(escalation.timesheetId);

                return (
                  <div
                    key={escalation.timesheetId}
                    className={`border rounded-lg p-4 ${severity.color} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEscalations(prev => [...prev, escalation.timesheetId]);
                            } else {
                              setSelectedEscalations(prev => prev.filter(id => id !== escalation.timesheetId));
                            }
                          }}
                          className="rounded"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{severity.icon}</span>
                          <div>
                            <p className="font-semibold">{escalation.employeeName}</p>
                            <p className="text-sm opacity-75">
                              Timesheet #{escalation.timesheetId} • {escalation.hoursWorked}h
                              {escalation.projectName && ` • ${escalation.projectName}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${severity.color}`}>
                          {severity.label} - {escalation.daysPending} days
                        </div>
                        <p className="text-xs opacity-75 mt-1">
                          Submitted: {new Date(escalation.submittedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert for critical escalations */}
      {dashboardStats && dashboardStats.criticalEscalations > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>{dashboardStats.criticalEscalations} critical escalations</strong> require immediate attention. 
            These timesheets have been pending for 14+ days.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default EscalationDashboard;
