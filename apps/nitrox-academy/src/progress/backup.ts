import { sanitisePersisted, useProgress, type ProgressState } from './store';

/**
 * Progress backup and restore as a plain JSON file, so a learner can carry their progress to
 * another device without any account or server. The file is the same shape the store
 * persists; a version field guards future migrations.
 */
export interface BackupFile {
  app: 'nitrox-academy';
  version: 1;
  exportedAt: string;
  data: Pick<ProgressState, 'settings' | 'lessonsCompleted' | 'lastVisited' | 'assessments' | 'attempts' | 'predictions' | 'achievements' | 'labVisits'>;
}

export function createBackup(): BackupFile {
  const s = useProgress.getState();
  return {
    app: 'nitrox-academy',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      settings: s.settings,
      lessonsCompleted: s.lessonsCompleted,
      lastVisited: s.lastVisited,
      assessments: s.assessments,
      attempts: s.attempts,
      predictions: s.predictions,
      achievements: s.achievements,
      labVisits: s.labVisits,
    },
  };
}

export function downloadBackup(): void {
  const blob = new Blob([JSON.stringify(createBackup(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nitrox-academy-progress-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Validates the file defensively: it is untrusted input. Unknown fields are dropped. */
export function parseBackup(text: string): BackupFile {
  const raw: unknown = JSON.parse(text);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('not an object');
  const b = raw as Partial<BackupFile>;
  if (b.app !== 'nitrox-academy' || b.version !== 1 || !b.data || typeof b.data !== 'object') throw new Error('not a Nitrox Academy backup');
  const d = b.data as Record<string, unknown>;
  const isObj = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v);
  if (!isObj(d.settings) || !isObj(d.lessonsCompleted) || !Array.isArray(d.assessments) || !Array.isArray(d.attempts)) {
    throw new Error('backup is incomplete');
  }
  const clean = sanitisePersisted(d) as BackupFile['data'];
  return {
    app: 'nitrox-academy',
    version: 1,
    exportedAt: typeof b.exportedAt === 'string' ? b.exportedAt : new Date().toISOString(),
    data: clean,
  };
}

export function restoreBackup(backup: BackupFile): void {
  useProgress.setState({ ...backup.data });
}
