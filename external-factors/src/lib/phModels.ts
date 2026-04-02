/**
 * pH-dependent enzyme kinetics models.
 *
 * Model 1 — Activity curve (two essential ionisable groups):
 *   EH₂⁺ ⇌ EH (active) ⇌ E⁻
 *   f_active(pH) = 1 / (1 + 10^(pKa1−pH) + 10^(pH−pKa2))
 *
 * Model 2 — Stability curve (double logistic):
 *   residual(pH) = sigmoid_acid × sigmoid_alkaline
 */

/** Fraction of enzyme in the catalytically active protonation state. */
export function activeF(pH: number, pKa1: number, pKa2: number): number {
  return 1 / (1 + Math.pow(10, pKa1 - pH) + Math.pow(10, pH - pKa2));
}

/** Apparent rate at a given pH. */
export function vApp(
  pH: number,
  pKa1: number,
  pKa2: number,
  vPrime: number,
): number {
  return vPrime * activeF(pH, pKa1, pKa2);
}

/** pH optimum (midpoint of the two pKa values). */
export function phOptimum(pKa1: number, pKa2: number): number {
  return (pKa1 + pKa2) / 2;
}

/**
 * Residual activity after pre-incubation at a given pH.
 * Uses two logistic functions for the acid and alkaline limits.
 */
export function stabilityF(
  pH: number,
  pKs1: number,
  pKs2: number,
  n1: number,
  n2: number,
): number {
  const acid = 1 / (1 + Math.pow(10, n1 * (pKs1 - pH)));
  const alk  = 1 / (1 + Math.pow(10, n2 * (pH - pKs2)));
  return acid * alk;
}

/* ---------- curve generators ---------- */

export interface CurvePoint { pH: number; value: number }

/** Generate the V_app vs pH curve. */
export function activityCurve(
  pKa1: number,
  pKa2: number,
  vPrime: number,
  nPoints = 300,
): CurvePoint[] {
  const pts: CurvePoint[] = [];
  for (let i = 0; i <= nPoints; i++) {
    const pH = (14 * i) / nPoints;
    pts.push({ pH, value: vApp(pH, pKa1, pKa2, vPrime) });
  }
  return pts;
}

/** Generate the stability vs pH curve. */
export function stabilityCurve(
  pKs1: number,
  pKs2: number,
  n1: number,
  n2: number,
  nPoints = 300,
): CurvePoint[] {
  const pts: CurvePoint[] = [];
  for (let i = 0; i <= nPoints; i++) {
    const pH = (14 * i) / nPoints;
    pts.push({ pH, value: stabilityF(pH, pKs1, pKs2, n1, n2) * 100 }); // %
  }
  return pts;
}
