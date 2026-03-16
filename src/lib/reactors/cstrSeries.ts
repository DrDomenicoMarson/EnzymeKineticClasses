import { CSTRSeriesInput, CSTRSeriesOutput, CSTRSeriesStageOutput } from '../../types';
import { solveCSTRForward } from './cstr';

/**
 * Solves N cascaded CSTR stages with arbitrary volumes in series.
 */
export function solveCSTRSeriesForward(input: CSTRSeriesInput): CSTRSeriesOutput {
  const v_dot = input.v_dot;
  const stagesOutput: CSTRSeriesStageOutput[] = [];
  
  let current_a_in = input.a_in;
  let V_total = 0;
  let tau_total = 0;

  for (let i = 0; i < input.volumes.length; i++) {
    const V_stage = input.volumes[i];
    const tau_stage = V_stage / v_dot;
    
    // Create stage input implicitly assuming same kinetics and flow rate
    const stageInput = {
      kinetics: input.kinetics,
      a_in: current_a_in,
      v_dot: v_dot
    };

    const cstrOut = solveCSTRForward(stageInput, tau_stage);
    
    // We want the conversion to be overall from a_in, not stage local
    const overall_X_stage = input.a_in > 0 ? (input.a_in - cstrOut.a_out) / input.a_in : 0;
    
    V_total += V_stage;
    tau_total += tau_stage;

    stagesOutput.push({
      stage: i + 1,
      V: V_stage,
      a_out: cstrOut.a_out,
      X: overall_X_stage,
      tau: tau_stage
    });

    current_a_in = cstrOut.a_out;
  }

  const final_a_out = stagesOutput.length > 0 ? stagesOutput[stagesOutput.length - 1].a_out : input.a_in;
  const final_X = input.a_in > 0 ? (input.a_in - final_a_out) / input.a_in : 0;

  return {
    stages: stagesOutput,
    a_out_final: final_a_out,
    X_final: final_X,
    V_total,
    tau_total
  };
}
