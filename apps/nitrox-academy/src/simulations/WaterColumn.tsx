import { useCallback, useRef, type PointerEvent } from 'react';
import type { DepthUnit } from '@/science';

export interface ColumnMarker {
  depth: number;
  label: string;
  color: string;
  dashed?: boolean;
}

export interface ColumnBand {
  from: number;
  to: number;
  color: string;
}

/**
 * Vertical water column with a draggable diver. Depth increases downward.
 * Always rendered LTR; labels are translated by the caller.
 */
export function WaterColumn({
  depth,
  maxDepth,
  units,
  onChange,
  markers = [],
  bands = [],
  width = 150,
  height = 360,
  tickEvery,
  surfaceLabel,
  unitLabel,
}: {
  depth: number;
  maxDepth: number;
  units: DepthUnit;
  onChange?: (d: number) => void;
  markers?: ColumnMarker[];
  bands?: ColumnBand[];
  width?: number;
  height?: number;
  tickEvery?: number;
  surfaceLabel: string;
  unitLabel: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const top = 28;
  const bottom = height - 16;
  const y = (d: number) => top + (Math.min(d, maxDepth) / maxDepth) * (bottom - top);
  const step = tickEvery ?? (units === 'm' ? 10 : 33);

  const dragging = useRef(false);
  const fromEvent = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      const el = ref.current;
      if (!el || !onChange) return;
      const rect = el.getBoundingClientRect();
      const py = ((e.clientY - rect.top) / rect.height) * height;
      const d = ((py - top) / (bottom - top)) * maxDepth;
      onChange(Math.round(Math.max(0, Math.min(maxDepth, d))));
    },
    [onChange, height, bottom, maxDepth],
  );

  const ticks: number[] = [];
  for (let d = 0; d <= maxDepth; d += step) ticks.push(d);

  return (
    <div dir="ltr" className="shrink-0">
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="select-none touch-none"
      style={{ cursor: onChange ? 'ns-resize' : 'default' }}
      onPointerDown={(e) => {
        if (!onChange) return;
        dragging.current = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        fromEvent(e);
      }}
      onPointerMove={(e) => dragging.current && fromEvent(e)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
      role="img"
      aria-label={`${depth} ${unitLabel}`}
    >
      <defs>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--n2)" stopOpacity="0.35" />
          <stop offset="60%" stopColor="var(--n2)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#04101f" stopOpacity="0.95" />
        </linearGradient>
        <clipPath id="column-clip">
          <rect x={44} y={top} width={width - 52} height={bottom - top} rx={14} />
        </clipPath>
      </defs>
      {/* sky */}
      <rect x={44} y={6} width={width - 52} height={top - 6} rx={10} fill="var(--accent-soft)" />
      <text x={width / 2 + 18} y={20} fontSize={10} textAnchor="middle" fill="var(--muted)" fontFamily="var(--font-sans)">
        {surfaceLabel}
      </text>
      {/* water */}
      <rect x={44} y={top} width={width - 52} height={bottom - top} rx={14} fill="url(#water)" />
      <g clipPath="url(#column-clip)">
        {bands.map((b, i) => (
          <rect key={i} x={44} y={y(b.from)} width={width - 52} height={Math.max(0, y(b.to) - y(b.from))} fill={b.color} />
        ))}
        {/* light shafts */}
        <path d={`M60 ${top} l16 0 l-10 ${(bottom - top) * 0.55} l-14 0 Z`} fill="white" opacity={0.05} />
        <path d={`M98 ${top} l12 0 l-6 ${(bottom - top) * 0.4} l-10 0 Z`} fill="white" opacity={0.04} />
      </g>
      {/* surface wave */}
      <path
        d={`M44 ${top} q 8 -5 16 0 t 16 0 t 16 0 t 16 0 t 16 0 t 16 0 t 16 0`}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        opacity={0.9}
      />
      {/* ticks */}
      {ticks.map((d) => (
        <g key={d}>
          <line x1={38} x2={44} y1={y(d)} y2={y(d)} stroke="var(--line-strong)" />
          <text x={34} y={y(d) + 4} fontSize={10} textAnchor="end" fill="var(--muted)" fontFamily="var(--font-mono)">
            {d}
          </text>
        </g>
      ))}
      {/* markers (MOD etc.) */}
      {markers
        .filter((m) => m.depth >= 0 && m.depth <= maxDepth)
        .map((m, i) => (
          <g key={i}>
            <line
              x1={44}
              x2={width - 8}
              y1={y(m.depth)}
              y2={y(m.depth)}
              stroke={m.color}
              strokeWidth={2}
              strokeDasharray={m.dashed ? '5 4' : undefined}
            />
            <rect x={width - 8 - 46} y={y(m.depth) - 18} width={46} height={16} rx={6} fill={m.color} />
            <text x={width - 8 - 23} y={y(m.depth) - 6} fontSize={9.5} fontWeight={700} textAnchor="middle" fill="#fff" fontFamily="var(--font-mono)">
              {m.label}
            </text>
          </g>
        ))}
      {/* diver */}
      <g transform={`translate(${width / 2 + 18}, ${y(depth)})`} style={{ transition: 'transform 180ms cubic-bezier(.2,.8,.2,1)' }}>
        <circle r={14} fill="var(--accent)" opacity={0.25} className="anim-pulse-ring" />
        <circle r={9} fill="var(--surface)" stroke="var(--accent)" strokeWidth={2.5} />
        <circle r={3.5} fill="var(--accent)" />
        {/* bubbles */}
        <circle cx={10} cy={-12} r={1.8} fill="white" opacity={0.6} />
        <circle cx={13} cy={-19} r={1.3} fill="white" opacity={0.45} />
        <rect x={-60} y={-11} width={44} height={22} rx={8} fill="var(--surface)" stroke="var(--line-strong)" />
        <text x={-38} y={4} fontSize={11} fontWeight={700} textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-mono)">
          {depth} {unitLabel}
        </text>
      </g>
    </svg>
    </div>
  );
}
