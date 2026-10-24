import type { DepthUnit } from './constants';

export function formatPressure(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

export function formatPercent(fraction: number, decimals = 0): string {
  return `${(fraction * 100).toFixed(decimals)}%`;
}

export function formatDepth(value: number, unit: DepthUnit, decimals = 0): string {
  return `${value.toFixed(decimals)} ${unit}`;
}
