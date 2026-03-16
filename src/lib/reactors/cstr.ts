import { ContinuousInput, ContinuousOutput } from '../../types';
import { getVmax } from '../kinetics/michaelisMenten';


/**
 * Computes required tau to reach target X in a perfectly mixed CSTR.
 * tau(X) = (a_in/Vmax) * X + (KM/Vmax) * (X / (1-X))
 */
export function cstrTauForConversion(input: ContinuousInput, X_target: number): number {
  if (X_target <= 0) return 0;
  if (X_target >= 1) return Infinity; // Asymptotically infinite time

  const a_in = input.a_in;
  const Vmax = getVmax(input.kinetics);
  const KM = input.kinetics.KM;

  const tau = (a_in / Vmax) * X_target + (KM / Vmax) * (X_target / (1 - X_target));
  return tau;
}

/**
 * Forward solve for a CSTR given an inlet and tau.
 * It solves the quadratic equation for a_out:
 * tau = (a_in - a_out) / v(a_out) = (a_in - a_out) / (Vmax * a_out / (KM + a_out))
 * Rearranges to quadratic in a_out.
 */
export function solveCSTRForward(input: ContinuousInput, tau: number): ContinuousOutput {
  const a_in = input.a_in;
  const Vmax = getVmax(input.kinetics);
  const KM = input.kinetics.KM;
  const v_dot = input.v_dot;
  const V = tau * v_dot;

  if (tau <= 0) {
    return { a_out: a_in, X: 0, V: 0, tau: 0 };
  }

  // Quadratic coefficients for A*x^2 + B*x + C = 0 where x = a_out
  // a_in - a_out = tau * Vmax * a_out / (KM + a_out)
  // (a_in - a_out) * (KM + a_out) = tau * Vmax * a_out
  // a_in*KM + a_in*a_out - a_out*KM - a_out^2 = tau*Vmax*a_out
  // a_out^2 + (KM - a_in + tau*Vmax) * a_out - a_in * KM = 0
  
  const A = 1;
  const B = KM - a_in + tau * Vmax;
  const C = -a_in * KM;

  const discriminant = B * B - 4 * A * C;
  if (discriminant < 0) {
    // Should not happen for physical parameters
    return { a_out: a_in, X: 0, V, tau };
  }

  // Positive root for positive concentration
  const a_out1 = (-B + Math.sqrt(discriminant)) / (2 * A);
  const a_out2 = (-B - Math.sqrt(discriminant)) / (2 * A);
  
  let a_out = a_out1 >= 0 && a_out1 <= a_in ? a_out1 : a_out2;
  
  if (a_out < 0) a_out = 0;
  if (a_out > a_in) a_out = a_in;

  const X = a_in > 0 ? (a_in - a_out) / a_in : 0;

  return { a_out, X, V, tau };
}

/**
 * Inverse solve for CSTR given a target X.
 */
export function solveCSTRInverse(input: ContinuousInput, X_target: number): ContinuousOutput {
  const X = Math.min(Math.max(X_target, 0), 0.999); // avoid infinity
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
