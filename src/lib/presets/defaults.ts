import { SimulatorState } from '../../types';

/**
 * Builds the simulator's default state.
 *
 * @returns The app state used by reset and initial render.
 */
export function createDefaultSimulatorState(): SimulatorState {
  return {
    shared: {
      kinetics: { Vmax: 1.0, KM: 0.5, kcat: 100, e0: 0.01, useMechanistic: false },
      a_in: 1.0,
      v_dot: 1.0,
    },
    batch: {
      solveMode: 'forward',
      t: 1.8,
      X_target: 0.7,
    },
    cstr: {
      solveMode: 'forward',
      tau: 1.8,
      X_target: 0.7,
    },
    pfr: {
      solveMode: 'forward',
      tau: 1.8,
      X_target: 0.7,
    },
    cstrSeries: {
      volumes: [0.6, 0.6, 0.6],
    },
  };
}
