import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  RefreshCw,
  Download,
  FileText,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  PieChart
} from 'lucide-react';
import { toast } from 'react-toastify';
import reportsService from '../../services/reports.service';
import TimesheetService from '../../services/timesheet.service';
import authService from '../../services/auth.service';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

// Chart configuration
const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981', 
  accent: '#f59e0b',
  danger: '#ef4444',
  muted: '#6b7280',
  purple: '#8b5cf6',
  orange: '#f97316'
};

const PIE_COLORS = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.accent, CHART_COLORS.danger, CHART_COLORS.purple, CHART_COLORS.orange];

interface TimesheetAnalytics {
  totalSubmissions: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  draftCount: number;
  totalHours: number;
  averageHoursPerSubmission: number;
  topPerformers: Array<{
    employeeId: string;
    employeeName: string;
    totalHours: number;
    submissionCount: number;
  }>;
  dailyStats: Array<{
    date: string;
    submissions: number;
    totalHours: number;
    averageHours: number;
  }>;
  departmentStats: Array<{
    team: string;
    totalHours: number;
    employeeCount: number;
    averageHours: number;
  }>;
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  employeeId?: string;
  department?: string;
  status?: string;
}

const TimesheetReportsView: React.FC = () => {
  const user = authService.getCurrentUser();
  const isAdmin = user?.roles?.includes('HRAdmin') || user?.roles?.includes('SystemAdmin');
  const [activeTab, setActiveTab] = useState('summary');
  const [filters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    employeeId: '',
    department: '',
    status: ''
  });

  // Fetch raw timesheet data for detailed view
  const { data: rawTimesheets, isLoading: rawTimesheetsLoading } = useQuery({
    queryKey: ['raw-timesheets', filters],
    queryFn: async () => {
      const timesheets = isAdmin 
        ? await TimesheetService.getAnalyticsData(filters)
        : await TimesheetService.getMyTimesheets(filters.startDate, filters.endDate);
      
      // Apply filters and sort
      let filtered = timesheets.filter((ts: any) => {
        const tsDate = new Date(ts.date);
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        
        return tsDate >= startDate && tsDate <= endDate &&
               (!filters.employeeId || ts.employeeId === filters.employeeId) &&
               (!filters.status || ts.status.toString() === filters.status);
      });
      
      // Sort by date descending (most recent first)
      return filtered.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Draft';
      case 1: return 'Submitted';
      case 2: return 'Approved';
      case 3: return 'Rejected';
      case 4: return 'Resubmitted';
      case 5: return 'Manager Approved';
      default: return 'Unknown';
    }
  };

  const getStatusBadgeColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-gray-100 text-gray-800';
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-green-100 text-green-800';
      case 3: return 'bg-red-100 text-red-800';
      case 4: return 'bg-yellow-100 text-yellow-800';
      case 5: return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  
  // Fetch comprehensive timesheet analytics
  const { data: analytics, isLoading: analyticsLoading2, refetch: refetchAnalytics } = useQuery<TimesheetAnalytics>({
    queryKey: ['timesheet-analytics', filters],
    queryFn: async (): Promise<TimesheetAnalytics> => {
      try {
        // Use the enhanced analytics method for better data coverage
        const timesheets = isAdmin 
          ? await TimesheetService.getAnalyticsData(filters)
          : await TimesheetService.getMyTimesheets(filters.startDate, filters.endDate);
        
        // Extract user information from timesheet data instead of calling admin endpoint
        const userMap = new Map<string, any>();
        timesheets.forEach((ts: any) => {
          if (ts.employeeId && ts.employeeName && !userMap.has(ts.employeeId)) {
            const nameParts = ts.employeeName.split(' ');
            userMap.set(ts.employeeId, {
              id: ts.employeeId,
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              roles: ['Employee'] // Default role since we can't access admin data
            });
          }
        });
        
        const users = Array.from(userMap.values());

      // Filter timesheets by date range and other filters (enhanced getAnalyticsData already does some filtering)
      const filteredTimesheets = timesheets.filter((ts: any) => {
        const tsDate = new Date(ts.date);
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        
        return tsDate >= startDate && tsDate <= endDate &&
               (!filters.employeeId || ts.employeeId === filters.employeeId) &&
               (!filters.status || ts.status.toString() === filters.status);
      });

      // Calculate basic metrics
      const totalSubmissions = filteredTimesheets.length;
      const approvedCount = filteredTimesheets.filter((ts: any) => ts.status === 2 || ts.status === 5).length; 
      const rejectedCount = filteredTimesheets.filter((ts: any) => ts.status === 3).length;
      const pendingCount = filteredTimesheets.filter((ts: any) => ts.status === 1 || ts.status === 4).length; 
      const draftCount = filteredTimesheets.filter((ts: any) => ts.status === 0).length;
      const totalHours = filteredTimesheets.reduce((sum: number, ts: any) => sum + ts.hoursWorked, 0);

      // Debug status distribution
      console.log('TimesheetReportsView Status Debug:', {
        totalSubmissions,
        statusBreakdown: {
          draft: draftCount,
          submitted: filteredTimesheets.filter(ts => ts.status === 1).length,
          approved: filteredTimesheets.filter(ts => ts.status === 2).length,
          rejected: rejectedCount,
          resubmitted: filteredTimesheets.filter(ts => ts.status === 4).length,
          managerApproved: filteredTimesheets.filter(ts => ts.status === 5).length
        },
        calculated: { approvedCount, rejectedCount, pendingCount, draftCount }
      });

      // Calculate top performers
      const employeeMap = new Map<string, { totalHours: number; submissionCount: number; name: string }>();
      filteredTimesheets.forEach((ts: any) => {
        const user = users.find((u: any) => u.id === ts.employeeId);
        const key = ts.employeeId;
        
        if (!employeeMap.has(key)) {
          employeeMap.set(key, {
            totalHours: 0,
            submissionCount: 0,
            name: user ? `${user.firstName} ${user.lastName}` : (ts.employeeName || 'Unknown')
          });
        }
        
        const employee = employeeMap.get(key)!;
        employee.totalHours += ts.hoursWorked;
        employee.submissionCount += 1;
      });

      const topPerformers = Array.from(employeeMap.entries())
        .map(([employeeId, data]) => ({
          employeeId,
          employeeName: data.name,
          totalHours: data.totalHours,
          submissionCount: data.submissionCount
        }))
        .sort((a, b) => b.totalHours - a.totalHours)
        .slice(0, 10);

      // Calculate daily statistics
      const dailyMap = new Map<string, { submissions: number; totalHours: number }>();
      filteredTimesheets.forEach((ts: any) => {
        const date = new Date(ts.date).toISOString().split('T')[0];
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { submissions: 0, totalHours: 0 });
        }
        
        const daily = dailyMap.get(date)!;
        daily.submissions += 1;
        daily.totalHours += ts.hoursWorked;
      });

      const dailyStats = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          submissions: data.submissions,
          totalHours: data.totalHours,
          averageHours: data.submissions > 0 ? data.totalHours / data.submissions : 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
        

      // Calculate team statistics based on user roles (since team field doesn't exist)
      const teamMap = new Map<string, { totalHours: number; employeeCount: number; employees: Set<string> }>();
      
      filteredTimesheets.forEach((ts: any) => {
        const user = users.find((u: any) => u.id === ts.employeeId);
        // Use role as team
        const team = user?.roles?.[0] || (ts.team || 'General');
        
        if (!teamMap.has(team)) {
          teamMap.set(team, {
            totalHours: 0,
            employeeCount: 0,
            employees: new Set()
          });
        }
        
        const teamData = teamMap.get(team)!;
        teamData.totalHours += ts.hoursWorked;
        teamData.employees.add(ts.employeeId);
      });

      const teamStats = Array.from(teamMap.entries())
        .map(([team, data]) => ({
          team,
          totalHours: data.totalHours,
          employeeCount: data.employees.size,
          averageHours: data.employees.size > 0 ? data.totalHours / data.employees.size : 0
        }))
        .filter(team => team.totalHours > 0)
        .sort((a, b) => b.totalHours - a.totalHours);

      return {
        totalSubmissions,
        approvedCount,
        rejectedCount,
        pendingCount,
        draftCount,
        totalHours,
        averageHoursPerSubmission: totalSubmissions > 0 ? totalHours / totalSubmissions : 0,
        topPerformers,
        dailyStats,
        departmentStats: teamStats
      };
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        toast.error('Failed to load analytics data. Using limited dataset.');
        
        // Return minimal data structure on error
        return {
          totalSubmissions: 0,
          approvedCount: 0,
          rejectedCount: 0,
          pendingCount: 0,
          draftCount: 0,
          totalHours: 0,
          averageHoursPerSubmission: 0,
          topPerformers: [],
          dailyStats: [],
          departmentStats: []
        };
      }
    }
  });

  const handleExportAnalytics = async (format: 'excel' | 'pdf') => {
    try {
      await reportsService.exportTeamReport(filters.startDate, filters.endDate, format);
      toast.success(`Analytics report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export ${format.toUpperCase()} report`);
    }
  };

  const approvalRate = analytics && analytics.totalSubmissions > 0 
    ? ((analytics.approvedCount / analytics.totalSubmissions) * 100).toFixed(1)
    : '0';

  const rejectionRate = analytics && analytics.totalSubmissions > 0 
    ? ((analytics.rejectedCount / analytics.totalSubmissions) * 100).toFixed(1)
    : '0';

  const performanceMetrics = {
    approvalRate: parseFloat(approvalRate),
    rejectionRate: parseFloat(rejectionRate)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timesheet Analytics</h1>
          <p className="text-gray-600">Comprehensive analysis of timesheet submissions and trends</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => refetchAnalytics()} 
            variant="outline" 
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => handleExportAnalytics('excel')} 
            variant="outline" 
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>  
      </div>

      {/* Key Metrics */}
      {analytics && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="details">Detailed View</TabsTrigger>
          {isAdmin && <TabsTrigger value="teams">Team Stats</TabsTrigger>}
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalSubmissions || 0}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
                  {analytics?.pendingCount || 0} pending • {analytics?.approvedCount || 0} approved
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalHours?.toFixed(1) || '0.0'}</div>
                <p className="text-xs text-muted-foreground">
                  {(analytics?.averageHoursPerSubmission || 0).toFixed(1)} avg per submission • 
                  {analytics?.dailyStats?.[0]?.averageHours?.toFixed(1) || '0.0'} avg daily
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics?.approvalRate.toFixed(1)}%
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                  {performanceMetrics?.rejectionRate.toFixed(1)}% rejection rate
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {isAdmin ? 'Team Performance' : 'Your Performance'}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.topPerformers?.[0]?.employeeName || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.topPerformers?.[0]?.totalHours?.toFixed(1) || '0.0'} hours • 
                  {analytics?.topPerformers?.[0]?.submissionCount || 0} submissions
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Additional summary content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Latest timesheet submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Distribution</CardTitle>
                <CardDescription>Breakdown of timesheet statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center">
                  {/* Placeholder for chart */}
                  <div className="text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-sm text-muted-foreground">Status distribution chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Timesheet Data</CardTitle>
              <CardDescription>Filter and analyze individual timesheet entries</CardDescription>
            </CardHeader>
            <CardContent>
              {rawTimesheetsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : rawTimesheets && rawTimesheets.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">{rawTimesheets.length}</div>
                      <div className="text-sm text-blue-600">Total Records</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">
                        {rawTimesheets.reduce((sum: number, ts: any) => sum + ts.hoursWorked, 0).toFixed(1)}h
                      </div>
                      <div className="text-sm text-green-600">Total Hours</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-700">
                        {Array.from(new Set(rawTimesheets.map((ts: any) => ts.employeeId))).length}
                      </div>
                      <div className="text-sm text-purple-600">Unique Employees</div>
                    </div>
                  </div>

                  {/* Data table */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-900">Date</th>
                            {isAdmin && <th className="px-4 py-3 text-left font-medium text-gray-900">Employee</th>}
                            <th className="px-4 py-3 text-left font-medium text-gray-900">Hours</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-900">Project</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-900">Task</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-900">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-900">Comments</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {rawTimesheets.slice(0, 50).map((timesheet: any, index: number) => (
                            <tr key={timesheet.id || index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-900">
                                {new Date(timesheet.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </td>
                              {isAdmin && (
                                <td className="px-4 py-3 text-gray-900">
                                  <div>
                                    <div className="font-medium">{timesheet.employeeName || 'Unknown'}</div>
                                    {/* timesheet id */}
                                    {/* <div className="text-xs text-gray-500">{timesheet.employeeId}</div> */}
                                  </div>
                                </td>
                              )}
                              <td className="px-4 py-3">
                                <div className="font-semibold text-gray-900">{timesheet.hoursWorked}h</div>
                                {timesheet.overtimeHours > 0 && (
                                  <div className="text-xs text-orange-600">+{timesheet.overtimeHours}h OT</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {timesheet.projectName || '-'}
                              </td>
                              <td className="px-4 py-3 text-gray-700 max-w-[200px]">
                                <div className="truncate" title={timesheet.taskDescription || '-'}>
                                  {timesheet.taskDescription || '-'}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={getStatusBadgeColor(timesheet.status)}>
                                  {getStatusText(timesheet.status)}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-gray-600 max-w-[200px]">
                                <div className="truncate" title={timesheet.comments || '-'}>
                                  {timesheet.comments || '-'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {rawTimesheets.length > 50 && (
                      <div className="bg-gray-50 px-4 py-3 border-t text-center text-sm text-gray-600">
                        Showing first 50 of {rawTimesheets.length} records
                        <Button variant="outline" size="sm" className="ml-2">
                          Load More
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-500">
                    * Data filtered by selected date range ({filters.startDate} to {filters.endDate})
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center border rounded-md bg-muted/50">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No timesheet data found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Try adjusting your date range or submit some timesheets to see data here.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {isAdmin && (
          <TabsContent value="teams">
            <Card>
              <CardHeader>
                <CardTitle>Team Statistics</CardTitle>
                <CardDescription>Performance metrics by team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.departmentStats?.map((team: any) => (
                    <div key={team.team} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{team.team}</h3>
                        <Badge variant="outline">{team.employeeCount} employees</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Hours</p>
                          <p className="font-medium">{team.totalHours.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg/Employee</p>
                          <p className="font-medium">{team.averageHours.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Completion</p>
                          <p className="font-medium">N/A</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        <TabsContent value="trends">
          <div className="space-y-6">
            {/* Performance Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Employee performance over time with trend analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && analytics.topPerformers.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.topPerformers.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="employeeName" 
                          tick={{ fontSize: 11 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={0}
                        />
                        <YAxis 
                          yAxisId="hours"
                          orientation="left"
                          tick={{ fontSize: 12 }}
                          label={{ value: 'Total Hours', angle: -90, position: 'insideLeft' }}
                        />
                        <YAxis 
                          yAxisId="submissions"
                          orientation="right"
                          tick={{ fontSize: 12 }}
                          label={{ value: 'Submissions', angle: 90, position: 'insideRight' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend />
                        <Bar 
                          yAxisId="hours"
                          dataKey="totalHours" 
                          fill={CHART_COLORS.primary} 
                          name="Total Hours"
                          radius={[2, 2, 0, 0]}
                        />
                        <Bar 
                          yAxisId="submissions"
                          dataKey="submissionCount" 
                          fill={CHART_COLORS.secondary} 
                          name="Submissions"
                          radius={[2, 2, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center border rounded-md bg-muted/50">
                    <p className="text-muted-foreground">No performance data available for trends analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Department Distribution Chart */}
            {analytics && analytics.departmentStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Department Hours Distribution</CardTitle>
                  <CardDescription>Work distribution across departments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={analytics.departmentStats.map((team, index) => ({
                              name: team.team,
                              value: team.totalHours,
                              color: PIE_COLORS[index % PIE_COLORS.length]
                            }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value, percent }: any) => `${name}: ${value.toFixed(1)}h (${(percent * 100).toFixed(1)}%)`}
                            labelLine={false}
                          >
                            {analytics.departmentStats.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => [`${value.toFixed(1)} hours`, 'Hours']}
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Bar Chart */}
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.departmentStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="team" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Legend />
                          <Bar dataKey="totalHours" fill={CHART_COLORS.primary} name="Total Hours" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="averageHours" fill={CHART_COLORS.accent} name="Average Hours" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        </Tabs>
      )}

      {/* Status Breakdown */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Status Distribution
              </CardTitle>
              <CardDescription>Breakdown of timesheet statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.totalSubmissions > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Status List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <span>Approved</span>
                      </div>
                      <div className="flex items-center">
                        <Badge className={getStatusColor('approved')}>
                          {analytics.approvedCount}
                        </Badge>
                        <span className="ml-2 text-sm text-gray-600">({approvalRate}%)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <XCircle className="w-5 h-5 text-red-600 mr-2" />
                        <span>Rejected</span>
                      </div>
                      <div className="flex items-center">
                        <Badge className={getStatusColor('rejected')}>
                          {analytics.rejectedCount}
                        </Badge>
                        <span className="ml-2 text-sm text-gray-600">({rejectionRate}%)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                        <span>Pending</span>
                      </div>
                      <div className="flex items-center">
                        <Badge className={getStatusColor('pending')}>
                          {analytics.pendingCount}
                        </Badge>
                        <span className="ml-2 text-sm text-gray-600">
                          ({analytics.totalSubmissions > 0 ? ((analytics.pendingCount / analytics.totalSubmissions) * 100).toFixed(1) : '0'}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-600 mr-2" />
                        <span>Draft</span>
                      </div>
                      <div className="flex items-center">
                        <Badge className={getStatusColor('draft')}>
                          {analytics.draftCount}
                        </Badge>
                        <span className="ml-2 text-sm text-gray-600">
                          ({analytics.totalSubmissions > 0 ? ((analytics.draftCount / analytics.totalSubmissions) * 100).toFixed(1) : '0'}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Pie Chart */}
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: 'Approved', value: analytics.approvedCount, color: CHART_COLORS.secondary },
                            { name: 'Rejected', value: analytics.rejectedCount, color: CHART_COLORS.danger },
                            { name: 'Pending', value: analytics.pendingCount, color: CHART_COLORS.accent },
                            { name: 'Draft', value: analytics.draftCount, color: CHART_COLORS.muted }
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value, percent }: any) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                          labelLine={false}
                        >
                          {[
                            { name: 'Approved', value: analytics.approvedCount, color: CHART_COLORS.secondary },
                            { name: 'Rejected', value: analytics.rejectedCount, color: CHART_COLORS.danger },
                            { name: 'Pending', value: analytics.pendingCount, color: CHART_COLORS.accent },
                            { name: 'Draft', value: analytics.draftCount, color: CHART_COLORS.muted }
                          ].filter(item => item.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => [`${value} submissions`, 'Count']}
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No timesheet data available</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Submit some timesheets to see the status distribution chart.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Team Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading2 ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics?.departmentStats.map((team) => (
                    <div key={team.team} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{team.team}</p>
                        <p className="text-sm text-gray-600">{team.employeeCount} employees</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{team.totalHours.toFixed(1)}h</p>
                        <p className="text-sm text-gray-600">Avg: {team.averageHours.toFixed(1)}h</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Performers */}
      {analytics && analytics.topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Top Performers (by Total Hours)
            </CardTitle>
            <CardDescription>Employees with highest total hours in selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topPerformers.slice(0, 5).map((performer, index) => (
                <div key={performer.employeeId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{performer.employeeName}</p>
                      <p className="text-sm text-gray-600">{performer.submissionCount} submissions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{performer.totalHours.toFixed(1)}h</p>
                    <p className="text-sm text-gray-600">
                      Avg: {performer.submissionCount > 0 ? (performer.totalHours / performer.submissionCount).toFixed(1) : '0'}h/day
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Trends Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Daily Trends
          </CardTitle>
          <CardDescription>Time series analysis of daily submissions and hours</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics && analytics.dailyStats.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.dailyStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    yAxisId="hours"
                    orientation="left"
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis 
                    yAxisId="submissions"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Submissions', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                    formatter={(value, name) => {
                      if (name === 'Total Hours') return [`${value} hours`, name];
                      if (name === 'Submissions') return [`${value} submissions`, name];
                      if (name === 'Average Hours') return [`${value} hrs/submission`, name];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Area 
                    yAxisId="hours"
                    type="monotone" 
                    dataKey="totalHours" 
                    stackId="1" 
                    stroke={CHART_COLORS.primary} 
                    fill={CHART_COLORS.primary}
                    fillOpacity={0.3}
                    name="Total Hours"
                  />
                  <Line 
                    yAxisId="submissions"
                    type="monotone" 
                    dataKey="submissions" 
                    stroke={CHART_COLORS.secondary} 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    name="Submissions"
                  />
                  <Line 
                    yAxisId="hours"
                    type="monotone" 
                    dataKey="averageHours" 
                    stroke={CHART_COLORS.accent} 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3 }}
                    name="Average Hours"
                  />
                </AreaChart>
              </ResponsiveContainer>
              
              {/* Summary stats below chart */}
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-medium text-gray-900">Daily data available for {analytics.dailyStats.length} days</p>
                  <p className="text-gray-600">From {new Date(analytics.dailyStats[0]?.date).toLocaleDateString()} to {new Date(analytics.dailyStats[analytics.dailyStats.length - 1]?.date).toLocaleDateString()}</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">Peak day: {analytics.dailyStats.reduce((max, day) => 
                    day.totalHours > max.totalHours ? day : max, analytics.dailyStats[0]
                  )?.date && new Date(analytics.dailyStats.reduce((max, day) => 
                    day.totalHours > max.totalHours ? day : max, analytics.dailyStats[0]
                  )?.date).toLocaleDateString()}</p>
                  <p className="text-gray-600">{analytics.dailyStats.reduce((max, day) => 
                    day.totalHours > max.totalHours ? day : max, analytics.dailyStats[0]
                  )?.totalHours.toFixed(1)}h total</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">Average daily: {(analytics.dailyStats.reduce((sum, day) => sum + day.totalHours, 0) / analytics.dailyStats.length).toFixed(1)}h</p>
                  <p className="text-gray-600">{(analytics.dailyStats.reduce((sum, day) => sum + day.submissions, 0) / analytics.dailyStats.length).toFixed(1)} submissions/day</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No daily data available for the selected period.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Try selecting a different date range or check if there are any timesheet submissions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimesheetReportsView;