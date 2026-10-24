import type { InteractiveId } from '@/content/schema';
import { GasCompositionExplorer } from './GasCompositionExplorer';
import { DepthPpo2Explorer } from './DepthPpo2Explorer';
import { PressureColumn } from './PressureColumn';
import { ModCalculator } from './ModCalculator';
import { ModExplorer } from './ModExplorer';
import { AirVsNitrox } from './AirVsNitrox';
import { EadExplorer } from './EadExplorer';

/** Content refers to simulations by id; this registry maps ids to components. */
export function Interactive({ component, props }: { component: InteractiveId; props?: Record<string, unknown> }) {
  const p = (props ?? {}) as Record<string, never>;
  switch (component) {
    case 'gas-composition':
      return <GasCompositionExplorer {...p} />;
    case 'depth-ppo2':
      return <DepthPpo2Explorer {...p} />;
    case 'pressure-column':
      return <PressureColumn {...p} />;
    case 'mod-calculator':
      return <ModCalculator {...p} />;
    case 'mod-explorer':
      return <ModExplorer {...p} />;
    case 'air-vs-nitrox':
      return <AirVsNitrox {...p} />;
    case 'ead-explorer':
      return <EadExplorer {...p} />;
  }
}
