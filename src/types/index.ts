/**
 * Application operating mode for the hub routing.
 */
export type AppMode = 'hub' | 'standard' | 'inhibition';

/**
 * The available top-level tabs in the simulator UI.
 */
export type TabId =
  | 'overview'
  | 'batch'
  | 'cstr'
  | 'pfr'
  | 'cstr-series'
  | 'compare';

/**
 * The supported solve modes for a reactor input form.
 */
export type SolveMode = 'forward' | 'inverse';

/**
 * The supported reactor families in the simulator.
 */
export type ReactorType = 'batch' | 'cstr' | 'pfr' | 'cstr-series';

/**
 * Supported inhibition types.
 */
export type InhibitionType =
  | 'none'
  | 'competitive'
  | 'uncompetitive'
  | 'non-competitive'
  | 'substrate'
  | 'product_competitive'
  | 'product_uncompetitive'
  | 'product_non-competitive';

/**
 * Kinetic parameters for the Michaelis-Menten rate law.
 */
export interface KineticParams {
  Vmax: number;
  KM: number;
  kcat?: number;
  e0?: number;
  useMechanistic: boolean;
  inhibitionType?: InhibitionType;
  K_I_c?: number; // Competitive inhibition/dissociation constant
  K_I_u?: number; // Uncompetitive inhibition/dissociation constant
  i_0?: number;   // Impurity inhibitor concentration
}

/**
 * Shared feed and kinetic inputs used by multiple reactor tabs.
 */
export interface SharedSimulatorInputs {
  kinetics: KineticParams;
  a_in: number;
  v_dot: number;
}

/**
 * UI state for the batch reactor form.
 */
export interface BatchFormState {
  solveMode: SolveMode;
  t: number;
  X_target: number;
}

/**
 * UI state for a continuous-reactor form.
 */
export interface ContinuousFormState {
  solveMode: SolveMode;
  tau: number;
  X_target: number;
}

/**
 * UI state for the CSTR-series form.
 */
export interface CSTRSeriesFormState {
  volumes: number[];
}

/**
 * The complete shared simulator state held by the app shell.
 */
export interface SimulatorState {
  shared: SharedSimulatorInputs;
  batch: BatchFormState;
  cstr: ContinuousFormState;
  pfr: ContinuousFormState;
  cstrSeries: CSTRSeriesFormState;
}

/**
 * State for the dedicated Inhibition Hub single-page dashboard.
 */
export interface InhibitionState {
  shared: SharedSimulatorInputs;
  cstrSeries: CSTRSeriesFormState;
  compareMode: 'fixed_tau' | 'target_conversion';
}

/**
 * Shared base contract for reactor solver inputs.
 */
export interface BaseReactorInput {
  kinetics: KineticParams;
}

/**
 * Inputs for the batch reactor model.
 */
export interface BatchInput extends BaseReactorInput {
  a0: number;
  t?: number;
  X_target?: number;
}

/**
 * A trajectory point for the batch reactor.
 */
export interface BatchTrajectoryPoint {
  t: number;
  a: number;
  X: number;
}

/**
 * Outputs from the batch reactor model.
 */
export interface BatchOutput {
  a_final: number;
  X: number;
  t: number;
  trajectory: BatchTrajectoryPoint[];
}

/**
 * Inputs for CSTR and PFR models.
 */
export interface ContinuousInput extends BaseReactorInput {
  a_in: number;
  v_dot: number;
  V?: number;
  tau?: number;
  X_target?: number;
}

/**
 * Outputs from a continuous reactor model.
 */
export interface ContinuousOutput {
  a_out: number;
  X: number;
  V: number;
  tau: number;
}

/**
 * Inputs for a train of ideal CSTR stages in series.
 */
export interface CSTRSeriesInput extends BaseReactorInput {
  a_in: number;
  v_dot: number;
  volumes: number[];
  X_target?: number;
}

/**
 * Per-stage results for a CSTR series calculation.
 */
export interface CSTRSeriesStageOutput {
  stage: number;
  V: number;
  a_in: number;
  a_out: number;
  X: number;
  X_stage: number;
  tau: number;
  tau_cumulative: number;
}

/**
 * Aggregate results for a CSTR train.
 */
export interface CSTRSeriesOutput {
  stages: CSTRSeriesStageOutput[];
  a_out_final: number;
  X_final: number;
  V_total: number;
  tau_total: number;
}

/**
 * Chart-ready profile point for the staged reactor visualization.
 */
export interface CSTRSeriesProfilePoint {
  stage: number;
  tauStart: number;
  tauEnd: number;
  aIn: number;
  aOut: number;
  overallConversion: number;
  stageConversion: number;
}

/**
 * A single point on the residence-time versus conversion comparison chart.
 */
export interface ComparisonCurvePoint {
  X: number;
  cstrTau: number;
  pfrTau: number;
  seriesTau: number | null;
}

/**
 * A single point on a normalized decay comparison curve.
 */
export interface NormalizedDecayPoint {
  tau: number;
  cstr: number;
  pfr: number;
  cstrSeries: number | null;
}

/**
 * A point on a Levenspiel curve.
 */
export interface LevenspielPoint {
  a: number;
  reciprocalRate: number;
}

/**
 * A fill polygon used to visualize a Levenspiel area.
 */
export interface LevenspielAreaPolygon {
  label: string;
  x: number[];
  y: number[];
  fillColor: string;
  lineColor: string;
}

/**
 * Bundle of Levenspiel geometry for a fixed design basis.
 */
export interface LevenspielComparison {
  curve: LevenspielPoint[];
  pfrArea: LevenspielAreaPolygon;
  cstrArea: LevenspielAreaPolygon;
  cstrSeriesAreas: LevenspielAreaPolygon[];
}

/**
 * A summary row used to compare multiple reactor performances at the same basis.
 */
export interface ReactorPerformanceDatum {
  label: string;
  a_out: number;
  X: number;
  tau: number;
}

