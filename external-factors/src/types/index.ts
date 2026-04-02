/* ------------------------------------------------------------------ */
/*  Shared types for the External Factors Explorer                    */
/* ------------------------------------------------------------------ */

export type TabId = 'ph' | 'temperature' | 'reactor';

/* ---------- pH models ---------- */

export interface PhActivityParams {
  pKa1: number;   // lower pKa
  pKa2: number;   // upper pKa
  vPrime: number;  // intrinsic V' (arbitrary units)
}

export interface PhStabilityParams {
  pKs1: number;   // acid stability limit
  pKs2: number;   // alkaline stability limit
  n1: number;     // steepness acid side
  n2: number;     // steepness alkaline side
}

export interface PhPreset {
  name: string;
  activity: PhActivityParams;
  stability: PhStabilityParams;
  description: string;
}

/* ---------- Temperature models ---------- */

export type CatalyticModel = 'eyring' | 'mmrt';
export type InactivationModel = 'classical' | 'equilibrium' | 'both';

export interface TemperatureParams {
  /* catalytic acceleration (Eyring) — kJ/mol & J/(mol·K) */
  dH_act: number;
  dS_act: number;
  /* MMRT extension */
  catalyticModel: CatalyticModel;
  dCp_act: number;  // kJ/(mol·K)
  T_ref: number;    // K
  /* thermal inactivation (Eyring for denaturation) — kJ/mol & J/(mol·K) */
  dH_inact: number;
  dS_inact: number;
  /* equilibrium model */
  inactivationModel: InactivationModel;
  dH_eq: number;    // kJ/mol
  T_eq: number;     // K
  /* observation */
  e0: number;       // arbitrary units
  time: number;     // seconds
}

export interface TemperaturePreset {
  name: string;
  params: Partial<TemperatureParams>;
  description: string;
}

/* ---------- Reactor models ---------- */

export interface ReactorParams {
  K_M: number;      // mM
  a_in: number;     // mM
  e_in: number;     // arbitrary units
  tau: number;      // min
  T: number;        // K (operating temperature)
  /* Temperature-dependent kinetics (reuses TemperatureParams) */
  dH_act: number;
  dS_act: number;
  dH_inact: number;
  dS_inact: number;
  dH_eq: number;
  T_eq: number;
  useEquilibrium: boolean;
}
