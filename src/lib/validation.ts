import {
  BatchFormState,
  CSTRSeriesFormState,
  ContinuousFormState,
  KineticParams,
  SharedSimulatorInputs,
} from '../types';

/**
 * Validates the kinetic parameter block.
 *
 * @param kinetics The kinetic parameters to validate.
 * @returns Human-readable validation messages.
 */
export function validateKineticParams(kinetics: KineticParams): string[] {
  const messages: string[] = [];

  if (kinetics.KM <= 0) {
    messages.push('KM must be greater than zero.');
  }

  if (!kinetics.useMechanistic && kinetics.Vmax <= 0) {
    messages.push('Vmax must be greater than zero.');
  }

  if (kinetics.useMechanistic) {
    if ((kinetics.kcat ?? 0) <= 0) {
      messages.push('kcat must be greater than zero in mechanistic mode.');
    }

    if ((kinetics.e0 ?? 0) <= 0) {
      messages.push('e0 must be greater than zero in mechanistic mode.');
    }
  }

  return messages;
}

/**
 * Validates the inputs shared by continuous-reactor tabs.
 *
 * @param shared The shared simulator inputs to validate.
 * @returns Human-readable validation messages.
 */
export function validateSharedInputs(shared: SharedSimulatorInputs): string[] {
  const messages = validateKineticParams(shared.kinetics);

  if (shared.a_in < 0) {
    messages.push('Inlet concentration must be non-negative.');
  }

  if (shared.v_dot <= 0) {
    messages.push('Flow rate must be greater than zero.');
  }

  return messages;
}

/**
 * Validates the batch tab form.
 *
 * @param shared The shared simulator inputs.
 * @param state The batch form state.
 * @returns Human-readable validation messages.
 */
export function validateBatchForm(
  shared: SharedSimulatorInputs,
  state: BatchFormState,
): string[] {
  const messages = validateKineticParams(shared.kinetics);

  if (shared.a_in < 0) {
    messages.push('Initial concentration must be non-negative.');
  }

  if (state.solveMode === 'forward' && state.t < 0) {
    messages.push('Batch time must be non-negative.');
  }

  if (state.solveMode === 'inverse') {
    if (state.X_target < 0) {
      messages.push('Target conversion must be non-negative.');
    }

    if (state.X_target >= 1) {
      messages.push('Target conversion must stay below 1 because the required time diverges at X = 1.');
    }
  }

  return messages;
}

/**
 * Validates a continuous-reactor tab form.
 *
 * @param shared The shared simulator inputs.
 * @param state The continuous-reactor form state.
 * @returns Human-readable validation messages.
 */
export function validateContinuousForm(
  shared: SharedSimulatorInputs,
  state: ContinuousFormState,
): string[] {
  const messages = validateSharedInputs(shared);

  if (state.solveMode === 'forward' && state.tau < 0) {
    messages.push('Residence time must be non-negative.');
  }

  if (state.solveMode === 'inverse') {
    if (state.X_target < 0) {
      messages.push('Target conversion must be non-negative.');
    }

    if (state.X_target >= 1) {
      messages.push('Target conversion must stay below 1 because the required residence time diverges at X = 1.');
    }
  }

  return messages;
}

/**
 * Validates the CSTR-series form.
 *
 * @param shared The shared simulator inputs.
 * @param state The staged-reactor form state.
 * @returns Human-readable validation messages.
 */
export function validateCSTRSeriesForm(
  shared: SharedSimulatorInputs,
  state: CSTRSeriesFormState,
): string[] {
  const messages = validateSharedInputs(shared);

  if (state.volumes.length === 0) {
    messages.push('At least one CSTR stage is required.');
  }

  if (state.volumes.some((volume) => volume <= 0)) {
    messages.push('Every CSTR stage volume must be greater than zero.');
  }

  return messages;
}
