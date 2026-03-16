import { describe, expect, it } from 'vitest';
import {
  buildLevenspielComparison,
  calculateEquivalentPerformance,
  generateCharacteristicTimeCurve,
} from '../levenspiel';
import { CSTRSeriesInput, LevenspielAreaPolygon } from '../../../types';
import { cstrTauForConversion, solveCSTRForward } from '../../reactors/cstr';
import { solveCSTRSeriesForward } from '../../reactors/cstrSeries';
import { pfrTauForConversion, solvePFRForward } from '../../reactors/pfr';

const input: CSTRSeriesInput = {
  a_in: 2.0,
  v_dot: 1.0,
  volumes: [0.8, 0.8, 0.8, 0.8],
  kinetics: { Vmax: 1.0, KM: 0.5, useMechanistic: false },
};

/**
 * Computes a polygon area with the shoelace formula.
 *
 * @param polygon The polygon to evaluate.
 * @returns The absolute enclosed area.
 */
function polygonArea(polygon: LevenspielAreaPolygon): number {
  let area = 0;

  for (let index = 0; index < polygon.x.length; index += 1) {
    const nextIndex = (index + 1) % polygon.x.length;
    area += polygon.x[index] * polygon.y[nextIndex] - polygon.x[nextIndex] * polygon.y[index];
  }

  return Math.abs(area) / 2;
}

describe('comparison helpers', () => {
  it('produces a monotonic series time curve versus conversion', () => {
    const curve = generateCharacteristicTimeCurve(input, 0.95, 30);

    for (let index = 1; index < curve.length; index += 1) {
      expect((curve[index].seriesTau ?? 0) >= (curve[index - 1].seriesTau ?? 0)).toBe(true);
    }
  });

  it('preserves the expected reactor ordering for decreasing-rate kinetics', () => {
    const basis = solveCSTRSeriesForward(input);
    const cstr = solveCSTRForward(
      { a_in: input.a_in, v_dot: input.v_dot, kinetics: input.kinetics },
      basis.tau_total,
    );
    const pfr = solvePFRForward(
      { a_in: input.a_in, v_dot: input.v_dot, kinetics: input.kinetics },
      basis.tau_total,
    );

    expect(pfr.X).toBeGreaterThanOrEqual(basis.X_final);
    expect(basis.X_final).toBeGreaterThanOrEqual(cstr.X);
  });

  it('matches Levenspiel areas to the corresponding residence times', () => {
    const basis = solveCSTRSeriesForward(input);
    const cstr = solveCSTRForward(
      { a_in: input.a_in, v_dot: input.v_dot, kinetics: input.kinetics },
      basis.tau_total,
    );
    const pfr = solvePFRForward(
      { a_in: input.a_in, v_dot: input.v_dot, kinetics: input.kinetics },
      basis.tau_total,
    );
    const comparison = buildLevenspielComparison(input);

    expect(polygonArea(comparison.cstrArea)).toBeCloseTo(
      cstrTauForConversion(
        { a_in: input.a_in, v_dot: input.v_dot, kinetics: input.kinetics },
        cstr.X,
      ),
      2,
    );
    expect(
      comparison.cstrSeriesAreas.reduce((sum, polygon) => sum + polygonArea(polygon), 0),
    ).toBeCloseTo(basis.tau_total, 2);
    expect(polygonArea(comparison.pfrArea)).toBeCloseTo(
      pfrTauForConversion(
        { a_in: input.a_in, v_dot: input.v_dot, kinetics: input.kinetics },
        pfr.X,
      ),
      1,
    );
  });

  it('returns same-basis performance rows for all compared reactors', () => {
    const performance = calculateEquivalentPerformance(input);

    expect(performance).toHaveLength(3);
    expect(performance[0].label).toBe('CSTR Train');
    expect(performance[1].label).toBe('Single CSTR');
    expect(performance[2].label).toBe('PFR');
  });
});
