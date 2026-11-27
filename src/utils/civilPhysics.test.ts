import { describe, expect, it } from 'vitest';
import {
  calculateCantileverBeam,
  calculateOpenChannelFlow,
  calculateRankineEarthPressure,
  calculateSimplySupportedBeam,
  calculateSpecificEnergyAndJump,
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

  it('computes cantilever beam fixed-end reactions, SFD jump, and exact tip deflection PL^3/(3EI)', () => {
    const res = calculateCantileverBeam({
      span: 4,
      pointLoad: 20,
      loadPos: 4,
      udl: 0,
      endMoment: 0,
      elasticModulusGPa: 25,
      sectionWidth: 0.3,
      sectionHeight: 0.5,
    });
    // I = 0.3 * 0.5^3 / 12 = 0.003125 m^4, EI = 78125 kN·m^2
    // RA = 20 kN, MA = -80 kN·m, δ = 20 * 64 / (3 * 78125) * 1000 = 5.46 mm
    expect(res.reactionForce).toBe(20);
    expect(res.reactionMoment).toBe(-80);
    expect(res.momentOfInertia).toBe(0.003125);
    expect(res.flexuralRigidity).toBe(78125);
    expect(res.tipDeflectionMm).toBe(5.46);
  });

  it('computes cantilever UDL + mid-span point load SFD jump and exact deflection wL^4/(8EI)', () => {
    const udlOnly = calculateCantileverBeam({
      span: 4,
      pointLoad: 0,
      loadPos: 2,
      udl: 10,
      endMoment: 0,
      elasticModulusGPa: 25,
      sectionWidth: 0.3,
      sectionHeight: 0.5,
    });
    // MA = -10*16/2 = -80 kN·m, δ = 10*256/(8*78125)*1000 = 4.10 mm
    expect(udlOnly.reactionForce).toBe(40);
    expect(udlOnly.reactionMoment).toBe(-80);
    expect(udlOnly.tipDeflectionMm).toBe(4.1);

    const midLoad = calculateCantileverBeam({
      span: 4,
      pointLoad: 30,
      loadPos: 2,
      udl: 0,
      endMoment: 15,
      elasticModulusGPa: 25,
      sectionWidth: 0.3,
      sectionHeight: 0.5,
    });
    const atLoad = midLoad.samples.filter((s) => s.x === 2);
    expect(atLoad).toHaveLength(2);
    expect(atLoad[0].v).toBe(30);
    expect(atLoad[1].v).toBe(0);
    expect(midLoad.reactionMoment).toBe(-75);
  });

  it('computes specific energy, critical depth, alternate depth, and Belanger hydraulic jump', () => {
    const res = calculateSpecificEnergyAndJump({
      discharge: 6,
      width: 3,
      depth1: 0.4,
    });
    // q = 2 m^2/s, hc = (4/9.80665)^(1/3) ≈ 0.74 m, E_min = 1.5*hc ≈ 1.11 m
    // v1 = 5 m/s, Fr1 = 5 / sqrt(9.80665*0.4) ≈ 2.52 -> 振動跳水
    // h2 = 0.2 * (sqrt(1 + 8*Fr1^2) - 1) ≈ 1.24 m
    expect(res.unitDischarge).toBe(2);
    expect(res.criticalDepth).toBe(0.74);
    expect(res.minSpecificEnergy).toBe(1.11);
    expect(res.velocity1).toBe(5);
    expect(res.froude1).toBe(2.52);
    expect(res.regime1).toBe('射流 (Supercritical)');
    expect(res.canJump).toBe(true);
    expect(res.sequentDepth).toBe(1.24);
    expect(res.alternateDepth).toBe(1.59);
    expect(res.energyLoss).toBeGreaterThan(0.2);
    expect(res.froude2).toBeLessThan(1);
  });

  it('reports no hydraulic jump when upstream flow is subcritical (Fr1 < 1)', () => {
    const res = calculateSpecificEnergyAndJump({
      discharge: 4,
      width: 2,
      depth1: 1.5,
    });
    expect(res.regime1).toBe('常流 (Subcritical)');
    expect(res.canJump).toBe(false);
    expect(res.sequentDepth).toBeNull();
    expect(res.energyLoss).toBe(0);
  });
});
