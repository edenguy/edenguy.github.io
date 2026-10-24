import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PwaUpdater() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div role="status" className="fixed bottom-20 md:bottom-6 inset-x-4 md:inset-x-auto md:end-6 z-50 card p-4 flex items-center gap-3 max-w-sm">
      <span className="text-sm text-ink-2 flex-1">{t('offline.update')}</span>
      <Button size="sm" onClick={() => void updateServiceWorker(true)}>
        {t('offline.reload')}
      </Button>
      <button type="button" className="text-muted text-sm" onClick={() => setNeedRefresh(false)} aria-label={t('common.close')}>
        ✕
      </button>
    </div>
  );
}
