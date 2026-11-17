import { describe, expect, it } from 'vitest';
import {
  calculateBoussinesqPoint,
  calculateBoussinesqSurfaceSettlement,
  calculateCauchy3D,
  calculateElasticConstants,
  calculateFlamantLine,
  calculateGeostaticStress,
  calculateHookeDeformation,
  calculateMohrPole2D,
  calculatePrincipalAndInvariants,
  calculateStripElasticSettlement,
  calculateStripLoad,
  calculateStripSuperposition,
  calculateTransform2D,
  rotateTensor3D,
  type StressTensor3D,
} from './continuumPhysics';

describe('continuumPhysics', () => {
  it('コーシーの公式：座標軸方向法線でテンソル列ベクトルに一致し、2D回転でトレース不変となる', () => {
    const t: StressTensor3D = {
      sxx: 120,
      syy: 80,
      szz: 200,
      txy: 35,
      tyz: -15,
      tzx: 25,
    };
    const resX = calculateCauchy3D(t, [1, 0, 0]);
    expect(resX.traction[0]).toBeCloseTo(120, 6);
    expect(resX.traction[1]).toBeCloseTo(35, 6);
    expect(resX.traction[2]).toBeCloseTo(25, 6);
    expect(resX.sigmaN).toBeCloseTo(120, 6);
    expect(resX.tauN).toBeCloseTo(Math.hypot(35, 25), 6);

    const rot = calculateTransform2D(120, 80, 35, 37);
    expect(rot.traceAfter).toBeCloseTo(rot.traceBefore, 6);
  });

  it('主応力と応力の不変量：任意の3D回転後も主応力と I1, I2, I3, J2 が完全に不変である', () => {
    const t: StressTensor3D = {
      sxx: 210,
      syy: 130,
      szz: 90,
      txy: 40,
      tyz: -20,
      tzx: 30,
    };
    const orig = calculatePrincipalAndInvariants(t);
    const rotated = rotateTensor3D(t, 33, -47, 61);
    const after = calculatePrincipalAndInvariants(rotated);

    expect(after.principalStresses[0]).toBeCloseTo(orig.principalStresses[0], 5);
    expect(after.principalStresses[1]).toBeCloseTo(orig.principalStresses[1], 5);
    expect(after.principalStresses[2]).toBeCloseTo(orig.principalStresses[2], 5);
    expect(after.i1).toBeCloseTo(orig.i1, 5);
    expect(after.i2).toBeCloseTo(orig.i2, 3);
    expect(after.i3).toBeCloseTo(orig.i3, 1);
    expect(after.j2).toBeCloseTo(orig.j2, 4);
    // 主応力の和 = I1
    const sumPrincipal =
      orig.principalStresses[0] + orig.principalStresses[1] + orig.principalStresses[2];
    expect(sumPrincipal).toBeCloseTo(orig.i1, 6);
  });

  it('モールの応力円と用極法：極 P から角度 θ の直線交点が公式値と一致し、θ_p1 でせん断ゼロ・σ1となる', () => {
    const res = calculateMohrPole2D({
      sigmaX: 100,
      sigmaZ: 220,
      tauH: 45,
      theta: 25,
    });

    // 極 P = (σx, τH) から θ=25° の方向線と円上点 Q=(σθ, τθ) の傾きが tan(25°) に一致
    const dx = res.sigmaTheta - res.pole.sigma;
    const dy = res.tauTheta - res.pole.tau;
    const rayAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const normRay = ((rayAngle % 180) + 180) % 180;
    expect(normRay).toBeCloseTo(25, 5);

    // 最大主応力面角度 θ_p1 を入れると σθ = σ1, τθ = 0
    const atPrincipal = calculateMohrPole2D({
      sigmaX: 100,
      sigmaZ: 220,
      tauH: 45,
      theta: res.thetaP1,
    });
    expect(atPrincipal.sigmaTheta).toBeCloseTo(res.sigma1, 6);
    expect(atPrincipal.tauTheta).toBeCloseTo(0, 6);
  });

  it('弾性地盤内の応力：自重有効応力・Boussinesqトレース則・線荷重の重ね合わせ積分による帯荷重収束', () => {
    const geo = calculateGeostaticStress({
      depthZ: 6,
      gamma: 18,
      gammaSat: 20,
      waterTableZ: 2,
      k0: 0.5,
    });
    expect(geo.sigmaVTotal).toBeCloseTo(2 * 18 + 4 * 20, 6);
    expect(geo.poreWaterU).toBeCloseTo(4 * 9.81, 6);
    expect(geo.sigmaVEff).toBeCloseTo(geo.sigmaVTotal - geo.poreWaterU, 6);
    expect(geo.sigmaHEff).toBeCloseTo(0.5 * geo.sigmaVEff, 6);

    // Boussinesq 集中荷重：中心線 r=0 の式と3Dトレース恒等式
    const b = calculateBoussinesqPoint(1000, 1.5, 3.0, 0.3);
    const trace = b.deltaSigmaZ + b.deltaSigmaR + b.deltaSigmaTheta;
    const expectedTrace = ((1000 * (1 + 0.3)) / Math.PI) * (3.0 / Math.pow(b.radialR, 3));
    expect(trace).toBeCloseTo(expectedTrace, 5);

    const bCenter = calculateBoussinesqPoint(1000, 0, 2.0, 0.3);
    expect(bCenter.deltaSigmaZ).toBeCloseTo((3 * 1000) / (2 * Math.PI * 4), 6);

    // Flamant 線荷重の重ね合わせ和が帯荷重閉形式解へ高精度で収束すること
    const sup10 = calculateStripSuperposition(100, 4.0, 0.8, 2.5, 10);
    const sup = calculateStripSuperposition(100, 4.0, 0.8, 2.5, 40);
    expect(sup.superposed.deltaSigmaZ).toBeCloseTo(sup.analytical.deltaSigmaZ, 1);
    expect(sup.superposed.deltaSigmaX).toBeCloseTo(sup.analytical.deltaSigmaX, 1);
    expect(sup.superposed.deltaTauXZ).toBeCloseTo(sup.analytical.deltaTauXZ, 1);
    expect(sup.relativeErrorPct).toBeLessThan(0.05);
    expect(sup.relativeErrorPct).toBeLessThan(sup10.relativeErrorPct);

    // Flamant 対称性確認
    const f1 = calculateFlamantLine(50, 1.2, 2.0);
    const f2 = calculateFlamantLine(50, -1.2, 2.0);
    expect(f1.deltaSigmaZ).toBeCloseTo(f2.deltaSigmaZ, 6);
    expect(f1.deltaTauXZ).toBeCloseTo(-f2.deltaTauXZ, 6);
  });

  it('弾性地盤内の応力と変形：弾性定数恒等式・K0一次元圧密の横ひずみゼロ・即時沈下計算', () => {
    const c = calculateElasticConstants(20, 0.25);
    expect(c.gKpa).toBeCloseTo(8000, 5);
    expect(c.kKpa).toBeCloseTo(20000 / 1.5, 5);
    expect(c.k0Elastic).toBeCloseTo(0.25 / 0.75, 6);

    // K0 一次元圧密モードでは εx = εy = 0 かつ εz = Δσz / Eoed
    const defK0 = calculateHookeDeformation({
      eMpa: 20,
      nu: 0.25,
      mode: 'k0-1d',
      dSigmaZ: 100,
      dSigmaX: 0,
      dSigmaY: 0,
      dTauXZ: 20,
    });
    expect(defK0.epsX).toBeCloseTo(0, 9);
    expect(defK0.epsY).toBeCloseTo(0, 9);
    expect(defK0.epsZ).toBeCloseTo(100 / c.eOedKpa, 9);
    expect(defK0.epsVol).toBeCloseTo(defK0.deltaP / c.kKpa, 9);

    // 平面ひずみモードでは εy = 0
    const defPS = calculateHookeDeformation({
      eMpa: 15,
      nu: 0.3,
      mode: 'plane-strain',
      dSigmaZ: 120,
      dSigmaX: 40,
      dSigmaY: 0,
      dTauXZ: 15,
    });
    expect(defPS.epsY).toBeCloseTo(0, 9);

    // 表面変位と層別沈下
    const w = calculateBoussinesqSurfaceSettlement(500, 2, 10, 0.3);
    expect(w).toBeGreaterThan(0);
    const setRes = calculateStripElasticSettlement(100, 4, 8, 12, 0.3, 6);
    expect(setRes.totalSettlementMm).toBeGreaterThan(0);
    expect(setRes.layerBreakdown).toHaveLength(6);

    // 帯荷重地表直下 (z 十分小) で Δσz ≈ q
    const shallowStrip = calculateStripLoad(100, 4, 0, 0.05);
    expect(shallowStrip.deltaSigmaZ).toBeCloseTo(100, 0);
  });
});
