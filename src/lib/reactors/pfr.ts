import { ContinuousInput, ContinuousOutput } from '../../types';
import { rate } from '../kinetics/michaelisMenten';
import { rk4 } from '../solvers/rootFinding';

/**
 * Computes required tau to reach target X in a PFR numerically.
 * tau = integral_{a_out}^{a_in} 1/v(a) da
 */
export function pfrTauForConversion(input: ContinuousInput, X_target: number): number {
  if (X_target <= 0) return 0;
  if (X_target >= 1) return Infinity; 

  const a_in = input.a_in;
  const a_out = a_in * (1 - X_target);
  
  // Numerical integration (Trapezoidal rule)
  let tau = 0;
  const steps = 1000;
  const da = (a_in - a_out) / steps;
  
  for (let i = 0; i < steps; i++) {
    const a1 = a_out + i * da;
    const a2 = a_out + (i + 1) * da;
    const v1 = rate(a1, input.kinetics, a_in);
    const v2 = rate(a2, input.kinetics, a_in);
    
    if (v1 > 0 && v2 > 0) {
      tau += 0.5 * (1/v1 + 1/v2) * da;
    } else {
      return Infinity;
    }
  }

  return tau;
}

/**
 * Forward solve for PFR given an inlet and tau.
 * It solves da/dtau = -v(a) by integrating from tau=0 to target tau.
 */
export function solvePFRForward(input: ContinuousInput, tau: number, steps = 100): ContinuousOutput {
  const a_in = input.a_in;
  const v_dot = input.v_dot;
  const V = tau * v_dot;

  if (tau <= 0) {
    return { a_out: a_in, X: 0, V: 0, tau: 0 };
  }

  // da/dtau = -v(a)
  const deriv = (_t: number, a: number) => {
    return -rate(a, input.kinetics, a_in); // Explicitly pass a_in for product inhibition
  };

  const a_trajectory = rk4(deriv, a_in, 0, tau, steps);
  const lastPt = a_trajectory[a_trajectory.length - 1];
  
  const a_out = Math.max(0, lastPt.y);
  const X = a_in > 0 ? (a_in - a_out) / a_in : 0;

  return { a_out, X, V, tau };
}

/**
 * Inverse solve for PFR given a target X.
 */
export function solvePFRInverse(input: ContinuousInput, X_target: number): ContinuousOutput {
  const X = Math.min(Math.max(X_target, 0), 0.999);
  const tau = pfrTauForConversion(input, X);
  const V = tau * input.v_dot;
  const a_out = input.a_in * (1 - X);

  return { a_out, X, V, tau };
}

/**
 * Compute trajectory of a_out vs tau for plotting
 */
export function generatePFRCurve(input: ContinuousInput, max_tau: number, steps = 100) {
  const a_in = input.a_in;
  const v_dot = input.v_dot;

  if (max_tau <= 0) {
    const pt = { a_out: a_in, X: 0, V: 0, tau: 0 };
    return [pt, pt];
  }

  const deriv = (_t: number, a: number) => {
    return -rate(a, input.kinetics, a_in); // Explicitly pass a_in
  };

  const a_trajectory = rk4(deriv, a_in, 0, max_tau, steps);
  
  return a_trajectory.map(pt => {
    const a_out = Math.max(0, pt.y);
    const X = a_in > 0 ? (a_in - a_out) / a_in : 0;
    const V = pt.t * v_dot;
    return { a_out, X, V, tau: pt.t };
  });
}
