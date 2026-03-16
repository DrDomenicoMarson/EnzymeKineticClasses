import { describe, it, expect } from 'vitest';
import { solveCSTRForward, solveCSTRInverse, cstrTauForConversion } from '../cstr';
import { ContinuousInput } from '../../../types';

describe('CSTR Reactor', () => {
  const input: ContinuousInput = {
    a_in: 1.0,
    v_dot: 10,
    kinetics: { Vmax: 1.0, KM: 0.5, useMechanistic: false }
  };

  it('calculates correct tau for target conversion', () => {
    // X = 0.5 -> a_out = 0.5
    // tau = (a_in - a_out) / v(a_out)
    // v(0.5) = 1.0 * 0.5 / (0.5 + 0.5) = 0.5
    // tau = (1.0 - 0.5) / 0.5 = 1.0
    const tau = cstrTauForConversion(input, 0.5);
    expect(tau).toBeCloseTo(1.0, 4);
  });

  it('solves forward correctly', () => {
    const out = solveCSTRForward(input, 1.0);
    expect(out.a_out).toBeCloseTo(0.5, 4);
    expect(out.X).toBeCloseTo(0.5, 4);
  });

  it('solves inverse correctly', () => {
    const out = solveCSTRInverse(input, 0.5);
    expect(out.tau).toBeCloseTo(1.0, 4);
    expect(out.V).toBeCloseTo(10.0, 4);
  });
});
