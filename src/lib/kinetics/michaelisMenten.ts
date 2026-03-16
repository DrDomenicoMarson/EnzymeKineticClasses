import { KineticParams } from '../../types';

/**
 * Calculates the maximum volumetric rate Vmax from mechanistic parameters if enabled.
 * If not enabled, returns the directly provided Vmax.
 */
export function getVmax(params: KineticParams): number {
  if (params.useMechanistic && params.kcat !== undefined && params.e0 !== undefined) {
    return params.kcat * params.e0;
  }
  return params.Vmax;
}

/**
 * Calculates the Michaelis-Menten rate v(a) for a given substrate concentration a.
 * v(a) = Vmax * a / (KM + a)
 * 
 * @param a Substrate concentration
 * @param params Kinetic parameters
 * @returns Rate v(a)
 */
export function rate(a: number, params: KineticParams): number {
  if (a < 0) return 0; // Negative concentration is unphysical
  const vmax = getVmax(params);
  return (vmax * a) / (params.KM + a);
}

/**
 * Generates data points for plotting the rate curve.
 * @param max_a Maximum concentration to plot up to
 * @param params Kinetic parameters
 * @param steps Number of points
 */
export function generateRateCurve(max_a: number, params: KineticParams, steps: number = 100) {
  const points = [];
  const step = max_a / steps;
  for (let i = 0; i <= steps; i++) {
    const a = i * step;
    points.push({ a, v: rate(a, params) });
  }
  return points;
}
