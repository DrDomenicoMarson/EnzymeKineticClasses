import { Preset, SimulatorState } from '../../types';

/**
 * The stable identifier for the simulator's reset/default preset.
 */
export const DEFAULT_PRESET_ID = 'intermediate-s';

/**
 * The curated classroom presets required by the teaching app specification.
 */
export const defaultPresets: Preset[] = [
  {
    id: 'low-s',
    name: 'Low a_in / KM',
    description:
      'A low-substrate regime where Michaelis-Menten behavior approaches first-order kinetics.',
    kinetics: { Vmax: 1.0, KM: 5.0, kcat: 100, e0: 0.01, useMechanistic: false },
    a_in: 0.1,
    v_dot: 1.0,
    batchTime: 4.5,
    tau: 4.5,
    target_X: 0.75,
    cstrSeriesVolumes: [1, 1, 1, 1],
  },
  {
    id: 'intermediate-s',
    name: 'Intermediate a_in / KM',
    description:
      'A balanced classroom default where saturation and first-order behavior are both visible.',
    kinetics: { Vmax: 1.0, KM: 0.5, kcat: 100, e0: 0.01, useMechanistic: false },
    a_in: 1.0,
    v_dot: 1.0,
    batchTime: 1.8,
    tau: 1.8,
    target_X: 0.7,
    cstrSeriesVolumes: [0.6, 0.6, 0.6],
  },
  {
    id: 'high-s',
    name: 'High a_in / KM',
    description:
      'A saturated regime where the rate is close to zero-order and concentration decays almost linearly.',
    kinetics: { Vmax: 1.0, KM: 0.02, kcat: 100, e0: 0.01, useMechanistic: false },
    a_in: 2.0,
    v_dot: 1.0,
    batchTime: 1.2,
    tau: 1.2,
    target_X: 0.6,
    cstrSeriesVolumes: [0.4, 0.4, 0.4],
  },
  {
    id: 'cstr-vs-pfr',
    name: 'Single CSTR vs PFR',
    description:
      'A high-conversion comparison that makes the CSTR penalty obvious on a fixed residence-time basis.',
    kinetics: { Vmax: 1.0, KM: 0.5, kcat: 100, e0: 0.01, useMechanistic: false },
    a_in: 2.0,
    v_dot: 1.0,
    batchTime: 4.0,
    tau: 4.0,
    target_X: 0.95,
    cstrSeriesVolumes: [1, 1, 1, 1],
    preferredTab: 'compare',
  },
  {
    id: 'cstr-series',
    name: 'CSTR Train Approaching PFR',
    description:
      'An equal-volume staged train used to show how more ideal CSTR stages approach plug-flow behavior.',
    kinetics: { Vmax: 1.0, KM: 0.5, kcat: 100, e0: 0.01, useMechanistic: false },
    a_in: 2.0,
    v_dot: 1.0,
    batchTime: 3.5,
    tau: 3.5,
    target_X: 0.9,
    cstrSeriesVolumes: [0.8, 0.8, 0.8, 0.8],
    preferredTab: 'cstr-series',
  },
  {
    id: 'unequal-cstr-series',
    name: 'Unequal CSTR Train',
    description:
      'A non-uniform train that encourages discussion of how stage sizing changes the final performance.',
    kinetics: { Vmax: 1.0, KM: 0.5, kcat: 100, e0: 0.01, useMechanistic: false },
    a_in: 2.0,
    v_dot: 1.0,
    batchTime: 3.5,
    tau: 3.5,
    target_X: 0.9,
    cstrSeriesVolumes: [0.4, 0.8, 1.0, 1.3],
    preferredTab: 'cstr-series',
  },
];

/**
 * Returns a preset by identifier, falling back to the default preset.
 *
 * @param presetId The preset identifier to look up.
 * @returns The matching preset, or the default preset if no match exists.
 */
export function getPresetById(presetId: string): Preset {
  return (
    defaultPresets.find((preset) => preset.id === presetId) ??
    defaultPresets.find((preset) => preset.id === DEFAULT_PRESET_ID) ??
    defaultPresets[0]
  );
}

/**
 * Builds a complete simulator state from a preset.
 *
 * @param preset The preset to convert into UI state.
 * @returns The initialized simulator state for that preset.
 */
export function createSimulatorStateFromPreset(preset: Preset): SimulatorState {
  return {
    selectedPresetId: preset.id,
    shared: {
      kinetics: { ...preset.kinetics },
      a_in: preset.a_in,
      v_dot: preset.v_dot,
    },
    batch: {
      solveMode: 'forward',
      t: preset.batchTime,
      X_target: preset.target_X,
    },
    cstr: {
      solveMode: 'forward',
      tau: preset.tau,
      X_target: preset.target_X,
    },
    pfr: {
      solveMode: 'forward',
      tau: preset.tau,
      X_target: preset.target_X,
    },
    cstrSeries: {
      volumes: [...preset.cstrSeriesVolumes],
    },
  };
}

/**
 * Builds the simulator's default state.
 *
 * @returns The app state used by reset and initial render.
 */
export function createDefaultSimulatorState(): SimulatorState {
  return createSimulatorStateFromPreset(getPresetById(DEFAULT_PRESET_ID));
}
