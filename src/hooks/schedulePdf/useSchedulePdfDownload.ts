import { useCallback, useState } from 'react';
import { useToast } from '../../components/ui/toast';
import { getApiErrorMessage } from '../../lib/apiError';

type DownloadFn = () => Promise<void>;

/**
 * Shared loading + toast wrapper for triggering a PDF download.
 */
export const useSchedulePdfDownload = () => {
  const { addToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const download = useCallback(
    async (
      fn: DownloadFn,
      labels?: { startTitle?: string; successTitle?: string; errorTitle?: string }
    ) => {
      if (isDownloading) return;
      setIsDownloading(true);
      addToast({
        type: 'info',
        title: labels?.startTitle ?? 'Preparing PDF',
        description: 'Generating your schedule report…',
      });
      try {
        await fn();
        addToast({
          type: 'success',
          title: labels?.successTitle ?? 'PDF Ready',
          description: 'Your schedule has been downloaded.',
        });
      } catch (error) {
        addToast({
          type: 'error',
          title: labels?.errorTitle ?? 'Download Failed',
          description: getApiErrorMessage(
            error,
            'Unable to generate the schedule PDF.'
          ),
        });
      } finally {
        setIsDownloading(false);
      }
    },
    [addToast, isDownloading]
  );

  return { download, isDownloading };
};
