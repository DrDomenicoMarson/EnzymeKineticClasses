import {
  CSTRSeriesInput,
  CSTRSeriesOutput,
  CSTRSeriesProfilePoint,
  CSTRSeriesStageOutput,
} from '../../types';
import { bisection } from '../solvers/rootFinding';
import { solveCSTRForward } from './cstr';

/**
 * Solves a train of ideal CSTRs with arbitrary stage volumes.
 *
 * @param input The CSTR-series input definition.
 * @returns The staged outlet profile and the total train performance.
 */
export function solveCSTRSeriesForward(input: CSTRSeriesInput): CSTRSeriesOutput {
  if (input.v_dot <= 0 || input.volumes.length === 0) {
    return {
      stages: [],
      a_out_final: input.a_in,
      X_final: 0,
      V_total: 0,
      tau_total: 0,
    };
  }

  const stagesOutput: CSTRSeriesStageOutput[] = [];
  let currentAIn = input.a_in;
  let totalVolume = 0;
  let cumulativeTau = 0;

  input.volumes.forEach((stageVolume, stageIndex) => {
    const stageTau = stageVolume / input.v_dot;
    const stageInput = {
      kinetics: input.kinetics,
      a_in: currentAIn,
      v_dot: input.v_dot,
    };
    const stageOutput = solveCSTRForward(stageInput, stageTau);
    const overallConversion =
      input.a_in > 0 ? (input.a_in - stageOutput.a_out) / input.a_in : 0;
    const stageConversion =
      currentAIn > 0 ? (currentAIn - stageOutput.a_out) / currentAIn : 0;

    totalVolume += stageVolume;
    cumulativeTau += stageTau;

    stagesOutput.push({
      stage: stageIndex + 1,
      V: stageVolume,
      a_in: currentAIn,
      a_out: stageOutput.a_out,
      X: overallConversion,
      X_stage: stageConversion,
      tau: stageTau,
      tau_cumulative: cumulativeTau,
    });

    currentAIn = stageOutput.a_out;
  });

  const finalAOut =
    stagesOutput.length > 0
      ? stagesOutput[stagesOutput.length - 1].a_out
      : input.a_in;
  const finalConversion =
    input.a_in > 0 ? (input.a_in - finalAOut) / input.a_in : 0;

  return {
    stages: stagesOutput,
    a_out_final: finalAOut,
    X_final: finalConversion,
    V_total: totalVolume,
    tau_total: cumulativeTau,
  };
}

/**
 * Converts a staged-reactor output into chart-friendly profile segments.
 *
 * @param output The staged-reactor result to transform.
 * @returns Profile points covering each CSTR stage.
 */
export function generateCSTRSeriesProfile(
  output: CSTRSeriesOutput,
): CSTRSeriesProfilePoint[] {
  return output.stages.map((stage) => ({
    stage: stage.stage,
    tauStart: stage.tau_cumulative - stage.tau,
    tauEnd: stage.tau_cumulative,
    aIn: stage.a_in,
    aOut: stage.a_out,
    overallConversion: stage.X,
    stageConversion: stage.X_stage,
  }));
}

/**
 * Scales a set of stage volumes by a common factor.
 *
 * @param volumes The original stage volumes.
 * @param scaleFactor The multiplicative factor to apply.
 * @returns A scaled copy of the stage-volume array.
 */
export function scaleSeriesVolumes(
  volumes: number[],
  scaleFactor: number,
): number[] {
  return volumes.map((volume) => volume * scaleFactor);
}

/**
 * Solves for the common scale factor needed for a fixed-ratio CSTR train to hit a target conversion.
 *
 * @param input The baseline series input containing the original stage-volume ratios.
 * @param targetConversion The desired overall conversion.
 * @param tolerance The tolerance used by the root finder.
 * @returns The solved train output at the required scale, or null when the target is invalid.
 */
export function solveScaledCSTRSeriesForTargetConversion(
  input: CSTRSeriesInput,
  targetConversion: number,
  tolerance = 1e-6,
): CSTRSeriesOutput | null {
  if (
    targetConversion < 0 ||
    targetConversion >= 1 ||
    input.v_dot <= 0 ||
    input.volumes.length === 0
  ) {
    return null;
  }

  if (targetConversion === 0) {
    return solveCSTRSeriesForward({ ...input, volumes: scaleSeriesVolumes(input.volumes, 0) });
  }

  const objective = (scaleFactor: number) =>
    solveCSTRSeriesForward({
      ...input,
      volumes: scaleSeriesVolumes(input.volumes, scaleFactor),
    }).X_final - targetConversion;

  let upperBound = 1;
  let objectiveAtUpperBound = objective(upperBound);

  while (objectiveAtUpperBound < 0 && upperBound < 1e6) {
    upperBound *= 2;
    objectiveAtUpperBound = objective(upperBound);
  }

  if (objectiveAtUpperBound < 0) {
    return null;
  }

  const scaleFactor = bisection(objective, 0, upperBound, tolerance, 200);

  if (scaleFactor === null) {
    return null;
  }

  return solveCSTRSeriesForward({
    ...input,
    volumes: scaleSeriesVolumes(input.volumes, scaleFactor),
  });
}
