import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download, Users, Clock, TrendingUp,RefreshCw,  BarChart3, Target, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Input } from '@/components/ui/input';
import reportsService from '@/services/reports.service';
import timesheetService from '@/services/timesheet.service';
// import authService from '@/services/auth.service';
 
interface HRMetrics {
  totalEmployees: number;
  activeEmployees: number;
  pendingApprovals: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  totalHoursThisMonth: number;
  avgHoursPerEmployee: number;
  escalatedTimesheets: number;
}

interface EmployeePerformance {
  employeeId: string;
  employeeName: string;
  totalHours: number;
  timesheetsSubmitted: number;
  onTimeSubmissions: number;
  lateSubmissions: number;
  averageHours: number;
  complianceScore: number;
  lastSubmission: string;
}

const HRAnalytics: React.FC = () => {
  // const user = authService.getCurrentUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],  //number of milliseconds in 30 days ago
    endDate: new Date().toISOString().split('T')[0]
  });
 
  // Fetch HR analytics data
  const { data: hrData, isLoading, error, refetch } = useQuery({
    queryKey: ['hr-analytics', dateRange],
    queryFn: async () => {
      try {
        const timesheets = await timesheetService.getAnalyticsData({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          employeeId: '',
          department: '',
          status: ''
        });

        console.log('HR Analytics Debug:', {
          timesheetsCount: timesheets.length,
          sampleTimesheet: timesheets[0],
          statusBreakdown: {
            draft: timesheets.filter(ts => ts.status === 0).length,
            submitted: timesheets.filter(ts => ts.status === 1).length,
            approved: timesheets.filter(ts => ts.status === 2).length,
            rejected: timesheets.filter(ts => ts.status === 3).length,
            resubmitted: timesheets.filter(ts => ts.status === 4).length,
            managerApproved: timesheets.filter(ts => ts.status === 5).length
          }
        });

        const uniqueUsers = new Map<string, any>();
        timesheets.forEach((ts: any) => {
          if (ts.employeeId && ts.employeeName && !uniqueUsers.has(ts.employeeId)) {
            const nameParts = ts.employeeName.split(' ');
            uniqueUsers.set(ts.employeeId, {
              id: ts.employeeId,
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              isActive: true, 
              roles: ['Employee'] 
            });
          }
        });
        
        const employees = Array.from(uniqueUsers.values());

        // If no users found from timesheets, create a minimal structure
        if (employees.length === 0 && timesheets.length === 0) {
          console.log('No timesheet data available for HR analytics');
        }

        const hrMetrics: HRMetrics = {
          totalEmployees: employees.length,
          activeEmployees: employees.filter((u: any) => u.isActive).length,
          pendingApprovals: timesheets.filter((ts: any) => ts.status === 1 || ts.status === 4).length, // Submitted + Resubmitted
          approvedThisMonth: timesheets.filter((ts: any) => ts.status === 2 || ts.status === 5).length, // Approved + ManagerApproved
          rejectedThisMonth: timesheets.filter((ts: any) => ts.status === 3).length,
          totalHoursThisMonth: timesheets.reduce((sum: number, ts: any) => sum + (ts.hoursWorked || 0), 0),
          avgHoursPerEmployee: employees.length > 0 
            ? timesheets.reduce((sum: number, ts: any) => sum + (ts.hoursWorked || 0), 0) / employees.length 
            : 0,
          escalatedTimesheets: timesheets.filter((ts: any) => {
            const submittedDate = new Date(ts.createdDate || ts.date);
            const daysPending = Math.floor((Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));
            return daysPending > 7 && (ts.status === 1 || ts.status === 4); // Submitted or Resubmitted for > 7 days
          }).length
        };

        // Calculate employee performance
        const employeePerformance: EmployeePerformance[] = employees.map((employee: any) => {
          const employeeTimesheets = timesheets.filter((ts: any) => ts.employeeId === employee.id);
          const totalHours = employeeTimesheets.reduce((sum: number, ts: any) => sum + (ts.hoursWorked || 0), 0);
          
          // Calculate on-time vs late submissions
          const onTimeSubmissions = employeeTimesheets.filter((ts: any) => {
            const submittedDate = new Date(ts.createdDate || ts.date);
            const workDate = new Date(ts.date);
            const daysDiff = Math.floor((submittedDate.getTime() - workDate.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff <= 7;
          }).length;

          const lateSubmissions = employeeTimesheets.length - onTimeSubmissions;
          const complianceScore = employeeTimesheets.length > 0 
            ? Math.round((onTimeSubmissions / employeeTimesheets.length) * 100) 
            : 100;

          const lastSubmission = employeeTimesheets.length > 0 
            ? employeeTimesheets.sort((a: any, b: any) => 
                new Date(b.createdDate || b.date).getTime() - new Date(a.createdDate || a.date).getTime()
              )[0]
            : null;

          return {
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`.trim() || 'Unknown Employee',
            totalHours,
            timesheetsSubmitted: employeeTimesheets.length,
            onTimeSubmissions,
            lateSubmissions,
            averageHours: employeeTimesheets.length > 0 ? totalHours / employeeTimesheets.length : 0,
            complianceScore,
            lastSubmission: lastSubmission ? new Date(lastSubmission.createdDate || lastSubmission.date).toLocaleDateString() : 'Never'
          };
        });

        return {
          hrMetrics,
          employeePerformance: employeePerformance.sort((a, b) => b.totalHours - a.totalHours),
          timesheets,
          employees
        };
      } catch (error) {
        console.error('Failed to fetch HR analytics data:', error);
        
        if (error instanceof Error) {
          if (error.message.includes('403') || error.message.includes('Forbidden')) {
            toast.error('Working with limited data - some admin features require higher permissions.');
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            toast.error('Network error. Please check your connection.');
          } else {
            toast.error(`Failed to load HR analytics data: ${error.message}`);
          }
        } else {
          toast.error('Failed to load HR analytics data. Please try again.');
        }
        
        // Return empty data structure instead of throwing
        return {
          hrMetrics: {
            totalEmployees: 0,
            activeEmployees: 0,
            pendingApprovals: 0,
            approvedThisMonth: 0,
            rejectedThisMonth: 0,
            totalHoursThisMonth: 0,
            avgHoursPerEmployee: 0,
            escalatedTimesheets: 0
          },
          employeePerformance: [],
          timesheets: [],
          employees: []
        };
      }
    },
    refetchInterval: 60000 // Refresh every minute
  });

  const complianceInsights = useMemo(() => {
    if (!hrData?.employeePerformance) return null;

    const performances = hrData.employeePerformance;
    const avgComplianceScore = performances.length > 0 
      ? performances.reduce((sum, emp) => sum + emp.complianceScore, 0) / performances.length 
      : 100;

    const highPerformers = performances.filter(emp => emp.complianceScore >= 90).length;
    const lowPerformers = performances.filter(emp => emp.complianceScore < 70).length;
    const totalLateSubmissions = performances.reduce((sum, emp) => sum + emp.lateSubmissions, 0);

    return {
      avgComplianceScore: Math.round(avgComplianceScore),
      highPerformers,
      lowPerformers,
      totalLateSubmissions
    };
  }, [hrData]);

  const handleExportHRReport = async () => {
    try {
      await reportsService.exportTeamReport(dateRange.startDate, dateRange.endDate, 'excel');
      toast.success('HR analytics report exported successfully');
    } catch (error) {
      toast.error('Failed to export HR analytics report');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HR Analytics</h1>
            <p className="text-gray-600">Loading HR insights...</p>
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HR Analytics</h1>
            <p className="text-red-600">Error loading HR analytics data</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-600 mb-4">
              <BarChart3 className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Failed to load analytics data</h3>
            <p className="text-gray-600 mb-4">
              There was an error loading the HR analytics. This could be due to:
            </p>
            <ul className="text-left text-sm text-gray-600 mb-6 max-w-md mx-auto">
              <li>• Network connectivity issues</li>
              <li>• Insufficient permissions</li>
              <li>• Server maintenance</li>
            </ul>
            <Button onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Analytics</h1>
          <p className="text-gray-600">Employee performance and compliance insights</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportHRReport} variant="outline" size="sm">
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

      {/* HR Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{hrData?.hrMetrics.totalEmployees || 0}</p>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-xs text-green-600">{hrData?.hrMetrics.activeEmployees || 0} active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{hrData?.hrMetrics.pendingApprovals || 0}</p>
                <p className="text-sm text-gray-600">Pending Approvals</p>
                <p className="text-xs text-red-600">{hrData?.hrMetrics.escalatedTimesheets || 0} escalated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{hrData?.hrMetrics.approvedThisMonth || 0}</p>
                <p className="text-sm text-gray-600">Approved This Month</p>
                <p className="text-xs text-red-600">{hrData?.hrMetrics.rejectedThisMonth || 0} rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{Math.round((hrData?.hrMetrics.avgHoursPerEmployee || 0) * 10) / 10}</p>
                <p className="text-sm text-gray-600">Avg Hours/Employee</p>
                <p className="text-xs text-blue-600">{hrData?.hrMetrics.totalHoursThisMonth || 0} total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed HR Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Approval Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Approval Rate</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {(hrData?.hrMetrics.approvedThisMonth || 0) + (hrData?.hrMetrics.rejectedThisMonth || 0) > 0
                        ? Math.round(((hrData?.hrMetrics.approvedThisMonth || 0) / 
                            ((hrData?.hrMetrics.approvedThisMonth || 0) + (hrData?.hrMetrics.rejectedThisMonth || 0))) * 100)
                        : 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pending Review</span>
                    <span className={`font-semibold ${(hrData?.hrMetrics.pendingApprovals || 0) > 10 ? 'text-red-600' : 'text-gray-900'}`}>
                      {hrData?.hrMetrics.pendingApprovals || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Escalated Cases</span>
                    <span className={`font-semibold ${(hrData?.hrMetrics.escalatedTimesheets || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {hrData?.hrMetrics.escalatedTimesheets || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Workforce Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Active Workforce</span>
                    <span className="font-semibold">
                      {hrData?.hrMetrics.activeEmployees || 0} / {hrData?.hrMetrics.totalEmployees || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Avg Compliance Score</span>
                    <Badge variant={complianceInsights && complianceInsights.avgComplianceScore > 80 ? "default" : "secondary"}>
                      {complianceInsights?.avgComplianceScore || 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>High Performers</span>
                    <span className="font-semibold text-green-600">
                      {complianceInsights?.highPerformers || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Performance Overview</CardTitle>
              <CardDescription>Top performing employees based on hours worked and compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {hrData?.employeePerformance.slice(0, 10).map((employee) => (
                  <div key={employee.employeeId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${employee.complianceScore >= 90 ? 'bg-green-500' : employee.complianceScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      <div>
                        <p className="font-medium">{employee.employeeName}</p>
                        <p className="text-sm text-gray-600">{employee.totalHours}h total • {employee.timesheetsSubmitted} timesheets</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={employee.complianceScore >= 90 ? "default" : employee.complianceScore >= 70 ? "secondary" : "destructive"}>
                        {employee.complianceScore}% compliance
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        Last: {employee.lastSubmission}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>High Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{complianceInsights?.highPerformers || 0}</p>
                  <p className="text-sm text-gray-600">90%+ compliance</p>
                  <p className="text-xs text-gray-500 mt-2">Excellent track record</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Needs Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{complianceInsights?.lowPerformers || 0}</p>
                  <p className="text-sm text-gray-600">&lt;70% compliance</p>
                  <p className="text-xs text-gray-500 mt-2">Requires HR intervention</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Late Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">{complianceInsights?.totalLateSubmissions || 0}</p>
                  <p className="text-sm text-gray-600">This period</p>
                  <p className="text-xs text-gray-500 mt-2">Beyond 7-day deadline</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HRAnalytics;