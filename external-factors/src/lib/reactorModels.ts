/**
 * Reactor models with temperature-dependent enzyme kinetics.
 *
 * CSTR (steady-state):
 *   Substrate:  a_in − a = τ · V_max_eff · a / (K_M + a)
 *   Enzyme:     e = e_in / (1 + k_inact_eff · τ)
 *
 * PFR (plug-flow):
 *   da/dt' = −k_cat(T) · e(t') · a / (K_M + a)
 *   de/dt' = −k_inact_eff · e
 *   integrated numerically from t'=0 to τ
 */

import { kcat as kcatFn, kInact, keq } from './temperatureModels';

export interface ReactorInputs {
  K_M: number;      // mM
  a_in: number;     // mM
  e_in: number;     // arb. units
  tau: number;      // min  (converted → seconds internally)
  T: number;        // K
  dH_act: number;   // kJ/mol
  dS_act: number;   // J/(mol·K)
  dH_inact: number; // kJ/mol
  dS_inact: number; // J/(mol·K)
  dH_eq: number;    // kJ/mol
  T_eq: number;     // K
  useEquilibrium: boolean;
}

/* ------------------------------------------------------------------ */
/*  CSTR steady-state                                                 */
/* ------------------------------------------------------------------ */

export interface CSTRResult {
  a_out: number;     // mM
  conversion: number; // fraction
  e_ss: number;      // steady-state enzyme
}

export function solveCSTR(p: ReactorInputs): CSTRResult {
  const tauSec = p.tau * 60;
  const kc = kcatFn(p.T, p.dH_act, p.dS_act, false, 0, 298.15);
  const ki = kInact(p.T, p.dH_inact, p.dS_inact);

  let e_ss: number;
  let vMaxEff: number;

  if (p.useEquilibrium) {
    const Keq = keq(p.T, p.dH_eq, p.T_eq);
    const fAct = 1 / (1 + Keq);
    const effKi = ki * Keq / (1 + Keq);
    e_ss = p.e_in / (1 + effKi * tauSec);
    vMaxEff = kc * fAct * e_ss;
  } else {
    e_ss = p.e_in / (1 + ki * tauSec);
    vMaxEff = kc * e_ss;
  }

  // Quadratic: a² + (K_M + τ·VmaxEff − a_in)·a − a_in·K_M = 0
  const b = p.K_M + tauSec * vMaxEff - p.a_in;
  const c = -p.a_in * p.K_M;
  const disc = b * b - 4 * c;
  const a_out = Math.max(0, (-b + Math.sqrt(Math.max(0, disc))) / 2);
  const conversion = Math.max(0, Math.min(1, (p.a_in - a_out) / p.a_in));

  return { a_out, conversion, e_ss };
}

/* ------------------------------------------------------------------ */
/*  PFR (numerical integration via RK4)                               */
/* ------------------------------------------------------------------ */

export interface PFRResult {
  a_out: number;
  conversion: number;
  profile_a: number[];  // substrate along reactor
  profile_e: number[];  // enzyme along reactor
  profile_t: number[];  // time points
}

export function solvePFR(p: ReactorInputs, nSteps = 500): PFRResult {
  const tauSec = p.tau * 60;
  const dt = tauSec / nSteps;
  const kc = Math.min(kcatFn(p.T, p.dH_act, p.dS_act, false, 0, 298.15), 1e12);
  const ki = Math.min(kInact(p.T, p.dH_inact, p.dS_inact), 1e12);
  const Keq = p.useEquilibrium ? keq(p.T, p.dH_eq, p.T_eq) : 0;
  const fAct = p.useEquilibrium ? 1 / (1 + Keq) : 1;
  const effKi = p.useEquilibrium ? ki * Keq / (1 + Keq) : ki;

  let a = p.a_in;
  let e = p.e_in;

  const profile_a: number[] = [a];
  const profile_e: number[] = [e];
  const profile_t: number[] = [0];

  for (let i = 0; i < nSteps; i++) {
    // Use analytical enzyme decay for stability (exact solution for de/dt = -k*e)
    const e_new = p.e_in * Math.exp(-effKi * (i + 1) * dt);

    // Substrate: simple Euler with the average enzyme concentration over dt
    const e_mid = 0.5 * (e + e_new);
    const rate = kc * fAct * e_mid * a / (p.K_M + Math.max(a, 1e-30));
    a = Math.max(0, a - rate * dt);
    e = Math.max(0, e_new);

    // downsample for plotting
    if (i % 5 === 0 || i === nSteps - 1) {
      profile_a.push(a);
      profile_e.push(e);
      profile_t.push((i + 1) * dt);
    }
  }

  const conversion = Math.max(0, Math.min(1, (p.a_in - a) / p.a_in));
  return { a_out: a, conversion, profile_a, profile_e, profile_t };
}

/* ------------------------------------------------------------------ */
/*  Sweep helpers (for plotting conversion vs T, etc.)                */
/* ------------------------------------------------------------------ */

export interface SweepPoint { T_C: number; conversion: number; e_ss: number }

export function cstrTempSweep(
  base: ReactorInputs,
  tRange: [number, number] = [273.15, 373.15],
  nPoints = 100,
): SweepPoint[] {
  const pts: SweepPoint[] = [];
  for (let i = 0; i <= nPoints; i++) {
    const T = tRange[0] + (tRange[1] - tRange[0]) * i / nPoints;
    const res = solveCSTR({ ...base, T });
    pts.push({ T_C: T - 273.15, conversion: res.conversion, e_ss: res.e_ss });
  }
  return pts;
}

export function pfrTempSweep(
  base: ReactorInputs,
  tRange: [number, number] = [273.15, 373.15],
  nPoints = 100,
): SweepPoint[] {
  const pts: SweepPoint[] = [];
  for (let i = 0; i <= nPoints; i++) {
    const T = tRange[0] + (tRange[1] - tRange[0]) * i / nPoints;
    const res = solvePFR({ ...base, T }, 200);
    pts.push({ T_C: T - 273.15, conversion: res.conversion, e_ss: 0 });
  }
  return pts;
}
