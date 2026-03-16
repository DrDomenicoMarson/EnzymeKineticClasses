import { describe, it, expect } from 'vitest';
import { solveBatchForward, solveBatchInverse, batchTimeForConversion } from '../batch';
import { BatchInput } from '../../../types';

describe('Batch Reactor', () => {
  const input: BatchInput = {
    a0: 10, // high a0 for zero order check
    kinetics: { Vmax: 2.0, KM: 0.1, useMechanistic: false }
  };

  it('calculates correct time for target conversion', () => {
    // X = 0.5 -> a = 5
    // Near zero order: t ~ (a0 - a) / Vmax = 5 / 2 = 2.5
    const t = batchTimeForConversion(input, 0.5);
    expect(t).toBeCloseTo(2.5, 1);
  });

  it('solves forward trajectory correctly', () => {
    const t = batchTimeForConversion(input, 0.5);
    const out = solveBatchForward(input, t);
    expect(out.X).toBeCloseTo(0.5, 2);
    expect(out.a_final).toBeCloseTo(5.0, 2);
  });

  it('solves inverse correctly', () => {
    const out = solveBatchInverse(input, 0.5);
    expect(out.X).toBe(0.5);
    expect(out.a_final).toBeCloseTo(5.0, 4);
    expect(out.t).toBeCloseTo(2.5, 1);
  });
});
