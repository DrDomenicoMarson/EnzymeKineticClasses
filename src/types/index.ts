export type SolveMode = 'forward' | 'inverse' | 'compare';
export type ReactorType = 'batch' | 'cstr' | 'pfr' | 'cstr-series';

export interface KineticParams {
  Vmax: number; // mol/(L·min)
  KM: number;   // mol/L
  kcat?: number; // 1/min (optional, used if mechanistic input is active)
  e0?: number;   // mol/L (optional, used if mechanistic input is active)
  useMechanistic: boolean;
}

export interface BaseReactorInput {
  kinetics: KineticParams;
}

export interface BatchInput extends BaseReactorInput {
  a0: number; // mol/L
  t?: number; // min (for forward solve)
  X_target?: number; // (for inverse solve)
}

export interface BatchOutput {
  a_final: number; // mol/L
  X: number;
  t: number; // min
  trajectory: { t: number; a: number; X: number }[];
}

export interface ContinuousInput extends BaseReactorInput {
  a_in: number; // mol/L
  v_dot: number; // L/min (throughput/flow rate)
  V?: number; // L (for forward solve)
  tau?: number; // min (for forward solve)
  X_target?: number; // (for inverse solve)
}

export interface ContinuousOutput {
  a_out: number; // mol/L
  X: number;
  V: number; // L
  tau: number; // min
}

export interface CSTRSeriesInput extends BaseReactorInput {
  a_in: number;
  v_dot: number;
  volumes: number[]; // Array of volumes for each stage
  X_target?: number; // If solving for equal volumes to reach X
}

export interface CSTRSeriesStageOutput {
  stage: number;
  V: number;
  a_out: number;
  X: number;
  tau: number;
}

export interface CSTRSeriesOutput {
  stages: CSTRSeriesStageOutput[];
  a_out_final: number;
  X_final: number;
  V_total: number;
  tau_total: number;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  kinetics: KineticParams;
  a_in: number;
  v_dot: number;
  target_X: number;
}
