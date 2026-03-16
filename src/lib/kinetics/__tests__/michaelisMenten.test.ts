import { describe, it, expect } from 'vitest';
import { getVmax, rate } from '../michaelisMenten';
import { KineticParams } from '../../../types';

describe('Michaelis-Menten Kinetics', () => {
  it('calculates Vmax directly when mechanistic is false', () => {
    const params: KineticParams = { Vmax: 5.0, KM: 1.0, kcat: 10, e0: 2, useMechanistic: false };
    expect(getVmax(params)).toBe(5.0);
  });

  it('calculates Vmax from kcat and e0 when mechanistic is true', () => {
    const params: KineticParams = { Vmax: 5.0, KM: 1.0, kcat: 10, e0: 2, useMechanistic: true };
    expect(getVmax(params)).toBe(20.0);
  });

  it('calculates rate properly', () => {
    const params: KineticParams = { Vmax: 10.0, KM: 2.0, useMechanistic: false };
    // at a = KM, v = Vmax / 2
    expect(rate(2.0, params)).toBe(5.0);
    // at a = 0, v = 0
    expect(rate(0, params)).toBe(0);
    // at large a, v approaches Vmax
    expect(rate(1000000, params)).toBeCloseTo(10.0, 1);
  });
});
