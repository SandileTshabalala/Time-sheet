import React, { useState, useMemo} from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Users, Clock, TrendingUp, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { Input } from '@/components/ui/input';
import reportsService from '@/services/reports.service';
import adminService from '@/services/admin.service';
import timesheetService from '@/services/timesheet.service';
import authService from '@/services/auth.service';

interface ReportFilters {
  startDate: string;
  endDate: string;
  employeeId?: string;
  status?: string;
}

interface EmployeeStats {
  employeeId: string;
  employeeName: string;
  totalHours: number;
  averageDaily: number;
  daysWorked: number;
  overtimeHours: number;
  pendingSubmissions: number;
  performance: string;
}

const ReportsDashboard: React.FC = () => {
  const user = authService.getCurrentUser();
  const isAdmin = user?.roles?.includes('HRAdmin') || user?.roles?.includes('SystemAdmin');
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    employeeId: '',
    status: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Fetch report data with role-based access
  const { data: reportData, isLoading: reportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ['reports-data', filters, isAdmin],
    queryFn: async () => {
      const timesheets = isAdmin 
        ? await timesheetService.getTeamTimesheets(filters)
        : await timesheetService.getMyTimesheets(filters.startDate, filters.endDate);
      
      const usersResponse = await adminService.getUsers();
      const users = Array.isArray(usersResponse?.data) ? usersResponse.data : usersResponse.data?.items || [];
      
      const filteredTimesheets = timesheets.filter((ts: any) => {
        const tsDate = new Date(ts.date);
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        
        return tsDate >= startDate && tsDate <= endDate &&
               (!filters.employeeId || ts.employeeId === filters.employeeId) &&
               (!filters.status || ts.status.toString() === filters.status);
      });

      const totalHours = filteredTimesheets.reduce((sum: number, ts: any) => sum + ts.hoursWorked, 0);
      const uniqueEmployees = new Set(filteredTimesheets.map((ts: any) => ts.employeeId)).size;
      const pendingApprovals = filteredTimesheets.filter((ts: any) => ts.status === 1).length;
      
      return {
        metrics: {
          totalHours,
          totalEmployees: uniqueEmployees,
          averageHoursPerEmployee: uniqueEmployees > 0 ? totalHours / uniqueEmployees : 0,
          pendingApprovals,
          overtimeHours: filteredTimesheets.filter((ts: any) => ts.hoursWorked > 8).reduce((sum: number, ts: any) => sum + (ts.hoursWorked - 8), 0)
        },
        timesheets: filteredTimesheets,
        users
      };
    }
  });

  // Calculate employee statistics
  const employeeStats = useMemo(() => {
    if (!reportData?.timesheets || !reportData?.users) return [];
    
    const statsMap = new Map<string, EmployeeStats>();
    
    const calculatePerformance = (avgHours: number, totalDays: number) => {
      if (totalDays < 5) return 'Needs Review';
      if (avgHours > 9) return 'Overworked';
      if (avgHours < 6) return 'Underperforming';
      return 'On Track';
    };
    
    reportData.timesheets.forEach((ts: any) => {
      const employee = reportData.users.find((u: any) => u.id === ts.employeeId);
      if (!employee) return;
      
      const key = ts.employeeId;
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          employeeId: ts.employeeId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          totalHours: 0,
          averageDaily: 0,
          daysWorked: 0,
          overtimeHours: 0,
          pendingSubmissions: 0,
          performance: ''
        });
      }
      
      const stats = statsMap.get(key)!;
      stats.totalHours += ts.hoursWorked;
      stats.daysWorked += 1;
      if (ts.hoursWorked > 8) stats.overtimeHours += (ts.hoursWorked - 8);
      if (ts.status === 1) stats.pendingSubmissions += 1;
    });
    
    return Array.from(statsMap.values()).map(stats => {
      const avgDaily = stats.daysWorked > 0 ? stats.totalHours / stats.daysWorked : 0;
      return {
        ...stats,
        averageDaily: avgDaily,
        performance: calculatePerformance(avgDaily, stats.daysWorked)
      };
    });
  }, [reportData]);

  const filteredEmployeeStats = employeeStats.filter(emp => {
    const matchesSearch = !searchTerm || 
      emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleExportReport = async (format: 'excel' | 'pdf') => {
    try {
      await reportsService.exportTeamReport(filters.startDate, filters.endDate, format);
      toast.success(`${format.toUpperCase()} report exported successfully`);
    } catch (error) {
      toast.error(`Failed to export ${format.toUpperCase()} report`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports Dashboard</h1>
          <p className="text-gray-600">Comprehensive timesheet analytics and reporting</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetchReports()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => handleExportReport('excel')} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>  
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                type="date"
                id="startDate"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                type="date"
                id="endDate"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status || ''} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="0">Draft</SelectItem>
                  <SelectItem value="1">Submitted</SelectItem>
                  <SelectItem value="2">Approved</SelectItem>
                  <SelectItem value="3">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="search">Search Employee</Label>
              <Input
                type="text"
                id="search"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employee Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {reportData?.metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.metrics.totalHours.toFixed(1)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.metrics.totalEmployees}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Hours/Employee</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.metrics.averageHoursPerEmployee.toFixed(1)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.metrics.pendingApprovals}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Employee Performance</CardTitle>
              <CardDescription>Detailed employee statistics and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEmployeeStats.map((emp) => (
                    <div key={emp.employeeId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{emp.employeeName}</h3>
                          <p className="text-sm text-gray-600">ID: {emp.employeeId}</p>
                        </div>
                        <Badge variant={emp.performance === 'On Track' ? 'default' : 'secondary'}>
                          {emp.performance}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
                        <div>
                          <p className="text-gray-600">Total Hours</p>
                          <p className="font-medium">{emp.totalHours.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Days Worked</p>
                          <p className="font-medium">{emp.daysWorked}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Avg Daily</p>
                          <p className="font-medium">{emp.averageDaily.toFixed(1)}h</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Pending</p>
                          <p className="font-medium">{emp.pendingSubmissions}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsDashboard;
