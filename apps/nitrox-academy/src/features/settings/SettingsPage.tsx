import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Segmented';
import { Button } from '@/components/ui/Button';
import { useProgress } from '@/progress/store';
import { LOCALES } from '@/i18n';
import { downloadBackup, parseBackup, restoreBackup } from '@/progress/backup';
import { useRef } from 'react';
import { Icon } from '@/components/ui/Icon';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export function SettingsPage() {
  const { t } = useTranslation();
  const settings = useProgress((s) => s.settings);
  const setLocale = useProgress((s) => s.setLocale);
  const setTheme = useProgress((s) => s.setTheme);
  const setUnits = useProgress((s) => s.setUnits);
  const resetProgress = useProgress((s) => s.resetProgress);
  const [install, setInstall] = useState<BeforeInstallPromptEvent | null>(null);
  const [resetDone, setResetDone] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      setInstall(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', on);
    return () => window.removeEventListener('beforeinstallprompt', on);
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionTitle eyebrow={t('nav.settings')} title={t('settings.title')} />
      <Card className="space-y-5">
        <Row label={t('settings.language')}>
          <Segmented options={LOCALES.map((l) => ({ value: l.code, label: l.label }))} value={settings.locale} onChange={setLocale} ariaLabel={t('settings.language')} />
        </Row>
        <Row label={t('settings.theme')}>
          <Segmented
            options={[
              { value: 'system', label: t('settings.themeSystem') },
              { value: 'light', label: t('settings.themeLight') },
              { value: 'dark', label: t('settings.themeDark') },
            ]}
            value={settings.theme}
            onChange={setTheme}
            ariaLabel={t('settings.theme')}
          />
        </Row>
        <Row label={t('settings.units')}>
          <Segmented
            options={[
              { value: 'm', label: t('common.unitsMetric') },
              { value: 'ft', label: t('common.unitsImperial') },
            ]}
            value={settings.units}
            onChange={setUnits}
            ariaLabel={t('settings.units')}
          />
        </Row>
      </Card>
      {install && (
        <Card>
          <div className="font-semibold text-ink">{t('settings.install')}</div>
          <p className="text-sm text-ink-2 mt-1 mb-3">{t('settings.installBody')}</p>
          <Button onClick={() => void install.prompt()}>{t('settings.install')}</Button>
        </Card>
      )}
      <Card>
        <div className="font-semibold text-ink">{t('settings.backup')}</div>
        <p className="text-sm text-ink-2 mt-1 mb-3">{t('settings.backupBody')}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={downloadBackup}>
            <Icon name="arrow" size={16} className="rotate-90" /> {t('settings.export')}
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Icon name="refresh" size={16} /> {t('settings.import')}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              try {
                const backup = parseBackup(await file.text());
                if (!window.confirm(t('settings.importConfirm'))) return;
                restoreBackup(backup);
                setImportMsg({ ok: true, text: t('settings.importDone') });
              } catch {
                setImportMsg({ ok: false, text: t('settings.importError') });
              }
            }}
          />
          {importMsg && <span className={importMsg.ok ? 'text-sm text-safe' : 'text-sm text-danger'}>{importMsg.text}</span>}
        </div>
      </Card>
      <Card>
        <div className="font-semibold text-ink">{t('settings.data')}</div>
        <p className="text-sm text-ink-2 mt-1 mb-3">{t('settings.dataBody')}</p>
        <div className="flex items-center gap-3">
          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm(t('settings.resetConfirm'))) {
                resetProgress();
                setResetDone(true);
              }
            }}
          >
            {t('settings.reset')}
          </Button>
          {resetDone && <span className="text-sm text-safe">{t('settings.resetDone')}</span>}
        </div>
      </Card>
      <p className="text-xs text-muted">
        {t('settings.version')} {__APP_VERSION__}
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="font-medium text-ink">{label}</div>
      {children}
    </div>
  );
}
