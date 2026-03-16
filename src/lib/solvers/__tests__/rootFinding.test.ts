import { describe, it, expect } from 'vitest';
import { bisection, rk4 } from '../rootFinding';

describe('Root Finding & Numeric Solvers', () => {
  it('finds root using bisection', () => {
    // x^2 - 4 = 0 -> root is 2
    const f = (x: number) => x * x - 4;
    const root = bisection(f, 0, 5);
    expect(root).not.toBeNull();
    expect(root).toBeCloseTo(2.0, 4);
  });

  it('integrates using RK4', () => {
    // dy/dt = -y -> y(t) = y0 * e^-t
    const f = (_t: number, y: number) => -y;
    const trajectory = rk4(f, 10, 0, 2, 100);
    
    const last = trajectory[trajectory.length - 1];
    expect(last.t).toBeCloseTo(2.0, 4);
    expect(last.y).toBeCloseTo(10 * Math.exp(-2), 3);
  });
});
