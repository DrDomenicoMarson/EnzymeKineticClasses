import { describe, it, expect } from 'vitest';
import { solvePFRForward, solvePFRInverse, pfrTauForConversion } from '../pfr';
import { ContinuousInput } from '../../../types';

describe('PFR Reactor', () => {
  const input: ContinuousInput = {
    a_in: 1.0,
    v_dot: 10,
    kinetics: { Vmax: 1.0, KM: 0.5, useMechanistic: false }
  };

  it('calculates correct tau for target conversion', () => {
    // X = 0.5 -> tau = (1.0*0.5)/1.0 + (0.5/1.0)*ln(1/0.5)
    // tau = 0.5 + 0.5 * ln(2) ~ 0.5 + 0.5 * 0.693 = 0.8465
    const tau = pfrTauForConversion(input, 0.5);
    expect(tau).toBeCloseTo(0.8465, 3);
  });

  it('solves forward correctly', () => {
    const tau = pfrTauForConversion(input, 0.5);
    const out = solvePFRForward(input, tau);
    expect(out.a_out).toBeCloseTo(0.5, 2);
    expect(out.X).toBeCloseTo(0.5, 2);
  });

  it('solves inverse correctly', () => {
    const out = solvePFRInverse(input, 0.5);
    expect(out.tau).toBeCloseTo(0.8465, 3);
    expect(out.a_out).toBeCloseTo(0.5, 4);
  });

  it('PFR is faster than CSTR for same X', () => {
    // decreasing rate kinetics means PFR should be smaller than CSTR tau for same X
    const pfrTau = pfrTauForConversion(input, 0.9);
    // CSTR tau for X=0.9
    // tau = (1.0*0.9)/1.0 + (0.5/1.0)*(0.9/0.1) = 0.9 + 4.5 = 5.4
    expect(pfrTau).toBeLessThan(5.4);
  });
});
