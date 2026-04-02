/**
 * Temperature-dependent enzyme kinetics models.
 *
 * 1. Eyring-Polanyi:  k_cat = (kB·T/h) exp(−ΔG‡_act / RT)
 *    with ΔG‡ = ΔH‡ − T·ΔS‡
 *
 * 2. MMRT (macromolecular rate theory):
 *    ΔH‡(T) = ΔH‡₀ + ΔCp‡(T−T₀)
 *    ΔS‡(T) = ΔS‡₀ + ΔCp‡ ln(T/T₀)
 *
 * 3. Classical inactivation:  E_active → X  (first-order, rate k_inact)
 *    V_max(t,T) = k_cat(T)·e₀·exp(−k_inact(T)·t)
 *
 * 4. Equilibrium model:  E_act ⇌ E_inact → X
 *    K_eq(T) = exp( ΔH_eq/R (1/T_eq − 1/T) )
 *    V_max(t,T) = k_cat·(1/(1+K_eq))·e₀·exp(−k_inact·K_eq/(1+K_eq)·t)
 *
 * Units convention:
 *   ΔH‡ in kJ/mol  (converted → J/mol internally with ×1000)
 *   ΔS‡ in J/(mol·K)
 *   ΔCp‡ in kJ/(mol·K)
 */

import { R, kB_over_h } from './constants';

/* ------------------------------------------------------------------ */
/*  Catalytic rate constant                                           */
/* ------------------------------------------------------------------ */

/** Standard Eyring k_cat (s⁻¹). dH in kJ/mol, dS in J/(mol·K). */
export function eyringKcat(T: number, dH: number, dS: number): number {
  const dG = dH * 1000 - T * dS; // J/mol
  return kB_over_h * T * Math.exp(-dG / (R * T));
}

/** MMRT k_cat. dH₀, dCp in kJ/mol(·K), dS₀ in J/(mol·K). */
export function mmrtKcat(
  T: number,
  dH0: number,
  dS0: number,
  dCp: number,
  Tref: number,
): number {
  const dH = dH0 * 1000 + dCp * 1000 * (T - Tref); // J/mol
  const dS = dS0 + dCp * 1000 * Math.log(T / Tref);  // J/(mol·K)
  const dG = dH - T * dS;
  return kB_over_h * T * Math.exp(-dG / (R * T));
}

/** Dispatch to the appropriate k_cat model. */
export function kcat(
  T: number,
  dH: number,
  dS: number,
  useMMRT: boolean,
  dCp: number,
  Tref: number,
): number {
  return useMMRT ? mmrtKcat(T, dH, dS, dCp, Tref) : eyringKcat(T, dH, dS);
}

/* ------------------------------------------------------------------ */
/*  Inactivation rate constant                                        */
/* ------------------------------------------------------------------ */

/** First-order inactivation rate constant (s⁻¹). */
export function kInact(T: number, dH: number, dS: number): number {
  const dG = dH * 1000 - T * dS;
  return kB_over_h * T * Math.exp(-dG / (R * T));
}

/* ------------------------------------------------------------------ */
/*  Equilibrium model                                                 */
/* ------------------------------------------------------------------ */

/** Keq for the active ⇌ inactive equilibrium. dH_eq in kJ/mol. */
export function keq(T: number, dH_eq: number, T_eq: number): number {
  return Math.exp((dH_eq * 1000 / R) * (1 / T_eq - 1 / T));
}

/** Fraction of enzyme in the active form (equilibrium model). */
export function fActive(T: number, dH_eq: number, T_eq: number): number {
  return 1 / (1 + keq(T, dH_eq, T_eq));
}

/* ------------------------------------------------------------------ */
/*  Composite V_max(t, T)                                             */
/* ------------------------------------------------------------------ */

export interface VmaxInputs {
  dH_act: number;
  dS_act: number;
  useMMRT: boolean;
  dCp_act: number;
  T_ref: number;
  dH_inact: number;
  dS_inact: number;
  dH_eq: number;
  T_eq: number;
  e0: number;
}

/** Classical model: V_max = k_cat·e₀·exp(−k_inact·t). */
export function vmaxClassical(T: number, t: number, p: VmaxInputs): number {
  const kc = kcat(T, p.dH_act, p.dS_act, p.useMMRT, p.dCp_act, p.T_ref);
  const ki = kInact(T, p.dH_inact, p.dS_inact);
  return kc * p.e0 * Math.exp(-ki * t);
}

/** Equilibrium model: V_max = k_cat · f_act · e₀ · exp(…). */
export function vmaxEquilibrium(T: number, t: number, p: VmaxInputs): number {
  const kc = kcat(T, p.dH_act, p.dS_act, p.useMMRT, p.dCp_act, p.T_ref);
  const Keq = keq(T, p.dH_eq, p.T_eq);
  const fa = 1 / (1 + Keq);
  const ki = kInact(T, p.dH_inact, p.dS_inact);
  const effectiveKi = ki * Keq / (1 + Keq);
  return kc * fa * p.e0 * Math.exp(-effectiveKi * t);
}
