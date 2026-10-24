import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { useSpeech } from '@/app/useSpeech';
import { useLocale } from '@/app/useLocale';
import { Icon } from './Icon';

/**
 * Read-aloud control. Hidden when the device has no voice for the current language, since a
 * silent button is worse than no button.
 */
export function SpeakButton({ text, className, label }: { text: string; className?: string; label?: string }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const speech = useSpeech(locale);
  if (!speech.supported || !text.trim()) return null;
  const active = speech.speaking;
  return (
    <button
      type="button"
      onClick={() => (active ? speech.stop() : speech.speak(text))}
      aria-label={active ? t('speech.stop') : (label ?? t('speech.listen'))}
      title={active ? t('speech.stop') : (label ?? t('speech.listen'))}
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
        active ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface-2 text-ink-2 hover:text-ink',
        className,
      )}
    >
      <Icon name={active ? 'stop' : 'speaker'} size={16} />
      {active ? t('speech.stop') : (label ?? t('speech.listen'))}
    </button>
  );
}
