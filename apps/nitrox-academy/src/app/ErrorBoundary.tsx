import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from '@/i18n';
import { Logo } from '@/components/Logo';

interface State {
  error: Error | null;
}

/**
 * Last line of defence: a render error anywhere below shows a recovery screen instead of a
 * blank page. Progress in IndexedDB is untouched; the buttons only reload or go home.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Nitrox Academy render error', error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;
    const t = i18n.t.bind(i18n);
    return (
      <div className="min-h-dvh grid place-items-center px-6" role="alert">
        <div className="card max-w-md w-full p-6 text-center space-y-4">
          <Logo size={48} />
          <h1 className="text-xl text-ink">{t('error.title')}</h1>
          <p className="text-ink-2 text-sm">{t('error.body')}</p>
          <pre dir="ltr" className="text-xs text-muted text-start overflow-x-auto bg-surface-2 rounded-xl p-3 max-h-32">
            {this.state.error.message}
          </pre>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="rounded-full bg-accent text-accent-ink px-5 py-2.5 font-medium"
              onClick={() => {
                window.location.hash = '#/';
                window.location.reload();
              }}
            >
              {t('error.home')}
            </button>
            <button type="button" className="rounded-full bg-surface-2 border border-line px-5 py-2.5 font-medium" onClick={() => window.location.reload()}>
              {t('error.reload')}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
