import api from './api';

export interface PayrollSettings {
  provider: 'None' | 'GenericCSV' | 'ADP' | 'Workday';
  endpointUrl?: string;
  apiKeyMasked?: string;
  lastRunUtc?: string;
}

export interface CalendarSettings {
  provider: 'None' | 'Google' | 'Microsoft';
  tenantId?: string;
  clientId?: string;
  consentGiven?: boolean;
  lastSyncUtc?: string;
}

export interface ADSettings {
  provider: 'None' | 'AzureAD' | 'LDAP';
  domain?: string;
  tenantId?: string;
  clientId?: string;
  connectionStatus?: 'Unknown' | 'Success' | 'Failed';
}

class IntegrationService {
  async getPayroll(): Promise<PayrollSettings> {
    const res = await api.get<PayrollSettings>('/admin/integrations/payroll');
    return res.data;
  }
  async updatePayroll(data: Partial<PayrollSettings>): Promise<PayrollSettings> {
    const res = await api.put<PayrollSettings>('/admin/integrations/payroll', data);
    return res.data;
  }

  async getCalendar(): Promise<CalendarSettings> {
    const res = await api.get<CalendarSettings>('/admin/integrations/calendar');
    return res.data;
  }
  async updateCalendar(data: Partial<CalendarSettings>): Promise<CalendarSettings> {
    const res = await api.put<CalendarSettings>('/admin/integrations/calendar', data);
    return res.data;
  }
  async syncCalendar(): Promise<{ started: boolean }> {
    const res = await api.post<{ started: boolean }>('/admin/integrations/calendar/sync');
    return res.data;
  }

  async getAD(): Promise<ADSettings> {
    const res = await api.get<ADSettings>('/admin/integrations/ad');
    return res.data;
  }
  async updateAD(data: Partial<ADSettings>): Promise<ADSettings> {
    const res = await api.put<ADSettings>('/admin/integrations/ad', data);
    return res.data;
  }
  async testAD(): Promise<{ success: boolean; message?: string }> {
    const res = await api.post<{ success: boolean; message?: string }>('/admin/integrations/ad/test');
    return res.data;
  }
}

export default new IntegrationService();
