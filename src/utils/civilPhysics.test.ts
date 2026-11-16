import { describe, expect, it } from 'vitest';
import {
  calculateOpenChannelFlow,
  calculateRankineEarthPressure,
  calculateSimplySupportedBeam,
} from './civilPhysics';

describe('civilPhysics', () => {
  it('computes Rankine Ka/Kp for cohesionless sand φ = 30°', () => {
    const res = calculateRankineEarthPressure({
      height: 4,
      gamma: 18,
      phi: 30,
      c: 0,
      q: 0,
    });
    expect(res.ka).toBe(0.333);
    expect(res.kp).toBe(3);
    // Pa = 0.5 * 18 * 4^2 * (1/3) = 48 kN/m
    expect(res.totalActiveForce).toBe(48);
  });

  it('computes simply supported beam reactions and max moment for central point load', () => {
    const res = calculateSimplySupportedBeam({
      span: 6,
      pointLoad: 20,
      loadPos: 3,
      udl: 0,
    });
    expect(res.ra).toBe(10);
    expect(res.rb).toBe(10);
    // M_max = P*L/4 = 20*6/4 = 30 kN·m
    expect(res.maxMoment).toBe(30);
    expect(res.maxMomentPos).toBe(3);
  });

  it('computes rectangular open-channel flow via Manning formula', () => {
    const res = calculateOpenChannelFlow({
      bottomWidth: 2,
      depth: 1,
      sideSlope: 0,
      slopeRatio: 0.001,
      roughness: 0.015,
    });
    // A = 2, P = 4, R = 0.5 -> v = (1/0.015)*0.5^(2/3)*0.001^(0.5) ≈ 1.33 m/s
    expect(res.area).toBe(2);
    expect(res.hydraulicRadius).toBe(0.5);
    expect(res.velocity).toBe(1.33);
    expect(res.discharge).toBe(2.66);
    expect(res.regime).toBe('常流 (Subcritical)');
  });
});
