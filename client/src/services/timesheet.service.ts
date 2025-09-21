import api from './api';
 
export interface TimesheetDto {
  id: number;
  employeeId: string;
  employeeName: string;
  date: string;
  hoursWorked: number;
  overtimeHours?: number;
  breakHours?: number;
  projectName?: string;
  taskDescription?: string;
  comments?: string;
  status: TimesheetStatus;
  approvedById?: string;
  approvedByName?: string;
  approvedDate?: string;
  rejectionReason?: string;
  createdDate: string;
  modifiedDate?: string;
  period: TimesheetPeriod;
  weekStartDate?: string;
  weekEndDate?: string;
}

export interface CreateTimesheetDto {
  date: string;
  hoursWorked: number;
  overtimeHours?: number;
  breakHours?: number;
  projectName?: string;
  taskDescription?: string;
  comments?: string;
  period: TimesheetPeriod;
  weekStartDate?: string;
  weekEndDate?: string;
}

export interface UpdateTimesheetDto {
  date: string;
  hoursWorked: number;
  overtimeHours?: number;
  breakHours?: number;
  projectName?: string;
  taskDescription?: string;
  comments?: string;
  period: TimesheetPeriod;
  weekStartDate?: string;
  weekEndDate?: string;
}

export interface ApproveTimesheetDto {
  isApproved: boolean;
  rejectionReason?: string;
}

export interface TimesheetReportDto {
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  totalOvertimeHours: number;
  totalDays: number;
  timesheets: TimesheetDto[];
}

export const TimesheetStatus = {
  Draft: 0,
  Submitted: 1,
  Approved: 2,
  Rejected: 3,
  Resubmitted: 4,
  ManagerApproved: 5
} as const;

export interface ReportFilters {
  startDate: string;
  endDate: string;
  employeeId?: string;
  department?: string;
  status?: string;
}

export type TimesheetStatus = typeof TimesheetStatus[keyof typeof TimesheetStatus];

export const TimesheetPeriod = {
  Daily: 0,
  Weekly: 1,
  Monthly: 2
} as const;
export type TimesheetPeriod = typeof TimesheetPeriod[keyof typeof TimesheetPeriod];

class TimesheetService {
  private readonly baseUrl = '/timesheet';

  // Create a new timesheet
  async createTimesheet(data: CreateTimesheetDto): Promise<TimesheetDto> {
    const formattedData = {
      ...data,
      date: new Date(data.date).toISOString(),
      weekStartDate: data.weekStartDate ? new Date(data.weekStartDate).toISOString() : null,
      weekEndDate: data.weekEndDate ? new Date(data.weekEndDate).toISOString() : null
    }
    const response = await api.post<TimesheetDto>(this.baseUrl, formattedData);
    return response.data;
  }

  // Get timesheet by ID
  async getTimesheet(id: number): Promise<TimesheetDto> {
    const response = await api.get<TimesheetDto>(`${this.baseUrl}/${id}`);
    return response.data;
  }
 
  // Get current user's timesheets
  async getMyTimesheets(startDate?: string | Date, endDate?: string | Date): Promise<TimesheetDto[]> {
    const toIso = (date?: string | Date) => 
      date ? new Date(date).toISOString() : undefined;
  
    const response = await api.get<TimesheetDto[]>(`${this.baseUrl}/my-timesheets`, {
      params: {
        ...(startDate ? { startDate: toIso(startDate) } : {}),
        ...(endDate ? { endDate: toIso(endDate) } : {}),
      },
    });
    return response.data;
  }

  // Get employee timesheets (for managers/HR)
  async getEmployeeTimesheets(employeeId: string, startDate?: string, endDate?: string): Promise<TimesheetDto[]> {
    const toIso = (date?: string | Date) => 
      date ? new Date(date).toISOString() : undefined;
    const response = await api.get<TimesheetDto[]>(`${this.baseUrl}/employee/${employeeId}` , {
      params: {
        ...(startDate ? { startDate: toIso(startDate) } : {}),
        ...(endDate ? { endDate: toIso(endDate) } : {}),
      },
    });
    return response.data;
  }

  // Update timesheet
  async updateTimesheet(id: number, data: UpdateTimesheetDto): Promise<TimesheetDto> {
    const formattedData = {
      ...data,
      date: new Date(data.date).toISOString(),
      weekStartDate: data.weekStartDate ? new Date(data.weekStartDate).toISOString() : null,
      weekEndDate: data.weekEndDate ? new Date(data.weekEndDate).toISOString() : null
    }
    const response = await api.put<TimesheetDto>(`${this.baseUrl}/${id}`, formattedData);
    return response.data;
  }

  // Submit timesheet for approval
  async submitTimesheet(id: number): Promise<TimesheetDto> {
    const response = await api.post<TimesheetDto>(`${this.baseUrl}/${id}/submit`);
    return response.data;
  }

  // Approve or reject timesheet (managers/HR only)
  async approveTimesheet(id: number, data: ApproveTimesheetDto): Promise<TimesheetDto> {
    const response = await api.put<TimesheetDto>(`${this.baseUrl}/${id}/approve`, data);
    return response.data;
  }

  // Get pending approvals (managers/HR only)
  async getPendingApprovals(): Promise<TimesheetDto[]> {
    const response = await api.get<TimesheetDto[]>(`${this.baseUrl}/pending-approval`);
    return response.data;
  }

  // Delete timesheet
  async deleteTimesheet(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }
  async getTeamTimesheets(filters: ReportFilters): Promise<TimesheetDto[]> {
    try {
      console.log('getTeamTimesheets called with filters:', filters);
      const allTimesheets: TimesheetDto[] = [];
      const processedIds = new Set<number>();
      
      // pending approvals
      try {
        const pendingResponse = await api.get<TimesheetDto[]>(`${this.baseUrl}/pending-approval`);
        const pendingTimesheets = pendingResponse.data || [];
        console.log('getTeamTimesheets - pending approvals found:', pendingTimesheets.length);
        pendingTimesheets.forEach(ts => {
          if (!processedIds.has(ts.id)) {
            allTimesheets.push(ts);
            processedIds.add(ts.id);
          }
        });
      } catch (error) {
        console.warn('Failed to fetch pending approvals:', error);
      }
      
      // current user's timesheets
      try {
        const myTimesheets = await this.getMyTimesheets(filters.startDate, filters.endDate);
        console.log('getTeamTimesheets - my timesheets found:', myTimesheets.length);
        myTimesheets.forEach(ts => {
          if (!processedIds.has(ts.id)) {
            allTimesheets.push(ts);
            processedIds.add(ts.id);
          }
        });
      } catch (error) {
        console.warn('Failed to fetch user timesheets:', error);
      }
      
      // team reports (if admin)
      try {
        const teamReports = await this.getTeamReport(filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), filters.endDate || new Date().toISOString());
        console.log('getTeamTimesheets - team reports found:', teamReports.length);
        
        // Extract individual timesheets from team reports
        let extractedCount = 0;
        teamReports.forEach(report => {
          if (report.timesheets && Array.isArray(report.timesheets)) {
            report.timesheets.forEach(ts => {
              if (!processedIds.has(ts.id)) {
                allTimesheets.push(ts);
                processedIds.add(ts.id);
                extractedCount++;
              }
            });
          }
        });
        console.log('getTeamTimesheets - timesheets extracted from team reports:', extractedCount);
      } catch (error) {
        console.warn('Failed to fetch team reports (this is expected for non-admin users):', error);
      }
      
      // Apply filters to the combined dataset
      let filteredTimesheets = allTimesheets;
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredTimesheets = filteredTimesheets.filter(ts => new Date(ts.date) >= startDate);
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        filteredTimesheets = filteredTimesheets.filter(ts => new Date(ts.date) <= endDate);
      }
      
      if (filters.employeeId) {
        filteredTimesheets = filteredTimesheets.filter(ts => ts.employeeId === filters.employeeId);
      }
      
      if (filters.status) {
        filteredTimesheets = filteredTimesheets.filter(ts => ts.status.toString() === filters.status);
      }
      
      // Sort by date descending
      filteredTimesheets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return filteredTimesheets;
    } catch (error) {
      console.error('Error fetching team timesheets:', error);
      return [];
    }
  }

  async getComprehensiveTeamData(employeeIds: string[], filters: ReportFilters): Promise<TimesheetDto[]> {
    try {
      const allTimesheets: TimesheetDto[] = [];
      const processedIds = new Set<number>();
      const promises = employeeIds.map(async (employeeId) => {
        try {
          const employeeTimesheets = await this.getEmployeeTimesheets(
            employeeId, 
            filters.startDate, 
            filters.endDate
          );
          return employeeTimesheets;
        } catch (error) {
          console.warn(`Failed to fetch timesheets for employee ${employeeId}:`, error);
          return [];
        }
      });
      
      const results = await Promise.allSettled(promises);
      //  results
      results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          result.value.forEach(ts => {
            if (!processedIds.has(ts.id)) {
              allTimesheets.push(ts);
              processedIds.add(ts.id);
            }
          });
        }
      });
      
      return allTimesheets;
    } catch (error) {
      console.error('Error fetching comprehensive team data:', error);
      return [];
    }
  }

  async getAnalyticsData(filters: ReportFilters): Promise<TimesheetDto[]> {
    try {
      console.log('getAnalyticsData called with filters:', filters);
      const teamTimesheets = await this.getTeamTimesheets(filters);
      console.log('getAnalyticsData - teamTimesheets count:', teamTimesheets.length);
      
      // Try to get comprehensive data using admin service if available
      // This provides complete historical data including approved/rejected timesheets
      if (teamTimesheets.length < 10) {
        try {
          // Import admin service dynamically to avoid circular dependencies
          const { default: adminService } = await import('./admin.service');
          const usersResponse = await adminService.getUsers();
          const users = Array.isArray(usersResponse.data) ? usersResponse.data : usersResponse.data?.items || [];
          
          if (users.length > 0) {
            console.log('getAnalyticsData - fetching comprehensive data for', users.length, 'users');
            const employeeIds = users.map((user: any) => user.id).filter(Boolean);
            const comprehensiveData = await this.getComprehensiveTeamData(employeeIds.slice(0, 20), filters);
            const existingIds = new Set(teamTimesheets.map(ts => ts.id));
            const additionalTimesheets = comprehensiveData.filter(ts => !existingIds.has(ts.id));
            
            console.log('getAnalyticsData - additional comprehensive timesheets found:', additionalTimesheets.length);
            const finalResult = [...teamTimesheets, ...additionalTimesheets];
            console.log('getAnalyticsData - final comprehensive result count:', finalResult.length);
            return finalResult;
          }
        } catch (error) {
          console.warn('Failed to fetch comprehensive analytics data (falling back to basic team data):', error);
          // If admin service fails (403 for HR users), fall back to team data only
        }
      }
      
      console.log('getAnalyticsData - returning team data only:', teamTimesheets.length);
      return teamTimesheets;
    } catch (error) {
      console.error('Error in getAnalyticsData:', error);
      return [];
    }
  }
  // Get employee report
  async getEmployeeReport(employeeId: string, startDate: string | Date, endDate: string | Date): Promise<TimesheetReportDto> {
    const toIso = (d: string | Date) => new Date(d).toISOString();
    const response = await api.get<TimesheetReportDto>(
      `${this.baseUrl}/reports/employee/${employeeId}`,
      { params: { startDate: toIso(startDate), endDate: toIso(endDate) } }
    );
    return response.data;
  }

  // Get team report
  async getTeamReport(startDate: string | Date, endDate: string | Date): Promise<TimesheetReportDto[]> {
    const toIso = (d: string | Date) => new Date(d).toISOString();
    const response = await api.get<TimesheetReportDto[]>(
      `${this.baseUrl}/reports/team`,
      { params: { startDate: toIso(startDate), endDate: toIso(endDate) } }
    );
    return response.data;
  }
  getStatusText(status: TimesheetStatus): string {
    switch (status) {
      case TimesheetStatus.Draft:
        return 'Draft';
      case TimesheetStatus.Submitted:
        return 'Submitted';
      case TimesheetStatus.ManagerApproved:
        return 'Manager Approved';
      case TimesheetStatus.Approved:
        return 'Approved';
      case TimesheetStatus.Rejected:
        return 'Rejected';
      case TimesheetStatus.Resubmitted:
        return 'Resubmitted';
      default:
        return 'Unknown';
    }
  }

  getStatusColor(status: TimesheetStatus): string {
    switch (status) {
      case TimesheetStatus.Draft:
        return 'text-gray-600 bg-gray-100';
      case TimesheetStatus.Submitted:
        return 'text-blue-600 bg-blue-100';
      case TimesheetStatus.ManagerApproved:
        return 'text-indigo-600 bg-indigo-100';
      case TimesheetStatus.Approved:
        return 'text-green-600 bg-green-100';
      case TimesheetStatus.Rejected:
        return 'text-red-600 bg-red-100';
      case TimesheetStatus.Resubmitted:
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getPeriodText(period: TimesheetPeriod): string {
    switch (period) {
      case TimesheetPeriod.Daily:
        return 'Daily';
      case TimesheetPeriod.Weekly:
        return 'Weekly';
      case TimesheetPeriod.Monthly:
        return 'Monthly';
      default:
        return 'Daily';
    }
  }
  //send reminder
  async sendReminder(timesheetId: number): Promise<void> {
    await api.post(`${this.baseUrl}/${timesheetId}/reminder`);
  }
}

export default new TimesheetService();
