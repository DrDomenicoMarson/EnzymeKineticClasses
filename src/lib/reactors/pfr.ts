import { ContinuousInput, ContinuousOutput } from '../../types';
import { getVmax, rate } from '../kinetics/michaelisMenten';
import { rk4 } from '../solvers/rootFinding';

/**
 * Computes required tau to reach target X in a PFR.
 * tau(X) = (a_in/Vmax) * X + (KM/Vmax) * ln(1/(1-X))
 */
export function pfrTauForConversion(input: ContinuousInput, X_target: number): number {
  if (X_target <= 0) return 0;
  if (X_target >= 1) return Infinity; 

  const a_in = input.a_in;
  const Vmax = getVmax(input.kinetics);
  const KM = input.kinetics.KM;

  const tau = (a_in / Vmax) * X_target + (KM / Vmax) * Math.log(1 / (1 - X_target));
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
    return -rate(a, input.kinetics);
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
  // Use RK4 to get the whole curve in one go, much faster
  const a_in = input.a_in;
  const v_dot = input.v_dot;

  if (max_tau <= 0) {
    const pt = { a_out: a_in, X: 0, V: 0, tau: 0 };
    return [pt, pt];
  }

  const deriv = (_t: number, a: number) => {
    return -rate(a, input.kinetics);
  };

  const a_trajectory = rk4(deriv, a_in, 0, max_tau, steps);
  
  return a_trajectory.map(pt => {
    const a_out = Math.max(0, pt.y);
    const X = a_in > 0 ? (a_in - a_out) / a_in : 0;
    const V = pt.t * v_dot;
    return { a_out, X, V, tau: pt.t };
  });
}
