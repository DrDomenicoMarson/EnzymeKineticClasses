import { describe, it, expect } from 'vitest';
import { rate, getVmax } from '../michaelisMenten';
import { KineticParams } from '../../../types';

describe('Michaelis-Menten Kinetics', () => {
  // ── Existing tests ──
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
    expect(rate(2.0, params)).toBe(5.0);
    expect(rate(0, params)).toBe(0);
    expect(rate(1000000, params)).toBeCloseTo(10.0, 1);
  });

  // ── Inhibition tests ──
  describe('Competitive Inhibition', () => {
    const base: KineticParams = {
      Vmax: 10, KM: 5, useMechanistic: false,
      inhibitionType: 'competitive', K_I_c: 2, i_0: 4,
    };

    it('Vmax unchanged, KM_app increases with inhibitor', () => {
      // KM_app = KM * (1 + i/Ki_c) = 5 * (1 + 4/2) = 15
      // At a = KM_app = 15: v = Vmax * 15 / (15 + 15) = 5
      expect(rate(15, base)).toBeCloseTo(5.0, 4);
    });

    it('at large a, rate approaches base Vmax', () => {
      // Competitive inhibition doesn't change Vmax
      expect(rate(1e6, base)).toBeCloseTo(10.0, 1);
    });

    it('is slower than uninhibited at moderate a', () => {
      const uninhibited: KineticParams = { Vmax: 10, KM: 5, useMechanistic: false };
      const a = 10;
      expect(rate(a, base)).toBeLessThan(rate(a, uninhibited));
    });
  });

  describe('Uncompetitive Inhibition', () => {
    const base: KineticParams = {
      Vmax: 10, KM: 5, useMechanistic: false,
      inhibitionType: 'uncompetitive', K_I_u: 2, i_0: 4,
    };

    it('both Vmax and KM decrease proportionally', () => {
      // denom = 1 + i/Ki_u = 1 + 4/2 = 3
      // Vmax_app = 10/3, KM_app = 5/3
      // At a = KM_app = 5/3: v = (10/3) * (5/3) / (5/3 + 5/3) = (10/3)/2 = 5/3
      expect(rate(5 / 3, base)).toBeCloseTo(5 / 3, 3);
    });

    it('at large a, rate approaches Vmax_app < Vmax', () => {
      // Uncompetitive lowers Vmax_app = 10/3 ≈ 3.333
      expect(rate(1e6, base)).toBeCloseTo(10 / 3, 1);
    });
  });

  describe('Non-competitive (Mixed) Inhibition', () => {
    const base: KineticParams = {
      Vmax: 10, KM: 5, useMechanistic: false,
      inhibitionType: 'non-competitive', K_I_c: 2, K_I_u: 4, i_0: 4,
    };

    it('uses both K_I_c and K_I_u', () => {
      // factor_u = 1 + 4/4 = 2, factor_c = 1 + 4/2 = 3
      // Vmax_app = 10/2 = 5, KM_app = 5 * 3/2 = 7.5
      // At a = 7.5: v = 5 * 7.5 / (7.5 + 7.5) = 2.5
      expect(rate(7.5, base)).toBeCloseTo(2.5, 4);
    });

    it('at large a, rate approaches Vmax/factor_u', () => {
      expect(rate(1e6, base)).toBeCloseTo(5.0, 1);
    });
  });

  describe('Substrate Inhibition', () => {
    const base: KineticParams = {
      Vmax: 10, KM: 5, useMechanistic: false,
      inhibitionType: 'substrate', K_I_u: 20,
    };

    it('rate decreases at very high substrate (self-inhibiting)', () => {
      // At a = 100: denom = 1 + 100/20 = 6
      // Vmax_app = 10/6, KM_app = 5/6
      // v = (10/6) * 100 / (5/6 + 100) ≈ 1.656
      const vHigh = rate(100, base);
      const vMod = rate(10, base);
      expect(vHigh).toBeLessThan(vMod); // Self-inhibition: rate drops at high a
    });

    it('shows bell-shaped behavior', () => {
      // Rate increases then decreases
      const v1 = rate(1, base);
      const vPeak = rate(10, base);
      const v100 = rate(100, base);
      expect(vPeak).toBeGreaterThan(v1);
      expect(vPeak).toBeGreaterThan(v100);
    });
  });

  describe('Product Competitive Inhibition', () => {
    const base: KineticParams = {
      Vmax: 10, KM: 5, useMechanistic: false,
      inhibitionType: 'product_competitive', K_I_c: 5,
    };
    const a_in = 50;

    it('inhibitor concentration is p = a_in - a', () => {
      // At a = 10, p = 40. KM_app = 5*(1 + 40/5) = 45
      // v = 10 * 10 / (45 + 10) = 100/55 ≈ 1.818
      expect(rate(10, base, a_in)).toBeCloseTo(100 / 55, 3);
    });

    it('at high conversion (low a), product penalty is maximal', () => {
      const noInhibition: KineticParams = { Vmax: 10, KM: 5, useMechanistic: false };
      const a = 5;
      expect(rate(a, base, a_in)).toBeLessThan(rate(a, noInhibition));
    });

    it('at inlet (a = a_in), product is zero so no inhibition effect', () => {
      const noInhibition: KineticParams = { Vmax: 10, KM: 5, useMechanistic: false };
      expect(rate(a_in, base, a_in)).toBeCloseTo(rate(a_in, noInhibition), 6);
    });
  });

  describe('Edge cases', () => {
    it('returns 0 for negative concentration', () => {
      const params: KineticParams = { Vmax: 10, KM: 5, useMechanistic: false };
      expect(rate(-1, params)).toBe(0);
    });

    it('works with inhibitionType = none (no change)', () => {
      const params: KineticParams = {
        Vmax: 10, KM: 5, useMechanistic: false,
        inhibitionType: 'none', K_I_c: 2, K_I_u: 2, i_0: 100,
      };
      // Should give standard MM rate: 10*5/(5+5) = 5
      expect(rate(5, params)).toBe(5.0);
    });
  });
});
