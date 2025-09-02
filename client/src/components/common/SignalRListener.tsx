import { useEffect } from 'react';
import { toast } from 'react-toastify';
import signalrService from '../../services/signalr.service';
import { useNotifications } from '../../context/NotificationsContext';

// Simple global SignalR listener that connects on mount and shows toasts for timesheet events.
// You can expand this to invalidate React Query caches by dispatching custom events or importing your query client.
export default function SignalRListener() {
  const notifications = useNotifications();
  useEffect(() => {
    let mounted = true;

    const start = async () => {
      await signalrService.start();
    };

    // Handlers
    const onCreated = (p: any) => {
      if (!mounted) return;
      notifications.add({ type: 'TimesheetCreated', title: 'Timesheet created', message: `#${p?.timesheetId}`, payload: p });
      toast.info(`Timesheet created #${p?.timesheetId}`);
    };
    const onUpdated = (p: any) => {
      if (!mounted) return;
      notifications.add({ type: 'TimesheetUpdated', title: 'Timesheet updated', message: `#${p?.timesheetId}`, payload: p });
      toast.info(`Timesheet updated #${p?.timesheetId}`);
    };
    const onSubmitted = (p: any) => {
      if (!mounted) return;
      notifications.add({ type: 'TimesheetSubmitted', title: 'Timesheet submitted', message: `#${p?.timesheetId}`, payload: p });
      toast.success(`Timesheet submitted #${p?.timesheetId}`);
    };
    const onApproved = (p: any) => {
      if (!mounted) return;
      notifications.add({ type: 'TimesheetApproved', title: 'Timesheet approved', message: `#${p?.timesheetId}`, payload: p });
      toast.success(`Timesheet approved #${p?.timesheetId}`);
    };
    const onRejected = (p: any) => {
      if (!mounted) return;
      notifications.add({ type: 'TimesheetRejected', title: 'Timesheet rejected', message: `#${p?.timesheetId}${p?.reason ? `: ${p.reason}` : ''}`, payload: p });
      toast.error(`Timesheet rejected #${p?.timesheetId}${p?.reason ? `: ${p.reason}` : ''}`);
    };
    const onDeleted = (p: any) => {
      if (!mounted) return;
      notifications.add({ type: 'TimesheetDeleted', title: 'Timesheet deleted', message: `#${p?.timesheetId}`, payload: p });
      toast.warn(`Timesheet deleted #${p?.timesheetId}`);
    };
    const onEscalation = (p: any) => {
      if (!mounted) return;
      notifications.add({ type: 'TimesheetEscalation', title: 'Timesheet escalation', message: `#${p?.timesheetId} pending ${p?.daysPending} days`, payload: p });
      toast.warn(`Escalation: Timesheet #${p?.timesheetId} pending ${p?.daysPending} days`);
    };
    const onManagerApproved = (p: any) => {
      if (!mounted) return;
      notifications.add({ type: 'TimesheetManagerApproved', title: 'Manager approved', message: `Timesheet #${p?.timesheetId}`, payload: p });
      toast.info(`Manager approved timesheet #${p?.timesheetId}`);
    };

    // Register
    signalrService.on('TimesheetCreated', onCreated);
    signalrService.on('TimesheetUpdated', onUpdated);
    signalrService.on('TimesheetSubmitted', onSubmitted);
    signalrService.on('TimesheetApproved', onApproved);
    signalrService.on('TimesheetRejected', onRejected);
    signalrService.on('TimesheetDeleted', onDeleted);
    signalrService.on('TimesheetEscalation', onEscalation);
    signalrService.on('TimesheetManagerApproved', onManagerApproved);

    start();

    return () => {
      mounted = false;
      signalrService.off('TimesheetCreated', onCreated);
      signalrService.off('TimesheetUpdated', onUpdated);
      signalrService.off('TimesheetSubmitted', onSubmitted);
      signalrService.off('TimesheetApproved', onApproved);
      signalrService.off('TimesheetRejected', onRejected);
      signalrService.off('TimesheetDeleted', onDeleted);
      signalrService.off('TimesheetEscalation', onEscalation);
      signalrService.off('TimesheetManagerApproved', onManagerApproved);
    };
  }, []);

  return null;
}
