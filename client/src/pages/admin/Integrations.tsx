import React, { useEffect, useState } from 'react';
import integrationService, { type PayrollSettings, type CalendarSettings, type ADSettings } from '../../services/integration.service';
import { toast } from 'react-toastify';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-white rounded shadow p-5">
    <h3 className="text-lg font-semibold mb-3">{title}</h3>
    {children}
  </section>
);

const IntegrationsPage: React.FC = () => {
  const [payroll, setPayroll] = useState<PayrollSettings>({ provider: 'None' });
  const [calendar, setCalendar] = useState<CalendarSettings>({ provider: 'None' });
  const [ad, setAD] = useState<ADSettings>({ provider: 'None', connectionStatus: 'Unknown' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [p, c, a] = await Promise.all([
        integrationService.getPayroll(),
        integrationService.getCalendar(),
        integrationService.getAD(),
      ]);
      setPayroll(p); setCalendar(c); setAD(a);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load integrations');
    } finally { setLoading(false); }
  };

  const savePayroll = async () => { try { setPayroll(await integrationService.updatePayroll(payroll)); toast.success('Payroll settings saved'); } catch (e: any) { toast.error('Save failed'); } };
  const saveCalendar = async () => { try { setCalendar(await integrationService.updateCalendar(calendar)); toast.success('Calendar settings saved'); } catch (e: any) { toast.error('Save failed'); } };
  const syncCalendar = async () => { try { await integrationService.syncCalendar(); toast.info('Calendar sync started'); } catch { toast.error('Sync failed'); } };
  const saveAD = async () => { try { setAD(await integrationService.updateAD(ad)); toast.success('AD settings saved'); } catch (e: any) { toast.error('Save failed'); } };
  const testAD = async () => { try { const res = await integrationService.testAD(); res.success ? toast.success('AD connection OK') : toast.error(res.message || 'AD test failed'); } catch { toast.error('AD test failed'); } };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Section title="Payroll Integration">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Provider</label>
            <select className="w-full border rounded px-3 py-2" value={payroll.provider} onChange={e => setPayroll({ ...payroll, provider: e.target.value as PayrollSettings['provider'] })}>
              {['None','GenericCSV','ADP','Workday'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Endpoint URL</label>
            <input className="w-full border rounded px-3 py-2" value={payroll.endpointUrl || ''} onChange={e => setPayroll({ ...payroll, endpointUrl: e.target.value })} />
          </div>
        </div>
        <div className="mt-3 flex justify-end"><button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={savePayroll}>Save</button></div>
      </Section>

      <Section title="Calendar Synchronization">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Provider</label>
            <select className="w-full border rounded px-3 py-2" value={calendar.provider} onChange={e => setCalendar({ ...calendar, provider: e.target.value as CalendarSettings['provider'] })}>
              {['None','Google','Microsoft'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tenant ID</label>
            <input className="w-full border rounded px-3 py-2" value={calendar.tenantId || ''} onChange={e => setCalendar({ ...calendar, tenantId: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Client ID</label>
            <input className="w-full border rounded px-3 py-2" value={calendar.clientId || ''} onChange={e => setCalendar({ ...calendar, clientId: e.target.value })} />
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button className="px-4 py-2 rounded border" onClick={syncCalendar}>Sync Now</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={saveCalendar}>Save</button>
        </div>
      </Section>

      <Section title="Active Directory Integration">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Provider</label>
            <select className="w-full border rounded px-3 py-2" value={ad.provider} onChange={e => setAD({ ...ad, provider: e.target.value as ADSettings['provider'] })}>
              {['None','AzureAD','LDAP'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Domain/Tenant</label>
            <input className="w-full border rounded px-3 py-2" value={ad.domain || ad.tenantId || ''} onChange={e => setAD({ ...ad, domain: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Client ID</label>
            <input className="w-full border rounded px-3 py-2" value={ad.clientId || ''} onChange={e => setAD({ ...ad, clientId: e.target.value })} />
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button className="px-4 py-2 rounded border" onClick={testAD}>Test Connection</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={saveAD}>Save</button>
        </div>
      </Section>
    </div>
  );
};

export default IntegrationsPage;
