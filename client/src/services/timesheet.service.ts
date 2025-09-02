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
  Resubmitted: 4
} as const;

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

  // Helper methods
  getStatusText(status: TimesheetStatus): string {
    switch (status) {
      case TimesheetStatus.Draft:
        return 'Draft';
      case TimesheetStatus.Submitted:
        return 'Submitted';
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
}

export default new TimesheetService();
