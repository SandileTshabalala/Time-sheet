import api from './api';

function extractFileName(contentDisposition?: string, fallback: string = 'report') {
  if (!contentDisposition) return fallback;
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(contentDisposition);
  const fileNameEnc = match?.[1] || match?.[2];
  try {
    return fileNameEnc ? decodeURIComponent(fileNameEnc) : fallback;
  } catch {
    return fileNameEnc || fallback;
  }
}

async function download(path: string, params: Record<string, any>, defaultName: string) {
  const res = await api.get(path, {
    params,
    responseType: 'blob',
  });
  const fileName = extractFileName(res.headers['content-disposition'], defaultName);
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
 
const reportsService = {
  exportEmployeeReport: async (employeeId: string, start: string, end: string, format: 'excel' | 'pdf') => {
    const def = format === 'pdf' ? `Employee_${employeeId}_${start}_${end}.pdf` : `Employee_${employeeId}_${start}_${end}.xlsx`;
    await download(`/reports/employee/${employeeId}/export`, { start, end, format }, def);
  },
  exportTeamReport: async (start: string, end: string, format: 'excel' | 'pdf') => {
    const def = format === 'pdf' ? `Team_${start}_${end}.pdf` : `Team_${start}_${end}.xlsx`;
    await download('/reports/team/export', { start, end, format }, def);
  },
};

export default reportsService;
