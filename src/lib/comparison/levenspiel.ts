import {
  ComparisonCurvePoint,
  CSTRSeriesInput,
  LevenspielAreaPolygon,
  LevenspielComparison,
  LevenspielPoint,
  NormalizedDecayPoint,
  ReactorPerformanceDatum,
} from '../../types';
import { cstrTauForConversion, solveCSTRForward } from '../reactors/cstr';
import {
  solveCSTRSeriesForward,
  solveScaledCSTRSeriesForTargetConversion,
} from '../reactors/cstrSeries';
import { pfrTauForConversion, solvePFRForward } from '../reactors/pfr';
import { rate } from '../kinetics/michaelisMenten';

const PFR_FILL = 'rgba(34, 197, 94, 0.28)';
const CSTR_FILL = 'rgba(239, 68, 68, 0.18)';
const SERIES_FILL = 'rgba(59, 130, 246, 0.12)';

/**
 * Generates the residence-time comparison curve over conversion.
 *
 * @param input The shared series input that defines kinetics, feed, and stage ratios.
 * @param maxConversion The largest conversion to include on the chart.
 * @param steps The number of curve intervals to generate.
 * @returns Comparison points for a single CSTR, a PFR, and the staged train.
 */
export function generateCharacteristicTimeCurve(
  input: CSTRSeriesInput,
  maxConversion = 0.98,
  steps = 60,
): ComparisonCurvePoint[] {
  const curve: ComparisonCurvePoint[] = [];

  for (let index = 0; index <= steps; index += 1) {
    const X = (index / steps) * maxConversion;
    const seriesOutput = solveScaledCSTRSeriesForTargetConversion(input, X);

    curve.push({
      X,
      cstrTau: cstrTauForConversion(
        { a_in: input.a_in, kinetics: input.kinetics, v_dot: input.v_dot },
        X,
      ),
      pfrTau: pfrTauForConversion(
        { a_in: input.a_in, kinetics: input.kinetics, v_dot: input.v_dot },
        X,
      ),
      seriesTau: seriesOutput?.tau_total ?? null,
    });
  }

  return curve;
}

/**
 * Generates normalized outlet-concentration decay curves on a fixed residence-time basis.
 *
 * @param input The shared series input that defines kinetics, feed, and stage ratios.
 * @param maxTau The largest residence time to include.
 * @param steps The number of curve intervals to generate.
 * @returns Normalized decay points for the current configuration.
 */
export function generateNormalizedDecayCurve(
  input: CSTRSeriesInput,
  maxTau: number,
  steps = 60,
): NormalizedDecayPoint[] {
  const curve: NormalizedDecayPoint[] = [];
  const baseTau =
    input.v_dot > 0
      ? input.volumes.reduce((sum, volume) => sum + volume, 0) / input.v_dot
      : 0;

  for (let index = 0; index <= steps; index += 1) {
    const tau = (index / steps) * maxTau;
    const cstrOutput = solveCSTRForward(
      { a_in: input.a_in, kinetics: input.kinetics, v_dot: input.v_dot },
      tau,
    );
    const pfrOutput = solvePFRForward(
      { a_in: input.a_in, kinetics: input.kinetics, v_dot: input.v_dot },
      tau,
    );
    const scaleFactor = baseTau > 0 ? tau / baseTau : 0;
    const seriesOutput = solveCSTRSeriesForward({
      ...input,
      volumes: input.volumes.map((volume) => volume * scaleFactor),
    });

    curve.push({
      tau,
      cstr: input.a_in > 0 ? cstrOutput.a_out / input.a_in : 0,
      pfr: input.a_in > 0 ? pfrOutput.a_out / input.a_in : 0,
      cstrSeries: input.a_in > 0 ? seriesOutput.a_out_final / input.a_in : null,
    });
  }

  return curve;
}

/**
 * Computes same-basis reactor performance data for the current staged configuration.
 *
 * @param input The current staged-reactor input.
 * @returns Summary rows for the staged train, a single CSTR, and a PFR.
 */
export function calculateEquivalentPerformance(
  input: CSTRSeriesInput,
  targetX?: number,
): ReactorPerformanceDatum[] {
  let seriesOutput;
  let cstrOutput;
  let pfrOutput;

  if (targetX !== undefined) {
    const safeTarget = Math.max(0, Math.min(targetX, 0.999));
    const targetAOut = input.a_in * (1 - safeTarget);
    
    seriesOutput = solveScaledCSTRSeriesForTargetConversion(input, safeTarget) ?? solveCSTRSeriesForward(input);
    
    const cstrTau = cstrTauForConversion({kinetics: input.kinetics, a_in: input.a_in, v_dot: input.v_dot}, safeTarget);
    cstrOutput = { a_out: targetAOut, X: safeTarget, tau: cstrTau };
    
    const pfrTau = pfrTauForConversion({kinetics: input.kinetics, a_in: input.a_in, v_dot: input.v_dot}, safeTarget);
    pfrOutput = { a_out: targetAOut, X: safeTarget, tau: pfrTau };
  } else {
    seriesOutput = solveCSTRSeriesForward(input);
    cstrOutput = solveCSTRForward(
      { a_in: input.a_in, kinetics: input.kinetics, v_dot: input.v_dot },
      seriesOutput.tau_total,
    );
    pfrOutput = solvePFRForward(
      { a_in: input.a_in, kinetics: input.kinetics, v_dot: input.v_dot },
      seriesOutput.tau_total,
    );
  }

  return [
    {
      label: 'CSTR Train',
      a_out: seriesOutput.a_out_final,
      X: seriesOutput.X_final,
      tau: seriesOutput.tau_total,
    },
    {
      label: 'Single CSTR',
      a_out: cstrOutput.a_out,
      X: cstrOutput.X,
      tau: cstrOutput.tau,
    },
    {
      label: 'PFR',
      a_out: pfrOutput.a_out,
      X: pfrOutput.X,
      tau: pfrOutput.tau,
    },
  ];
}

/**
 * Builds the Levenspiel geometry for the currently configured design basis.
 *
 * @param input The current staged-reactor input.
 * @returns Curve and area polygons for the compare tab.
 */
export function buildLevenspielComparison(
  input: CSTRSeriesInput,
  targetX?: number,
): LevenspielComparison {
  let seriesOutput;
  let pfrOut: number;
  let cstrOut: number;

  if (targetX !== undefined) {
    const safeTarget = Math.max(0, Math.min(targetX, 0.999));
    const targetAOut = input.a_in * (1 - safeTarget);
    seriesOutput = solveScaledCSTRSeriesForTargetConversion(input, safeTarget) ?? solveCSTRSeriesForward(input);
    pfrOut = targetAOut;
    cstrOut = targetAOut;
  } else {
    seriesOutput = solveCSTRSeriesForward(input);
    cstrOut = solveCSTRForward(
      { a_in: input.a_in, kinetics: input.kinetics, v_dot: input.v_dot },
      seriesOutput.tau_total,
    ).a_out;
    pfrOut = solvePFRForward(
      { a_in: input.a_in, kinetics: input.kinetics, v_dot: input.v_dot },
      seriesOutput.tau_total,
    ).a_out;
  }

  return {
    curve: generateLevenspielCurve(input, Math.max(input.a_in, 1), 140),
    pfrArea: buildPfrArea(input, pfrOut, input.a_in),
    cstrArea: buildRectangleArea(
      'Single CSTR',
      cstrOut,
      input.a_in,
      reciprocalRateAt(input, cstrOut),
      CSTR_FILL,
      '#ef4444',
    ),
    cstrSeriesAreas: seriesOutput.stages.map((stage, index) =>
      buildRectangleArea(
        `Stage ${index + 1}`,
        stage.a_out,
        stage.a_in,
        reciprocalRateAt(input, stage.a_out),
        SERIES_FILL,
        '#2563eb',
      ),
    ),
  };
}

/**
 * Generates the reciprocal-rate curve used in a Levenspiel plot.
 *
 * @param input The current staged-reactor input.
 * @param maxConcentration The maximum concentration to show on the x-axis.
 * @param steps The number of curve intervals to generate.
 * @returns The reciprocal-rate curve points.
 */
export function generateLevenspielCurve(
  input: CSTRSeriesInput,
  maxConcentration: number,
  steps = 120,
): LevenspielPoint[] {
  const curve: LevenspielPoint[] = [];
  const safeMaxConcentration = Math.max(maxConcentration, input.a_in, input.kinetics.KM, 1);

  for (let index = 0; index <= steps; index += 1) {
    const a = (index / steps) * safeMaxConcentration;
    const currentRate = rate(Math.max(a, 1e-6), input.kinetics, input.a_in);
    curve.push({
      a,
      reciprocalRate: currentRate > 0 ? 1 / currentRate : Number.POSITIVE_INFINITY,
    });
  }

  return curve;
}

/**
 * Computes the reciprocal rate at a substrate concentration.
 *
 * @param input The current staged-reactor input.
 * @param concentration The substrate concentration.
 * @returns The reciprocal rate, capped at positive infinity where needed.
 */
export function reciprocalRateAt(
  input: CSTRSeriesInput,
  concentration: number,
): number {
  const safeConcentration = Math.max(concentration, 1e-6);
  const currentRate = rate(safeConcentration, input.kinetics, input.a_in);

  if (currentRate <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return 1 / currentRate;
}

/**
 * Builds the filled polygon that visualizes the PFR integral area.
 *
 * @param input The current staged-reactor input.
 * @param outletConcentration The outlet concentration for the PFR on the chosen basis.
 * @param inletConcentration The inlet concentration.
 * @returns The polygon representing the PFR area.
 */
export function buildPfrArea(
  input: CSTRSeriesInput,
  outletConcentration: number,
  inletConcentration: number,
): LevenspielAreaPolygon {
  const samples = 320;
  const x: number[] = [];
  const y: number[] = [];

  for (let index = 0; index <= samples; index += 1) {
    const a =
      outletConcentration +
      ((inletConcentration - outletConcentration) * index) / samples;
    x.push(a);
    y.push(reciprocalRateAt(input, a));
  }

  return {
    label: 'PFR Integral',
    x: [...x, inletConcentration, outletConcentration],
    y: [...y, 0, 0],
    fillColor: PFR_FILL,
    lineColor: '#22c55e',
  };
}

/**
 * Builds a rectangle polygon used for a CSTR or a single CSTR stage in a Levenspiel plot.
 *
 * @param label The label to associate with the polygon.
 * @param outletConcentration The rectangle's left x-bound.
 * @param inletConcentration The rectangle's right x-bound.
 * @param reciprocalRateValue The rectangle height.
 * @param fillColor The polygon fill color.
 * @param lineColor The polygon line color.
 * @returns The rectangle polygon definition.
 */
export function buildRectangleArea(
  label: string,
  outletConcentration: number,
  inletConcentration: number,
  reciprocalRateValue: number,
  fillColor: string,
  lineColor: string,
): LevenspielAreaPolygon {
  return {
    label,
    x: [
      outletConcentration,
      inletConcentration,
      inletConcentration,
      outletConcentration,
      outletConcentration,
    ],
    y: [0, 0, reciprocalRateValue, reciprocalRateValue, 0],
    fillColor,
    lineColor,
  };
}
