import { describe, it, expect } from 'vitest';
import {
  solveCSTRSeriesForward,
  solveScaledCSTRSeriesForTargetConversion,
} from '../cstrSeries';
import { CSTRSeriesInput } from '../../../types';

describe('CSTR Series Reactor', () => {
  const input: CSTRSeriesInput = {
    a_in: 1.0,
    v_dot: 10,
    volumes: [10, 10, 10], // tau = 1 per stage, total tau = 3
    kinetics: { Vmax: 1.0, KM: 0.5, useMechanistic: false }
  };

  it('solves multiple stages', () => {
    const out = solveCSTRSeriesForward(input);
    expect(out.stages.length).toBe(3);
    
    // Stage 1 is X=0.5, a_out=0.5
    expect(out.stages[0].a_out).toBeCloseTo(0.5, 4);
    expect(out.stages[0].X).toBeCloseTo(0.5, 4);
    
    // Subsquent stages should decrease a_out further
    expect(out.stages[1].a_out).toBeLessThan(0.5);
    expect(out.stages[2].a_out).toBeLessThan(out.stages[1].a_out);

    expect(out.V_total).toBe(30);
    expect(out.tau_total).toBe(3);
    expect(out.a_out_final).toBe(out.stages[2].a_out);
  });

  it('scales a fixed-ratio train to reach a target conversion', () => {
    const out = solveScaledCSTRSeriesForTargetConversion(input, 0.8);

    expect(out).not.toBeNull();
    expect(out?.X_final ?? 0).toBeCloseTo(0.8, 4);
    expect(out?.tau_total ?? 0).toBeGreaterThan(0);
  });
});
