import { ContinuousInput, ContinuousOutput } from '../../types';
import { rate } from '../kinetics/michaelisMenten';
import { bisection } from '../solvers/rootFinding';

/**
 * Computes required tau to reach target X in a perfectly mixed CSTR.
 * tau(X) = (a_in - a_out) / v(a_out)
 */
export function cstrTauForConversion(input: ContinuousInput, X_target: number): number {
  if (X_target <= 0) return 0;
  if (X_target >= 1) return Infinity;

  const a_in = input.a_in;
  const a_out = a_in * (1 - X_target);
  
  // Provide a_in as the 3rd argument for product inhibition to calculate correctly
  const currentRate = rate(a_out, input.kinetics, a_in);
  
  // If the rate is zero, it takes infinite time
  if (currentRate <= 0) return Infinity;

  return (a_in - a_out) / currentRate;
}

/**
 * Forward solve for a CSTR given an inlet and tau.
 * It solves the mass balance equation numerically for a_out using bisection:
 * f(a_out) = a_in - a_out - tau * v(a_out) = 0
 */
export function solveCSTRForward(input: ContinuousInput, tau: number): ContinuousOutput {
  const { a_in, v_dot, kinetics } = input;
  const V = tau * v_dot;

  if (tau <= 0) {
    return { a_out: a_in, X: 0, V: 0, tau: 0 };
  }

  // The objective function: f(a_out) = 0
  // Note: we must pass a_in to rate() to support Product Inhibition internally
  const objective = (a_out: number) => a_in - a_out - tau * rate(a_out, kinetics, a_in);

  // Use bisection to find the root between bounds [0, a_in]
  let a_out = bisection(objective, 0, a_in, 1e-7, 100);

  // Fallback to boundaries if solver fails
  if (a_out === null) {
      if (objective(0) > 0) a_out = 0; // The whole curve is positive
      else a_out = a_in; // The whole curve is negative
  }

  // Clamp non-physical precision noise
  if (a_out < 0) a_out = 0;
  if (a_out > a_in) a_out = a_in;

  const X = a_in > 0 ? (a_in - a_out) / a_in : 0;

  return { a_out, X, V, tau };
}

/**
 * Inverse solve for CSTR given a target X.
 */
export function solveCSTRInverse(input: ContinuousInput, X_target: number): ContinuousOutput {
  const X = Math.min(Math.max(X_target, 0), 0.999);
  const tau = cstrTauForConversion(input, X);
  const V = tau * input.v_dot;
  const a_out = input.a_in * (1 - X);

  return { a_out, X, V, tau };
}

/**
 * Compute trajectory of a_out vs tau for plotting
 */
export function generateCSTRCurve(input: ContinuousInput, max_tau: number, steps = 100) {
  const curve = [];
  const step = max_tau / steps;
  for (let i = 0; i <= steps; i++) {
    const tau = i * step;
    curve.push(solveCSTRForward(input, tau));
  }
  return curve;
}
