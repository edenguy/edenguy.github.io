export function assertFinite(value: number, name: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number, got ${String(value)}`);
  }
}

export function assertRange(value: number, min: number, max: number, name: string): void {
  if (value < min || value > max) {
    throw new RangeError(`${name} must be between ${min} and ${max}, got ${value}`);
  }
}

/** Oxygen fractions the engine accepts: from hypoxic-ish 0.16 up to pure oxygen. */
export function assertFo2(fo2: number): void {
  assertFinite(fo2, 'fo2');
  assertRange(fo2, 0.16, 1.0, 'fo2');
}

export function assertPpo2(ppo2: number): void {
  assertFinite(ppo2, 'ppo2');
  assertRange(ppo2, 0.16, 3.0, 'ppo2');
}
