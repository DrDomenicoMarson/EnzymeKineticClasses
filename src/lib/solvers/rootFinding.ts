/**
 * Solves f(x) = 0 using the bisection method.
 * 
 * @param f The function to find the root of
 * @param a Left bound
 * @param b Right bound
 * @param tol Tolerance for convergence
 * @param maxIter Maximum number of iterations
 * @returns The root x, or null if it fails to converge or bounds are invalid
 */
export function bisection(f: (x: number) => number, a: number, b: number, tol = 1e-6, maxIter = 100): number | null {
  let fa = f(a);
  let fb = f(b);

  if (fa * fb > 0) {
    // Check if one of the bounds is already a root
    if (Math.abs(fa) < tol) return a;
    if (Math.abs(fb) < tol) return b;
    return null; // Root not bracketed
  }

  let c = a;
  for (let i = 0; i < maxIter; i++) {
    c = (a + b) / 2;
    const fc = f(c);

    if (Math.abs(fc) < tol || (b - a) / 2 < tol) {
      return c;
    }

    if (fa * fc < 0) {
      b = c;
      fb = fc;
    } else {
      a = c;
      fa = fc;
    }
  }

  return c;
}

/**
 * 4th order Runge-Kutta integrator for a single ODE dy/dt = f(t, y)
 * 
 * @param f The derivative function
 * @param y0 Initial value
 * @param t0 Initial time (or independent variable like tau)
 * @param tf Final time
 * @param steps Number of steps
 * @returns Array of { t, y } trajectory points
 */
export function rk4(f: (t: number, y: number) => number, y0: number, t0: number, tf: number, steps: number) {
  const dt = (tf - t0) / steps;
  let t = t0;
  let y = y0;
  const trajectory = [{ t, y }];

  for (let i = 0; i < steps; i++) {
    const k1 = f(t, y);
    const k2 = f(t + 0.5 * dt, y + 0.5 * dt * k1);
    const k3 = f(t + 0.5 * dt, y + 0.5 * dt * k2);
    const k4 = f(t + dt, y + dt * k3);

    y = y + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    t = t + dt;
    
    // Guard against numerical drift below zero
    if (y < 0) y = 0;

    trajectory.push({ t, y });
  }

  return trajectory;
}
