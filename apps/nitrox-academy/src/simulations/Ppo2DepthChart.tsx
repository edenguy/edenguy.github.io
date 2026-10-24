import { useMemo } from 'react';
import { absolutePressure, mod, type DepthUnit } from '@/science';

/**
 * PPO2 versus depth for one or more mixes, with the planning limit and the 1.6 contingency
 * ceiling drawn as horizontal lines and the MOD of the primary mix marked. LTR always.
 */
export function Ppo2DepthChart({
  mixes,
  depth,
  maxDepth,
  units,
  limit,
  height = 220,
  labels,
}: {
  mixes: { fo2: number; color: string; label: string; primary?: boolean }[];
  depth: number;
  maxDepth: number;
  units: DepthUnit;
  limit: number;
  height?: number;
  labels: { depth: string; ppo2: string; mod: string; unit: string };
}) {
  const width = 520;
  const pad = { l: 44, r: 16, t: 14, b: 34 };
  const maxP = 2.0;
  const x = (d: number) => pad.l + (d / maxDepth) * (width - pad.l - pad.r);
  const y = (p: number) => pad.t + (1 - Math.min(p, maxP) / maxP) * (height - pad.t - pad.b);
  const primary = mixes.find((m) => m.primary) ?? mixes[0]!;
  const modDepth = mod(primary.fo2, limit, { unit: units, rounding: 'exact' });

  const paths = useMemo(
    () =>
      mixes.map((m) => {
        const pts: string[] = [];
        for (let d = 0; d <= maxDepth; d += maxDepth / 60) {
          const p = m.fo2 * absolutePressure(d, units);
          if (p > maxP) break;
          pts.push(`${x(d).toFixed(1)},${y(p).toFixed(1)}`);
        }
        return `M${pts.join(' L')}`;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mixes.map((m) => m.fo2).join(','), maxDepth, units],
  );

  const depthTick = units === 'm' ? 10 : 33;
  const depthTicks: number[] = [];
  for (let d = 0; d <= maxDepth; d += depthTick) depthTicks.push(d);
  const ppo2Ticks = [0.5, 1.0, 1.4, 1.6, 2.0];
  const currentP = primary.fo2 * absolutePressure(depth, units);

  return (
    <div dir="ltr" className="min-w-0">
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={labels.ppo2}>
      {/* zones */}
      <rect x={pad.l} y={y(limit)} width={width - pad.l - pad.r} height={y(0) - y(limit)} fill="var(--safe)" opacity={0.07} />
      <rect x={pad.l} y={y(1.6)} width={width - pad.l - pad.r} height={Math.max(0, y(limit) - y(1.6))} fill="var(--warn)" opacity={0.12} />
      <rect x={pad.l} y={pad.t} width={width - pad.l - pad.r} height={Math.max(0, y(1.6) - pad.t)} fill="var(--danger)" opacity={0.12} />
      {/* grid */}
      {ppo2Ticks.map((p) => (
        <g key={p}>
          <line x1={pad.l} x2={width - pad.r} y1={y(p)} y2={y(p)} stroke="var(--line)" strokeDasharray={p === limit || p === 1.6 ? undefined : '2 4'} />
          <text x={pad.l - 6} y={y(p) + 3.5} fontSize={10} textAnchor="end" fill="var(--muted)" fontFamily="var(--font-mono)">
            {p.toFixed(1)}
          </text>
        </g>
      ))}
      <line x1={pad.l} x2={width - pad.r} y1={y(limit)} y2={y(limit)} stroke="var(--warn)" strokeWidth={1.5} />
      <line x1={pad.l} x2={width - pad.r} y1={y(1.6)} y2={y(1.6)} stroke="var(--danger)" strokeWidth={1.5} />
      {depthTicks.map((d) => (
        <text key={d} x={x(d)} y={height - pad.b + 14} fontSize={10} textAnchor="middle" fill="var(--muted)" fontFamily="var(--font-mono)">
          {d}
        </text>
      ))}
      <text x={width - pad.r} y={height - 4} fontSize={10} textAnchor="end" fill="var(--muted)" fontFamily="var(--font-sans)">
        {labels.depth} ({labels.unit})
      </text>
      <text x={pad.l} y={pad.t - 3} fontSize={10} fill="var(--muted)" fontFamily="var(--font-sans)">
        {labels.ppo2} (ata)
      </text>
      {/* curves */}
      {mixes.map((m, i) => (
        <path key={`${m.fo2}-${i}`} d={paths[i]} fill="none" stroke={m.color} strokeWidth={m.primary ? 3 : 2} strokeDasharray={m.primary ? undefined : '6 5'} strokeLinecap="round" />
      ))}
      {/* MOD marker */}
      {modDepth <= maxDepth && (
        <g>
          <line x1={x(modDepth)} x2={x(modDepth)} y1={y(limit)} y2={y(0)} stroke="var(--warn)" strokeDasharray="3 3" />
          <rect x={x(modDepth) - 26} y={y(0) - 18} width={52} height={16} rx={6} fill="var(--warn)" />
          <text x={x(modDepth)} y={y(0) - 6} fontSize={9.5} fontWeight={700} textAnchor="middle" fill="#1a1200" fontFamily="var(--font-mono)">
            {labels.mod} {Math.floor(modDepth + 1e-9)}
          </text>
        </g>
      )}
      {/* current depth */}
      <line x1={x(depth)} x2={x(depth)} y1={pad.t} y2={y(0)} stroke="var(--ink)" opacity={0.25} />
      {currentP <= maxP && (
        <g transform={`translate(${x(depth)}, ${y(currentP)})`} style={{ transition: 'transform 160ms ease-out' }}>
          <circle r={9} fill={primary.color} opacity={0.25} />
          <circle r={5} fill={primary.color} stroke="var(--surface)" strokeWidth={2} />
        </g>
      )}
      {/* legend */}
      <g transform={`translate(${pad.l + 8}, ${height - pad.b - 10})`}>
        {mixes.map((m, i) => (
          <g key={`${m.fo2}-${i}`} transform={`translate(${i * 110}, 0)`}>
            <line x1={0} x2={18} y1={0} y2={0} stroke={m.color} strokeWidth={3} strokeDasharray={m.primary ? undefined : '6 5'} />
            <text x={24} y={3.5} fontSize={10} fill="var(--ink-2)" fontFamily="var(--font-sans)">
              {m.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
    </div>
  );
}
