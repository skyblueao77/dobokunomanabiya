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
    // Pa = 0.5 * 18 * 4^2 * (1/3) = 48 kN/m, ya = H/3 = 1.33 m
    expect(res.totalActiveForce).toBe(48);
    expect(res.activeForceHeight).toBe(1.33);
    expect(res.passiveForceHeight).toBe(1.33);
    expect(res.isFullHeightTension).toBe(false);
    expect(res.theoreticalTensionCrackDepth).toBe(0);
  });

  it('computes Rankine full-height tension state (z0_th >= H) cleanly', () => {
    const res = calculateRankineEarthPressure({
      height: 2,
      gamma: 18,
      phi: 30,
      c: 30,
      q: 0,
    });
    expect(res.isFullHeightTension).toBe(true);
    expect(res.tensionCrackDepth).toBe(2);
    expect(res.theoreticalTensionCrackDepth).toBeGreaterThan(2);
    expect(res.totalActiveForce).toBe(0);
    expect(res.activeForceHeight).toBeNull();
    expect(res.passiveForceHeight).toBeGreaterThan(2 / 3);
  });

  it('computes Rankine active resultant centroid height for surcharge + soil trapezoid', () => {
    const res = calculateRankineEarthPressure({
      height: 6,
      gamma: 20,
      phi: 30,
      c: 0,
      q: 60,
    });
    // paTop = 60/3 = 20, paBot = (60+120)/3 = 60 -> ya = (6/3)*(2*20+60)/(20+60) = 2 * 100/80 = 2.5 m
    expect(res.activeForceHeight).toBe(2.5);
  });

  it('computes simply supported beam reactions, max moment, and exact SFD jump at x = a', () => {
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
    expect(res.shearAtLoadLeft).toBe(10);
    expect(res.shearAtLoadRight).toBe(-10);

    // SFD must include both left and right limits at x = a for a sharp vertical step
    const atLoad = res.samples.filter((s) => s.x === 3);
    expect(atLoad).toHaveLength(2);
    expect(atLoad[0].v).toBe(10);
    expect(atLoad[1].v).toBe(-10);
  });

  it('includes off-grid point load position x = a in beam samples without rounding peak', () => {
    // L=6, step=0.15 => x=1.0 is off-grid (between 0.90 and 1.05)
    const res = calculateSimplySupportedBeam({
      span: 6,
      pointLoad: 30,
      loadPos: 1,
      udl: 0,
    });
    // RA = 30*5/6 = 25, RB = 5, M(1) = 25 kN·m
    expect(res.ra).toBe(25);
    expect(res.maxMoment).toBe(25);
    expect(res.maxMomentPos).toBe(1);
    const atLoad = res.samples.filter((s) => s.x === 1);
    expect(atLoad).toHaveLength(2);
    expect(atLoad[0].v).toBe(25);
    expect(atLoad[1].v).toBe(-5);
    expect(atLoad[0].m).toBe(25);
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
