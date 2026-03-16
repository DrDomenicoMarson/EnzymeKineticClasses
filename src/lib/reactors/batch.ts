import { BatchInput, BatchOutput } from '../../types';
import { getVmax, rate } from '../kinetics/michaelisMenten';
import { rk4 } from '../solvers/rootFinding';

/**
 * Calculates the required time t to reach a target conversion X in a batch reactor.
 * 
 * Inverse solve based on slide design equation:
 * t(X) = (a0 * X) / Vmax + (KM / Vmax) * ln(1 / (1 - X))
 */
export function batchTimeForConversion(input: BatchInput, X_target: number): number {
  if (X_target <= 0) return 0;
  if (X_target >= 1) return Infinity; // Asymptotically infinite time

  const a0 = input.a0;
  const Vmax = getVmax(input.kinetics);
  const KM = input.kinetics.KM;

  const t = (a0 * X_target) / Vmax + (KM / Vmax) * Math.log(1 / (1 - X_target));
  return t;
}

/**
 * Solves the batch reactor forward trajectory given a final time t.
 * Uses numerical integration (RK4) on da/dt = -v(a) to get the trajectory.
 */
export function solveBatchForward(input: BatchInput, final_t: number, steps = 100): BatchOutput {
  const a0 = input.a0;
  
  if (final_t <= 0) {
    return {
      a_final: a0,
      X: 0,
      t: 0,
      trajectory: [{ t: 0, a: a0, X: 0 }]
    };
  }

  // da/dt = -v(a)
  const deriv = (_t: number, a: number) => {
    return -rate(a, input.kinetics);
  };

  const a_trajectory = rk4(deriv, a0, 0, final_t, steps);
  
  const trajectory = a_trajectory.map(pt => {
    // Avoid floating point slightly negative numbers close to zero
    const a = Math.max(0, pt.y);
    const X = a0 > 0 ? (a0 - a) / a0 : 0;
    return { t: pt.t, a, X };
  });

  const lastPt = trajectory[trajectory.length - 1];

  return {
    a_final: lastPt.a,
    X: lastPt.X,
    t: final_t,
    trajectory
  };
}

/**
 * Given a target conversion X, computes the full trajectory up to the required time.
 */
export function solveBatchInverse(input: BatchInput, X_target: number): BatchOutput {
  if (X_target <= 0) return solveBatchForward(input, 0);
  
  // If X is exactly 1, we cap it slightly to avoid plotting to infinity
  const effective_X = Math.min(X_target, 0.999);
  const t = batchTimeForConversion(input, effective_X);
  
  const output = solveBatchForward(input, t);
  // Ensure the final point matches exactly if needed, but normally RK4 is close enough
  output.X = X_target; 
  output.a_final = input.a0 * (1 - X_target);
  
  return output;
}
