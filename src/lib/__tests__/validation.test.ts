import { describe, expect, it } from 'vitest';
import {
  validateBatchForm,
  validateCSTRSeriesForm,
  validateContinuousForm,
  validateKineticParams,
} from '../validation';
import { SharedSimulatorInputs } from '../../types';

const shared: SharedSimulatorInputs = {
  kinetics: { Vmax: 1.0, KM: 0.5, useMechanistic: false },
  a_in: 1.0,
  v_dot: 1.0,
};

describe('validation helpers', () => {
  it('rejects asymptotic target conversions', () => {
    const messages = validateBatchForm(shared, {
      solveMode: 'inverse',
      t: 1,
      X_target: 1,
    });

    expect(messages.some((message) => message.includes('stay below 1'))).toBe(true);
  });

  it('rejects zero flow for continuous reactors', () => {
    const messages = validateContinuousForm(
      { ...shared, v_dot: 0 },
      { solveMode: 'forward', tau: 1, X_target: 0.5 },
    );

    expect(messages).toContain('Flow rate must be greater than zero.');
  });

  it('rejects empty or non-positive stage volumes', () => {
    const emptyMessages = validateCSTRSeriesForm(shared, { volumes: [] });
    const negativeMessages = validateCSTRSeriesForm(shared, { volumes: [1, -1] });

    expect(emptyMessages).toContain('At least one CSTR stage is required.');
    expect(negativeMessages).toContain('Every CSTR stage volume must be greater than zero.');
  });

  it('rejects invalid mechanistic kinetic parameters', () => {
    const messages = validateKineticParams({
      Vmax: 0,
      KM: 0,
      kcat: 0,
      e0: 0,
      useMechanistic: true,
    });

    expect(messages).toContain('KM must be greater than zero.');
    expect(messages).toContain('kcat must be greater than zero in mechanistic mode.');
    expect(messages).toContain('e0 must be greater than zero in mechanistic mode.');
  });
});
