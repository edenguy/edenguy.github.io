import type { Chapter } from '@/content/schema';
import { Icon, type IconName } from './ui/Icon';

const map: Record<Chapter['icon'], IconName> = {
  intro: 'wave',
  physics: 'gauge',
  deco: 'clock',
  oxygen: 'atom',
  mod: 'target',
  analyzer: 'beaker',
  planning: 'book',
  equipment: 'tank',
  scenarios: 'sparkle',
  exam: 'trophy',
};

export function ChapterIcon({ icon, size = 22, className }: { icon: Chapter['icon']; size?: number; className?: string }) {
  return <Icon name={map[icon]} size={size} className={className} />;
}
