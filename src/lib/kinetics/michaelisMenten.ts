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
 * Calculates the apparent Michaelis-Menten rate v(a) accounting for any inhibition.
 * 
 * @param a Current substrate concentration
 * @param params Kinetic parameters dictating base rates and uncompetitive/competitive inhibition modes
 * @param a_in Inlet substrate concentration (required used for Product Inhibition where p = a_in - a)
 * @returns Rate v(a)
 */
export function rate(a: number, params: KineticParams, a_in: number = a): number {
  if (a < 0) return 0; // Negative concentration is unphysical
  
  const Vmax_base = getVmax(params);
  let Vmax_app = Vmax_base;
  let KM_app = params.KM;

  const type = params.inhibitionType || 'none';
  if (type !== 'none') {
    // 1. Determine inhibitor concentration
    let i = 0;
    if (type.startsWith('product_')) {
      i = Math.max(0, a_in - a); // Product concentration (1:1 stoichiometry)
    } else if (type === 'substrate') {
      i = a; // Substrate acts as uncompetitive inhibitor
    } else {
      i = params.i_0 || 0; // Constant impurity inhibitor
    }

    const kic = params.K_I_c ?? 1; 
    const kiu = params.K_I_u ?? 1;

    // 2. Adjust apparent constants based on inhibition mechanism
    if (type === 'competitive' || type === 'product_competitive') {
      // Competitive: Vmax unchanged, KM increases linearly with i
      KM_app = params.KM * (1 + i / kic);
    } else if (type === 'uncompetitive' || type === 'product_uncompetitive' || type === 'substrate') {
      // Uncompetitive: Both Vmax and KM decrease proportionally
      const denominator = 1 + i / kiu;
      Vmax_app = Vmax_base / denominator;
      KM_app = params.KM / denominator;
    } else if (type === 'non-competitive' || type === 'product_non-competitive') {
      // Mixed/Non-competitive: Vmax decreases by uncompetitive factor, KM shifts by the ratio of the two
      const factor_u = 1 + i / kiu;
      const factor_c = 1 + i / kic;
      Vmax_app = Vmax_base / factor_u;
      KM_app = params.KM * (factor_c / factor_u);
    }
  }

  return (Vmax_app * a) / (KM_app + a);
}

/**
 * Generates data points for plotting the rate curve.
 * @param max_a Maximum concentration to plot up to
 * @param params Kinetic parameters
 * @param a_in Reference inlet concentration for product inhibition
 * @param steps Number of points
 */
export function generateRateCurve(max_a: number, params: KineticParams, a_in: number, steps: number = 100) {
  const points = [];
  const step = max_a / steps;
  for (let i = 0; i <= steps; i++) {
    const a = i * step;
    points.push({ a, v: rate(a, params, a_in) });
  }
  return points;
}
