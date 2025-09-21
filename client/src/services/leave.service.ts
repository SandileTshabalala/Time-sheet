import api from './api';

export type LeaveType = 'Annual' | 'Sick' | 'Unpaid' | 'Other';

export interface LeaveRequestDto {
  id: number;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: string; // ISO
  endDate: string;   // ISO
  days: number;
  reason?: string;
  status: LeaveStatus;
  approvedById?: string;
  approvedByName?: string;
  approvedDate?: string;
  createdDate: string;
}

export interface CreateLeaveDto {
  type: LeaveType; // Will be sent to server as enum numeric value
  startDate: string | Date;
  endDate: string | Date;
  reason?: string;
}

export interface ApproveLeaveDto {
  isApproved: boolean;
  rejectionReason?: string;
}

export const LeaveStatus = {
  Draft: 0,
  Submitted: 1,
  ManagerApproved: 2,
  Approved: 3,
  Rejected: 4,
} as const;
export type LeaveStatus = typeof LeaveStatus[keyof typeof LeaveStatus];

class LeaveService {
  // Server routes use [Route("api/leaves")]
  private readonly baseUrl = '/leaves';

  async create(data: CreateLeaveDto): Promise<LeaveRequestDto> {
    const typeToNumber: Record<LeaveType, number> = {
      Annual: 0,
      Sick: 1,
      Unpaid: 2,
      Other: 3,
    };
    const payload = {
      type: typeToNumber[data.type],
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      reason: data.reason,
    };
    const res = await api.post<LeaveRequestDto>(this.baseUrl, payload);
    return res.data;
  }

  async myLeaves(startDate?: string | Date, endDate?: string | Date): Promise<LeaveRequestDto[]> {
    const toIso = (d?: string | Date) => (d ? new Date(d).toISOString() : undefined);
    const res = await api.get<LeaveRequestDto[]>(`${this.baseUrl}/my`, { params: { startDate: toIso(startDate), endDate: toIso(endDate) } });
    return res.data;
  }

  async pendingApprovals(): Promise<LeaveRequestDto[]> {
    const res = await api.get<LeaveRequestDto[]>(`${this.baseUrl}/pending`);
    return res.data;
  }

  async approve(id: number, dto: ApproveLeaveDto): Promise<LeaveRequestDto> {
    const res = await api.put<LeaveRequestDto>(`${this.baseUrl}/${id}/approve`, dto);
    return res.data;
  }
}

export default new LeaveService();
