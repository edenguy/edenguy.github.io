import { useTranslation } from 'react-i18next';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Callout } from '@/components/ui/Callout';
import { CHAPTERS } from '@/content';

export function AboutPage() {
  const { t } = useTranslation();
  const refs = CHAPTERS.flatMap((c) => c.references);
  return (
    <div className="space-y-6 max-w-3xl">
      <SectionTitle eyebrow={t('nav.about')} title={t('about.title')} />
      <Card className="space-y-6">
        <Section title={t('about.whatTitle')} body={t('about.whatBody')} />
        <div>
          <h3 className="text-lg text-ink mb-2">{t('about.notTitle')}</h3>
          <ul className="space-y-2 text-ink-2 list-disc ps-5">
            <li>{t('about.not1')}</li>
            <li>{t('about.not2')}</li>
            <li>{t('about.not3')}</li>
          </ul>
        </div>
        <Section title={t('about.scienceTitle')} body={t('about.scienceBody')} />
        <Callout variant="warning" title={t('about.reviewTitle')}>
          {t('about.reviewBody')}
        </Callout>
        <div>
          <h3 className="text-lg text-ink mb-1">{t('legal.aboutTitle')}</h3>
          <p className="text-ink-2 mb-2">{t('legal.sourcesIntro')}</p>
          <ul className="space-y-1.5 text-ink-2 list-disc ps-5">
            {(t('legal.sources', { returnObjects: true }) as string[]).map((src, i) => (
              <li key={i}>{src}</li>
            ))}
          </ul>
        </div>
        <Callout variant="safety" title={t('legal.liabilityTitle')}>
          {t('legal.liability')}
        </Callout>
        <Section title={t('about.privacyTitle')} body={t('about.privacyBody')} />
        <div>
          <h3 className="text-lg text-ink mb-1">{t('about.creditTitle')}</h3>
          <p className="text-ink-2">
            {t('about.creditBody')}{' '}
            <a href="https://edenguy.github.io" className="text-accent underline" rel="author">
              {t('about.creditLink')}
            </a>
          </p>
        </div>
      </Card>
      <Card>
        <h3 className="text-lg text-ink mb-3">{t('common.references')}</h3>
        <ol className="space-y-3 text-sm text-ink-2 list-decimal ps-5" dir="ltr">
          {refs.map((r) => (
            <li key={r.id}>
              <span className="text-ink">{r.citation}</span>
              {r.url && (
                <>
                  {' '}
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-accent underline break-all">
                    {r.url}
                  </a>
                </>
              )}
              <div className="text-muted">{r.scope}</div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-lg text-ink mb-1">{title}</h3>
      <p className="text-ink-2">{body}</p>
    </div>
  );
}
