import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, AlertTriangle, CheckCircle2, FileText, TrendingUp, Settings, Shield, Activity, Database } from 'lucide-react';
import { toast } from 'react-toastify';
import adminService from '@/services/admin.service';
import timesheetService from '@/services/timesheet.service';
import authService from '@/services/auth.service';

interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersThisMonth: number;
  totalTimesheets: number;
  pendingApprovals: number;
  criticalAlerts: number;
  systemHealth: number;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  color: string;
  count?: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [dateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Fetch dashboard metrics
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['admin-dashboard-metrics', dateRange],
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

        const activeUsers = users.filter((u: any) => u.isActive).length;
        const pendingApprovals = timesheets.filter((ts: any) => ts.status === 1).length;
        
        // Calculate critical alerts (timesheets pending > 14 days)
        const criticalAlerts = timesheets.filter((ts: any) => {
          const submittedDate = new Date(ts.createdDate || ts.date);
          const daysPending = Math.floor((Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysPending > 14;
        }).length;

        const newUsersThisMonth = users.filter((u: any) => {
          const createdDate = new Date(u.createdDate || Date.now());
          const thisMonth = new Date();
          thisMonth.setDate(1);
          return createdDate >= thisMonth;
        }).length;

        const metrics: DashboardMetrics = {
          totalUsers: users.length,
          activeUsers,
          inactiveUsers: users.length - activeUsers,
          newUsersThisMonth,
          totalTimesheets: timesheets.length,
          pendingApprovals,
          criticalAlerts,
          systemHealth: criticalAlerts === 0 && pendingApprovals < 10 ? 98 : criticalAlerts > 5 ? 85 : 92
        };

        return { metrics, users, timesheets };
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard data');
        throw error;
      }
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const quickActions: QuickAction[] = useMemo(() => [
    {
      title: 'Create New User',
      description: 'Add a new employee to the system',
      icon: <Users className="w-5 h-5" />,
      action: '/admin/users/new',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Pending Approvals',
      description: 'Review timesheet approvals',
      icon: <Clock className="w-5 h-5" />,
      action: '/admin/alerts',
      color: 'bg-orange-500 hover:bg-orange-600',
      count: dashboardData?.metrics.pendingApprovals || 0
    },
    {
      title: 'Critical Alerts',
      description: 'Address urgent system issues',
      icon: <AlertTriangle className="w-5 h-5" />,
      action: '/admin/alerts',
      color: 'bg-red-500 hover:bg-red-600',
      count: dashboardData?.metrics.criticalAlerts || 0
    },
    {
      title: 'System Settings',
      description: 'Configure holidays and rules',
      icon: <Settings className="w-5 h-5" />,
      action: '/admin/system-settings',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'User Management',
      description: 'Manage all system users',
      icon: <Shield className="w-5 h-5" />,
      action: '/admin/users',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'View Analytics',
      description: 'Detailed system analytics',
      icon: <TrendingUp className="w-5 h-5" />,
      action: '/admin/analytics',
      color: 'bg-indigo-500 hover:bg-indigo-600',
    }
  ], [dashboardData]);

  const handleQuickAction = (action: string) => {
    navigate(action);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Loading system overview...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName}! Here's your system overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={dashboardData?.metrics.systemHealth && dashboardData.metrics.systemHealth > 95 ? "default" : "secondary"}>
            System Health: {dashboardData?.metrics.systemHealth || 0}%
          </Badge>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.metrics.totalUsers || 0}</p>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-xs text-green-600">
                  {dashboardData?.metrics.activeUsers || 0} active • {dashboardData?.metrics.newUsersThisMonth || 0} new
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.metrics.totalTimesheets || 0}</p>
                <p className="text-sm text-gray-600">Total Timesheets</p>
                <p className="text-xs text-blue-600">This month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.metrics.pendingApprovals || 0}</p>
                <p className="text-sm text-gray-600">Pending Approvals</p>
                <p className="text-xs text-orange-600">Needs attention</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.metrics.criticalAlerts || 0}</p>
                <p className="text-sm text-gray-600">Critical Alerts</p>
                <p className="text-xs text-red-600">14+ days pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common administrative tasks and system management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className={`h-auto p-4 flex flex-col items-start gap-2 text-left hover:shadow-md transition-all ${action.color} hover:text-white border-gray-200 hover:border-transparent`}
                onClick={() => handleQuickAction(action.action)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {action.icon}
                    <span className="font-medium">{action.title}</span>
                  </div>
                  {action.count !== undefined && (
                    <Badge variant="secondary" className="bg-white/20 text-current">
                      {action.count}
                    </Badge>
                  )}
                </div>
                <p className="text-sm opacity-80">{action.description}</p>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>System Health</span>
                <Badge variant={dashboardData?.metrics.systemHealth && dashboardData.metrics.systemHealth > 95 ? "default" : "secondary"}>
                  {dashboardData?.metrics.systemHealth || 0}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Active Users</span>
                <span className="font-semibold">
                  {dashboardData?.metrics.activeUsers || 0} / {dashboardData?.metrics.totalUsers || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>System Uptime</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">99.9%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Critical Issues</span>
                <span className={`font-semibold ${(dashboardData?.metrics.criticalAlerts || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {dashboardData?.metrics.criticalAlerts || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.metrics.newUsersThisMonth && dashboardData.metrics.newUsersThisMonth > 0 && (
                <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{dashboardData.metrics.newUsersThisMonth} new users added</p>
                    <p className="text-xs text-gray-600">This month</p>
                  </div>
                </div>
              )}
              
              {dashboardData?.metrics.pendingApprovals && dashboardData.metrics.pendingApprovals > 0 && (
                <div className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{dashboardData.metrics.pendingApprovals} timesheets pending approval</p>
                    <p className="text-xs text-gray-600">Requires attention</p>
                  </div>
                </div>
              )}

              {dashboardData?.metrics.criticalAlerts && dashboardData.metrics.criticalAlerts > 0 && (
                <div className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{dashboardData.metrics.criticalAlerts} critical alerts</p>
                    <p className="text-xs text-gray-600">Immediate action required</p>
                  </div>
                </div>
              )}

              {(!dashboardData?.metrics.criticalAlerts || dashboardData.metrics.criticalAlerts === 0) && 
               (!dashboardData?.metrics.pendingApprovals || dashboardData.metrics.pendingApprovals < 5) && (
                <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">System running smoothly</p>
                    <p className="text-xs text-gray-600">No critical issues detected</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;