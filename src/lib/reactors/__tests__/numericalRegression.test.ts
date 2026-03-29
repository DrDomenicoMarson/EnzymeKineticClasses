import { describe, it, expect } from 'vitest';
import { batchTimeForConversion, solveBatchForward } from '../batch';
import { solveCSTRForward, cstrTauForConversion } from '../cstr';
import { solvePFRForward, pfrTauForConversion } from '../pfr';
import { KineticParams, BatchInput, ContinuousInput } from '../../../types';

/**
 * Regression tests: verify that the numerical solvers (bisection, trapezoidal, RK4)
 * produce answers matching the known analytical solutions for standard
 * (uninhibited) Michaelis-Menten kinetics. This ensures the transition
 * from algebraic to numerical did not introduce drift.
 */
describe('Numerical solver regression vs analytical', () => {
  const kinetics: KineticParams = { Vmax: 1.0, KM: 0.5, useMechanistic: false };
  const a_in = 1.0;
  const v_dot = 1.0;

  // Analytical batch time: t = (a0/Vmax)*X + (KM/Vmax)*ln(1/(1-X))
  function analyticalBatchTime(a0: number, Vmax: number, KM: number, X: number): number {
    return (a0 / Vmax) * X + (KM / Vmax) * Math.log(1 / (1 - X));
  }

  // Analytical PFR tau (same integral as batch for standard MM)
  function analyticalPfrTau(a_in: number, Vmax: number, KM: number, X: number): number {
    return analyticalBatchTime(a_in, Vmax, KM, X);
  }

  // Analytical CSTR tau: tau = (a_in - a_out) / v(a_out) = a_in*X / v(a_in*(1-X))
  function analyticalCstrTau(a_in: number, Vmax: number, KM: number, X: number): number {
    const a_out = a_in * (1 - X);
    const v_out = (Vmax * a_out) / (KM + a_out);
    if (v_out <= 0) return Infinity;
    return (a_in * X) / v_out;
  }

  describe('Batch solver', () => {
    const batchInput: BatchInput = { kinetics, a0: a_in };

    it.each([0.1, 0.3, 0.5, 0.7, 0.9, 0.95])('batchTimeForConversion matches analytical at X=%.2f', (X) => {
      const numerical = batchTimeForConversion(batchInput, X);
      const analytical = analyticalBatchTime(a_in, kinetics.Vmax, kinetics.KM, X);
      expect(numerical).toBeCloseTo(analytical, 3);
    });

    it('solveBatchForward reaches expected conversion', () => {
      const t = analyticalBatchTime(a_in, kinetics.Vmax, kinetics.KM, 0.7);
      const output = solveBatchForward(batchInput, t);
      expect(output.X).toBeCloseTo(0.7, 2);
    });
  });

  describe('CSTR solver', () => {
    const cstrInput: ContinuousInput = { kinetics, a_in, v_dot };

    it.each([0.1, 0.3, 0.5, 0.7, 0.9])('cstrTauForConversion matches analytical at X=%.2f', (X) => {
      const numerical = cstrTauForConversion(cstrInput, X);
      const analytical = analyticalCstrTau(a_in, kinetics.Vmax, kinetics.KM, X);
      expect(numerical).toBeCloseTo(analytical, 6);
    });

    it('solveCSTRForward at known tau gives expected conversion', () => {
      const tau = analyticalCstrTau(a_in, kinetics.Vmax, kinetics.KM, 0.7);
      const output = solveCSTRForward(cstrInput, tau);
      expect(output.X).toBeCloseTo(0.7, 4);
    });
  });

  describe('PFR solver', () => {
    const pfrInput: ContinuousInput = { kinetics, a_in, v_dot };

    it.each([0.1, 0.3, 0.5, 0.7, 0.9, 0.95])('pfrTauForConversion matches analytical at X=%.2f', (X) => {
      const numerical = pfrTauForConversion(pfrInput, X);
      const analytical = analyticalPfrTau(a_in, kinetics.Vmax, kinetics.KM, X);
      expect(numerical).toBeCloseTo(analytical, 3);
    });

    it('solvePFRForward at known tau gives expected conversion', () => {
      const tau = analyticalPfrTau(a_in, kinetics.Vmax, kinetics.KM, 0.7);
      const output = solvePFRForward(pfrInput, tau, 200);
      expect(output.X).toBeCloseTo(0.7, 2);
    });
  });

  describe('Cross-check: batch time = PFR tau for standard MM', () => {
    it.each([0.3, 0.5, 0.8])('at X=%.2f, batch t ≈ PFR τ', (X) => {
      const batchInput: BatchInput = { kinetics, a0: a_in };
      const pfrInput: ContinuousInput = { kinetics, a_in, v_dot };
      const batchT = batchTimeForConversion(batchInput, X);
      const pfrT = pfrTauForConversion(pfrInput, X);
      expect(batchT).toBeCloseTo(pfrT, 3);
    });
  });
});
