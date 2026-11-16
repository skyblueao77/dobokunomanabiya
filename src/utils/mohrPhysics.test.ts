import { describe, expect, it } from 'vitest';
import { calculateMohrCircle, type MohrInputs } from './mohrPhysics';

const baseInputs: MohrInputs = {
  sigma1: 200,
  sigma3: 80,
  theta: 30,
  c: 20,
  phi: 30,
  u: 40,
  useEffectiveStress: false,
};

describe('calculateMohrCircle', () => {
  it('computes known textbook example: σ1=200, σ3=80, θ=30°', () => {
    const res = calculateMohrCircle(baseInputs);
    expect(res.centerTotal).toBe(140);
    expect(res.radius).toBe(60);
    expect(res.sigmaThetaTotal).toBe(170);
    expect(res.tauTheta).toBe(51.96);
  });

  it('computes effective stress circle shifted by pore water pressure u', () => {
    const res = calculateMohrCircle({
      ...baseInputs,
      useEffectiveStress: true,
    });
    expect(res.sigma1Eff).toBe(160);
    expect(res.sigma3Eff).toBe(40);
    expect(res.centerEff).toBe(100);
    expect(res.radius).toBe(60); // 半径は不変
    expect(res.sigmaThetaEff).toBe(130);
    expect(res.tauTheta).toBe(51.96);
  });

  it('detects Mohr-Coulomb failure when R >= C*sin(φ) + c*cos(φ)', () => {
    // φ=30°, c=10, C=100 -> R_f = 100*0.5 + 10*0.866025 = 58.66
    // σ1=170, σ3=30 -> C=100, R=70 >= 58.66 -> Failure
    const res = calculateMohrCircle({
      sigma1: 170,
      sigma3: 30,
      theta: 45,
      c: 10,
      phi: 30,
      u: 0,
      useEffectiveStress: false,
    });
    expect(res.isFailure).toBe(true);
    expect(res.thetaF).toBe(60);
    expect(res.maxAllowableRadius).toBe(58.66);
  });

  it('handles φ = 0° (undrained clay) without division by zero', () => {
    const res = calculateMohrCircle({
      sigma1: 150,
      sigma3: 50,
      theta: 45,
      c: 40,
      phi: 0,
      u: 0,
      useEffectiveStress: false,
    });
    // R = 50 >= c = 40 -> Failure, θ_f = 45°
    expect(res.maxAllowableRadius).toBe(40);
    expect(res.isFailure).toBe(true);
    expect(res.thetaF).toBe(45);
  });
});
