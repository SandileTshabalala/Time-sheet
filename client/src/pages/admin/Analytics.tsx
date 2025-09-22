import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download, Users, Clock, FileText, RefreshCw, AlertTriangle, BarChart3,Target } from 'lucide-react';
import { toast } from 'react-toastify';
import { Input } from '@/components/ui/input';
import reportsService from '@/services/reports.service';
import adminService from '@/services/admin.service';
import timesheetService from '@/services/timesheet.service';
// import authService from '@/services/auth.service';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTimesheets: number;
  pendingApprovals: number;
  totalHours: number;
  systemUptime: number;
  criticalAlerts: number;
}

interface UserActivity {
  userId: string;
  userName: string;
  lastLogin: string;
  timesheetsThisMonth: number;
  status: 'active' | 'inactive' | 'pending';
  role: string;
}

const AdminAnalytics: React.FC = () => {
  // const user = authService.getCurrentUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Fetch system analytics data
  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-analytics', dateRange],
    queryFn: async () => {
      try {
        const [usersResponse, timesheetsResponse] = await Promise.all([
          adminService.getUsers(),
          timesheetService.getTeamTimesheets({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          })
        ]);

        const users = Array.isArray(usersResponse?.data) ? usersResponse.data : usersResponse.data?.items || [];
        const timesheets = Array.isArray(timesheetsResponse) ? timesheetsResponse : [];

        const systemMetrics: SystemMetrics = {
          totalUsers: users.length,
          activeUsers: users.filter((u: any) => u.isActive).length,
          totalTimesheets: timesheets.length,
          pendingApprovals: timesheets.filter((ts: any) => ts.status === 1).length,
          totalHours: timesheets.reduce((sum: number, ts: any) => sum + (ts.hoursWorked || 0), 0),
          systemUptime: 99.8, // Mock data - in real app would come from monitoring service
          criticalAlerts: timesheets.filter((ts: any) => {
            const submittedDate = new Date(ts.createdDate || ts.date);
            const daysPending = Math.floor((Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));
            return daysPending > 14;
          }).length
        };

        const userActivity: UserActivity[] = users.map((user: any) => ({
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          lastLogin: user.lastLoginDate || 'Never',
          timesheetsThisMonth: timesheets.filter((ts: any) => ts.employeeId === user.id).length,
          status: user.isActive ? 'active' : 'inactive',
          role: user.roles?.join(', ') || 'Employee'
        }));

        return {
          systemMetrics,
          userActivity,
          timesheets,
          users
        };
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        toast.error('Failed to load analytics data');
        throw error;
      }
    },
    refetchInterval: 60000 // Refresh every minute
  });

  const productivityInsights = useMemo(() => {
    if (!analyticsData?.timesheets) return null;

    const timesheets = analyticsData.timesheets;
    const avgHoursPerTimesheet = timesheets.length > 0 
      ? timesheets.reduce((sum: number, ts: any) => sum + (ts.hoursWorked || 0), 0) / timesheets.length 
      : 0;

    const overtimeEntries = timesheets.filter((ts: any) => (ts.hoursWorked || 0) > 8).length;
    const undertimeEntries = timesheets.filter((ts: any) => (ts.hoursWorked || 0) < 6).length;
    
    return {
      avgHoursPerTimesheet: Math.round(avgHoursPerTimesheet * 10) / 10,
      overtimeEntries,
      undertimeEntries,
      productivityScore: Math.max(0, Math.min(100, 
        100 - (overtimeEntries * 2) - (undertimeEntries * 3) + 
        (timesheets.filter((ts: any) => ts.status === 2).length * 0.5)
      ))
    };
  }, [analyticsData]);

  const handleExportAnalytics = async () => {
    try {
      await reportsService.exportTeamReport(dateRange.startDate, dateRange.endDate, 'excel');
      toast.success('Analytics report exported successfully');
    } catch (error) {
      toast.error('Failed to export analytics report');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Analytics</h1>
            <p className="text-gray-600">Loading system insights...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Analytics</h1>
          <p className="text-gray-600">System-wide insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportAnalytics} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                type="date"
                id="startDate"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                type="date"
                id="endDate"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              />
            </div>
            <Button onClick={() => refetch()}>Apply</Button>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.systemMetrics.totalUsers || 0}</p>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-xs text-green-600">{analyticsData?.systemMetrics.activeUsers || 0} active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.systemMetrics.totalTimesheets || 0}</p>
                <p className="text-sm text-gray-600">Total Timesheets</p>
                <p className="text-xs text-orange-600">{analyticsData?.systemMetrics.pendingApprovals || 0} pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.systemMetrics.totalHours || 0}</p>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-xs text-blue-600">This period</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.systemMetrics.criticalAlerts || 0}</p>
                <p className="text-sm text-gray-600">Critical Alerts</p>
                <p className="text-xs text-red-600">14+ days pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Activity</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>System Uptime</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {analyticsData?.systemMetrics.systemUptime || 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Users</span>
                    <span className="font-semibold">
                      {analyticsData?.systemMetrics.activeUsers || 0} / {analyticsData?.systemMetrics.totalUsers || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Approval Rate</span>
                    <span className="font-semibold">
                      {(analyticsData?.systemMetrics.totalTimesheets || 0) > 0 
                        ? Math.round((((analyticsData?.systemMetrics.totalTimesheets || 0) - (analyticsData?.systemMetrics.pendingApprovals || 0)) 
                          / (analyticsData?.systemMetrics.totalTimesheets || 1)) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Key Performance Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Avg Hours/Timesheet</span>
                    <span className="font-semibold">{productivityInsights?.avgHoursPerTimesheet || 0}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Productivity Score</span>
                    <Badge variant={productivityInsights?.productivityScore && productivityInsights.productivityScore > 75 ? "default" : "secondary"}>
                      {Math.round(productivityInsights?.productivityScore || 0)}/100
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Critical Escalations</span>
                    <span className={`font-semibold ${(analyticsData?.systemMetrics.criticalAlerts || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {analyticsData?.systemMetrics.criticalAlerts || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Overview</CardTitle>
              <CardDescription>Recent user engagement and timesheet submission patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData?.userActivity.slice(0, 10).map((user) => (
                  <div key={user.userId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <div>
                        <p className="font-medium">{user.userName}</p>
                        <p className="text-sm text-gray-600">{user.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{user.timesheetsThisMonth} timesheets</p>
                      <p className="text-xs text-gray-500">
                        Last login: {user.lastLogin === 'Never' ? 'Never' : new Date(user.lastLogin).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Overtime Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">{productivityInsights?.overtimeEntries || 0}</p>
                  <p className="text-sm text-gray-600">Overtime entries</p>
                  <p className="text-xs text-gray-500 mt-2">Entries with 8+ hours</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Undertime Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">{productivityInsights?.undertimeEntries || 0}</p>
                  <p className="text-sm text-gray-600">Undertime entries</p>
                  <p className="text-xs text-gray-500 mt-2">Entries with &lt;6 hours</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Productivity Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className={`text-3xl font-bold ${(productivityInsights?.productivityScore || 0) > 75 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {Math.round(productivityInsights?.productivityScore || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Overall score</p>
                  <p className="text-xs text-gray-500 mt-2">Based on compliance & efficiency</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;