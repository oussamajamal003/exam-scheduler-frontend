import { axiosClient } from './axiosclient';

export type PdfPortal = 'student' | 'proctor';

const triggerBlobDownload = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

const filenameFromHeaders = (
  headers: Record<string, unknown> | undefined,
  fallback: string
) => {
  const disposition = headers?.['content-disposition'];
  if (typeof disposition === 'string') {
    const match = /filename="?([^";]+)"?/i.exec(disposition);
    if (match?.[1]) return match[1];
  }
  return fallback;
};

const tryParseErrorBlob = async (data: unknown): Promise<string | null> => {
  if (!(data instanceof Blob)) return null;
  try {
    const text = await data.text();
    if (!text) return null;
    try {
      const parsed = JSON.parse(text);
      return parsed?.message || parsed?.error || null;
    } catch {
      return text;
    }
  } catch {
    return null;
  }
};

const downloadPdf = async (url: string, fallbackFileName: string) => {
  try {
    const response = await axiosClient.get(url, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    });
    const fileName = filenameFromHeaders(
      response.headers as Record<string, unknown>,
      fallbackFileName
    );
    const blob =
      response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: 'application/pdf' });
    triggerBlobDownload(blob, fileName);
  } catch (error) {
    const maybeAxios = error as { response?: { data?: unknown; status?: number }; message?: string };
    const parsed = await tryParseErrorBlob(maybeAxios?.response?.data);
    if (parsed) {
      const wrapped = new Error(parsed) as Error & { response?: unknown };
      wrapped.response = maybeAxios.response;
      throw wrapped;
    }
    throw error;
  }
};

export const downloadAdminSchedulePdf = (scheduleId: string) =>
  downloadPdf(`/schedules/${scheduleId}/pdf`, `schedule-${scheduleId}.pdf`);

export const downloadStudentSchedulePdf = () =>
  downloadPdf('/student/schedule/pdf', 'my-exam-schedule.pdf');

export const downloadProctorSchedulePdf = () =>
  downloadPdf('/proctor/schedule/pdf', 'my-duties.pdf');

export const downloadFullPublishedSchedulePdf = (
  portal: PdfPortal,
  scheduleId?: string
) => {
  const query = scheduleId ? `?scheduleId=${encodeURIComponent(scheduleId)}` : '';
  return downloadPdf(
    `/${portal}/schedule/full-pdf${query}`,
    'full-published-schedule.pdf'
  );
};
