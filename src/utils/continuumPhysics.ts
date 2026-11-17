export type SignConvention = 'compression' | 'tension';

export interface StressTensor3D {
  sxx: number; // σ_x (kPa)
  syy: number; // σ_y (kPa)
  szz: number; // σ_z (kPa)
  txy: number; // τ_xy (kPa)
  tyz: number; // τ_yz (kPa)
  tzx: number; // τ_zx (kPa)
}

export type Matrix3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

export type Vec3 = [number, number, number];

export interface CauchyResult {
  normal: Vec3;
  traction: Vec3; // t = σ n
  tractionMagnitude: number; // ||t||
  sigmaN: number; // n^T σ n
  tauN: number; // ||t - σ_n n||
  shearVector: Vec3; // t - σ_n n
}

export interface Transform2DResult {
  sigmaXp: number;
  sigmaYp: number;
  tauXpYp: number;
  traceBefore: number;
  traceAfter: number;
}

export interface PrincipalInvariantsResult {
  principalStresses: [number, number, number]; // σ1 >= σ2 >= σ3
  principalDirections: [Vec3, Vec3, Vec3]; // v1, v2, v3 (right-handed unit vectors)
  i1: number;
  i2: number;
  i3: number;
  meanStressP: number; // p = I1 / 3
  deviatoricTensor: Matrix3; // s = σ - pI
  j2: number; // 1/2 tr(s^2)
  vonMisesQ: number; // sqrt(3 J2)
  sigmaOct: number; // I1 / 3
  tauOct: number; // sqrt(2/3 J2)
  tauMax: number; // (σ1 - σ3) / 2
}

export interface MohrPoleInput {
  sigmaX: number; // 鉛直面の垂直応力 (圧縮正, kPa)
  sigmaZ: number; // 水平面の垂直応力 (圧縮正, kPa)
  tauH: number; // 水平面のせん断応力 (要素を反時計回りに回す向きを正, kPa)
  theta: number; // 水平面から反時計回りの面角度 θ (deg, 0 ~ 180)
}

export interface MohrPoleResult {
  center: number; // C
  radius: number; // R
  sigma1: number;
  sigma3: number;
  pointH: { sigma: number; tau: number }; // 水平面点 H = (σ_z, τ_H)
  pointV: { sigma: number; tau: number }; // 鉛直面点 V = (σ_x, -τ_H)
  pole: { sigma: number; tau: number }; // 極 P = (σ_x, τ_H)
  sigmaTheta: number; // 任意角 θ 面の垂直応力
  tauTheta: number; // 任意角 θ 面のせん断応力
  thetaP1: number; // 最大主応力面が水平面となす角 (deg, [0, 180))
  thetaP3: number; // 最小主応力面が水平面となす角 (deg, [0, 180))
}

export interface GeostaticInput {
  depthZ: number; // m
  gamma: number; // 湿潤単位体積重量 (kN/m^3)
  gammaSat: number; // 飽和単位体積重量 (kN/m^3)
  waterTableZ: number; // 地下水位深さ (m)
  k0: number; // 静止土圧係数 K0
}

export interface GeostaticPoint {
  z: number;
  sigmaVTotal: number;
  poreWaterU: number;
  sigmaVEff: number;
  sigmaHEff: number;
  sigmaHTotal: number;
}

export interface BoussinesqResult {
  r: number;
  z: number;
  radialR: number;
  deltaSigmaZ: number;
  deltaSigmaR: number;
  deltaSigmaTheta: number;
  deltaTauRZ: number;
}

export interface PlaneStressIncrement {
  deltaSigmaZ: number;
  deltaSigmaX: number;
  deltaTauXZ: number;
}

export interface StripSuperpositionResult {
  analytical: PlaneStressIncrement;
  superposed: PlaneStressIncrement;
  relativeErrorPct: number;
  divisions: number;
}

export interface ElasticConstantsResult {
  eKpa: number;
  nu: number;
  gKpa: number;
  kKpa: number;
  lambdaKpa: number;
  eOedKpa: number;
  k0Elastic: number;
}

export type DeformationMode = 'general-3d' | 'plane-strain' | 'k0-1d';

export interface HookeDeformationInput {
  eMpa: number;
  nu: number;
  mode: DeformationMode;
  dSigmaZ: number; // kPa
  dSigmaX: number; // kPa
  dSigmaY: number; // kPa
  dTauXZ: number; // kPa
}

export interface HookeDeformationResult {
  constants: ElasticConstantsResult;
  effectiveStresses: {
    dSigmaX: number;
    dSigmaY: number;
    dSigmaZ: number;
    dTauXZ: number;
  };
  epsX: number; // 無次元ひずみ
  epsY: number;
  epsZ: number;
  gammaXZ: number; // 工学せん断ひずみ
  epsVol: number; // 体積ひずみ εv = εx + εy + εz
  epsShear: number; // 偏差せん断ひずみ εs
  deltaP: number; // 平均主応力増分 Δp
  deltaQ: number; // 軸差応力増分 Δq
}

export interface LayerSettlementResult {
  totalSettlementMm: number;
  layerBreakdown: {
    depthMid: number;
    deltaZ: number;
    deltaSigmaZ: number;
    deltaSigmaX: number;
    epsZ: number;
    deltaHmm: number;
  }[];
  surfaceFormulaSettlementMm: number;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function round4(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function buildMatrix3(t: StressTensor3D): Matrix3 {
  return [
    [t.sxx, t.txy, t.tzx],
    [t.txy, t.syy, t.tyz],
    [t.tzx, t.tyz, t.szz],
  ];
}

export function flipTensorSign(t: StressTensor3D): StressTensor3D {
  return {
    sxx: -t.sxx,
    syy: -t.syy,
    szz: -t.szz,
    txy: -t.txy,
    tyz: -t.tyz,
    tzx: -t.tzx,
  };
}

export function matMul3(a: Matrix3, b: Matrix3): Matrix3 {
  const out: Matrix3 = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      out[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j];
    }
  }
  return out;
}

export function transpose3(m: Matrix3): Matrix3 {
  return [
    [m[0][0], m[1][0], m[2][0]],
    [m[0][1], m[1][1], m[2][1]],
    [m[0][2], m[1][2], m[2][2]],
  ];
}

export function normalizeVec3(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2]);
  if (len < 1e-12) return [0, 0, 1];
  return [v[0] / len, v[1] / len, v[2] / len];
}

export function calculateCauchy3D(t: StressTensor3D, rawNormal: Vec3): CauchyResult {
  const n = normalizeVec3(rawNormal);
  const m = buildMatrix3(t);
  const traction: Vec3 = [
    m[0][0] * n[0] + m[0][1] * n[1] + m[0][2] * n[2],
    m[1][0] * n[0] + m[1][1] * n[1] + m[1][2] * n[2],
    m[2][0] * n[0] + m[2][1] * n[1] + m[2][2] * n[2],
  ];
  const sigmaN = traction[0] * n[0] + traction[1] * n[1] + traction[2] * n[2];
  const shearVector: Vec3 = [
    traction[0] - sigmaN * n[0],
    traction[1] - sigmaN * n[1],
    traction[2] - sigmaN * n[2],
  ];
  const tauN = Math.hypot(shearVector[0], shearVector[1], shearVector[2]);
  const tractionMagnitude = Math.hypot(traction[0], traction[1], traction[2]);
  return {
    normal: n,
    traction,
    tractionMagnitude,
    sigmaN,
    tauN,
    shearVector,
  };
}

/**
 * 2次元応力成分の座標回転（x軸・y軸を反時計回りに thetaDeg 回転した座標系 x'-y'）
 */
export function calculateTransform2D(
  sxx: number,
  syy: number,
  txy: number,
  thetaDeg: number
): Transform2DResult {
  const twoTheta = degToRad(2 * thetaDeg);
  const avg = (sxx + syy) / 2;
  const halfDiff = (sxx - syy) / 2;
  const sigmaXp = avg + halfDiff * Math.cos(twoTheta) + txy * Math.sin(twoTheta);
  const sigmaYp = avg - halfDiff * Math.cos(twoTheta) - txy * Math.sin(twoTheta);
  const tauXpYp = -halfDiff * Math.sin(twoTheta) + txy * Math.cos(twoTheta);
  return {
    sigmaXp,
    sigmaYp,
    tauXpYp,
    traceBefore: sxx + syy,
    traceAfter: sigmaXp + sigmaYp,
  };
}

export function buildRotationMatrix3D(yawDeg: number, pitchDeg: number, rollDeg: number): Matrix3 {
  const cz = Math.cos(degToRad(yawDeg));
  const sz = Math.sin(degToRad(yawDeg));
  const cy = Math.cos(degToRad(pitchDeg));
  const sy = Math.sin(degToRad(pitchDeg));
  const cx = Math.cos(degToRad(rollDeg));
  const sx = Math.sin(degToRad(rollDeg));

  const rz: Matrix3 = [
    [cz, -sz, 0],
    [sz, cz, 0],
    [0, 0, 1],
  ];
  const ry: Matrix3 = [
    [cy, 0, sy],
    [0, 1, 0],
    [-sy, 0, cy],
  ];
  const rx: Matrix3 = [
    [1, 0, 0],
    [0, cx, -sx],
    [0, sx, cx],
  ];
  return matMul3(rz, matMul3(ry, rx));
}

export function rotateTensor3D(
  t: StressTensor3D,
  yawDeg: number,
  pitchDeg: number,
  rollDeg: number
): StressTensor3D {
  const q = buildRotationMatrix3D(yawDeg, pitchDeg, rollDeg);
  const m = buildMatrix3(t);
  const transformed = matMul3(q, matMul3(m, transpose3(q)));
  return {
    sxx: transformed[0][0],
    syy: transformed[1][1],
    szz: transformed[2][2],
    txy: transformed[0][1],
    tyz: transformed[1][2],
    tzx: transformed[0][2],
  };
}

/**
 * 3x3 対称行列に対するヤコビ固有値解析（決定論的）＋応力不変量算出
 */
export function calculatePrincipalAndInvariants(t: StressTensor3D): PrincipalInvariantsResult {
  const a: Matrix3 = buildMatrix3(t);
  const v: Matrix3 = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  for (let sweep = 0; sweep < 50; sweep++) {
    // 最大非対角要素を探す
    let p = 0;
    let q = 1;
    let maxOff = Math.abs(a[0][1]);
    if (Math.abs(a[0][2]) > maxOff) {
      p = 0;
      q = 2;
      maxOff = Math.abs(a[0][2]);
    }
    if (Math.abs(a[1][2]) > maxOff) {
      p = 1;
      q = 2;
      maxOff = Math.abs(a[1][2]);
    }
    if (maxOff < 1e-12) break;

    const app = a[p][p];
    const aqq = a[q][q];
    const apq = a[p][q];
    const tau = (aqq - app) / (2 * apq);
    const tRot =
      tau >= 0
        ? 1 / (tau + Math.sqrt(1 + tau * tau))
        : -1 / (-tau + Math.sqrt(1 + tau * tau));
    const c = 1 / Math.sqrt(1 + tRot * tRot);
    const s = tRot * c;

    a[p][p] = app - tRot * apq;
    a[q][q] = aqq + tRot * apq;
    a[p][q] = 0;
    a[q][p] = 0;

    for (let r = 0; r < 3; r++) {
      if (r !== p && r !== q) {
        const arp = a[r][p];
        const arq = a[r][q];
        a[r][p] = c * arp - s * arq;
        a[p][r] = a[r][p];
        a[r][q] = s * arp + c * arq;
        a[q][r] = a[r][q];
      }
      const vrp = v[r][p];
      const vrq = v[r][q];
      v[r][p] = c * vrp - s * vrq;
      v[r][q] = s * vrp + c * vrq;
    }
  }

  const pairs: { val: number; vec: Vec3 }[] = [0, 1, 2].map((i) => ({
    val: a[i][i],
    vec: normalizeVec3([v[0][i], v[1][i], v[2][i]]),
  }));
  pairs.sort((x, y) => y.val - x.val);

  // 右手系を保証（v1 × v2 の向きと v3 が逆なら v3 を反転）
  const v1 = pairs[0].vec;
  const v2 = pairs[1].vec;
  const cross: Vec3 = [
    v1[1] * v2[2] - v1[2] * v2[1],
    v1[2] * v2[0] - v1[0] * v2[2],
    v1[0] * v2[1] - v1[1] * v2[0],
  ];
  let v3 = pairs[2].vec;
  if (cross[0] * v3[0] + cross[1] * v3[1] + cross[2] * v3[2] < 0) {
    v3 = [-v3[0], -v3[1], -v3[2]];
  }

  const i1 = t.sxx + t.syy + t.szz;
  const i2 =
    t.sxx * t.syy +
    t.syy * t.szz +
    t.szz * t.sxx -
    t.txy * t.txy -
    t.tyz * t.tyz -
    t.tzx * t.tzx;
  const m = buildMatrix3(t);
  const i3 =
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

  const p = i1 / 3;
  const dev: Matrix3 = [
    [t.sxx - p, t.txy, t.tzx],
    [t.txy, t.syy - p, t.tyz],
    [t.tzx, t.tyz, t.szz - p],
  ];

  let sumSq = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      sumSq += dev[i][j] * dev[i][j];
    }
  }
  const j2 = 0.5 * sumSq;
  const vonMisesQ = Math.sqrt(Math.max(0, 3 * j2));
  const tauOct = Math.sqrt(Math.max(0, (2 / 3) * j2));
  const tauMax = (pairs[0].val - pairs[2].val) / 2;

  return {
    principalStresses: [pairs[0].val, pairs[1].val, pairs[2].val],
    principalDirections: [v1, v2, v3],
    i1,
    i2,
    i3,
    meanStressP: p,
    deviatoricTensor: dev,
    j2,
    vonMisesQ,
    sigmaOct: p,
    tauOct,
    tauMax,
  };
}

/**
 * 第4章：一般2次元応力 (σ_x, σ_z, τ_H) からのモール応力円と用極法 (Pole Method)
 * 水平面点 H = (σ_z, τ_H)、鉛直面点 V = (σ_x, -τ_H)、極 P = (σ_x, τ_H)
 */
export function calculateMohrPole2D(inputs: MohrPoleInput): MohrPoleResult {
  const { sigmaX, sigmaZ, tauH } = inputs;
  const theta = ((inputs.theta % 180) + 180) % 180;
  const center = (sigmaX + sigmaZ) / 2;
  const halfDiffZ = (sigmaZ - sigmaX) / 2;
  const radius = Math.hypot(halfDiffZ, tauH);
  const sigma1 = center + radius;
  const sigma3 = center - radius;

  const twoTheta = degToRad(2 * theta);
  const sigmaTheta = center + halfDiffZ * Math.cos(twoTheta) - tauH * Math.sin(twoTheta);
  const tauTheta = halfDiffZ * Math.sin(twoTheta) + tauH * Math.cos(twoTheta);

  let thetaP1 = 0;
  let thetaP3 = 90;
  if (radius > 1e-9) {
    const phiH = Math.atan2(tauH, halfDiffZ);
    const rawP1 = radToDeg(-phiH / 2);
    thetaP1 = ((rawP1 % 180) + 180) % 180;
    thetaP3 = (thetaP1 + 90) % 180;
  }

  return {
    center,
    radius,
    sigma1,
    sigma3,
    pointH: { sigma: sigmaZ, tau: tauH },
    pointV: { sigma: sigmaX, tau: -tauH },
    pole: { sigma: sigmaX, tau: tauH },
    sigmaTheta,
    tauTheta,
    thetaP1,
    thetaP3,
  };
}

/**
 * 第5章A：自重応力・静止土圧（地下水位・有効応力考慮）
 */
export function calculateGeostaticStress(input: GeostaticInput): GeostaticPoint {
  const z = Math.max(0, input.depthZ);
  const zw = Math.max(0, input.waterTableZ);
  const gammaW = 9.81;

  const aboveWater = Math.min(z, zw);
  const belowWater = Math.max(0, z - zw);

  const sigmaVTotal = aboveWater * input.gamma + belowWater * input.gammaSat;
  const poreWaterU = belowWater * gammaW;
  const sigmaVEff = sigmaVTotal - poreWaterU;
  const sigmaHEff = input.k0 * sigmaVEff;
  const sigmaHTotal = sigmaHEff + poreWaterU;

  return {
    z,
    sigmaVTotal,
    poreWaterU,
    sigmaVEff,
    sigmaHEff,
    sigmaHTotal,
  };
}

/**
 * 第5章B-1：集中荷重 P (kN) に対する Boussinesq の解（半無限弾性体）
 */
export function calculateBoussinesqPoint(
  loadP: number,
  r: number,
  z: number,
  nu = 0.3
): BoussinesqResult {
  const safeZ = Math.max(0.05, z);
  const absR = Math.abs(r);
  const bigR = Math.hypot(absR, safeZ);
  const r5 = Math.pow(bigR, 5);
  const r3 = Math.pow(bigR, 3);

  const deltaSigmaZ = ((3 * loadP) / (2 * Math.PI)) * (Math.pow(safeZ, 3) / r5);
  const deltaSigmaR =
    (loadP / (2 * Math.PI)) *
    ((3 * absR * absR * safeZ) / r5 - (1 - 2 * nu) / (bigR * (bigR + safeZ)));
  const deltaSigmaTheta =
    ((loadP * (1 - 2 * nu)) / (2 * Math.PI)) *
    (1 / (bigR * (bigR + safeZ)) - safeZ / r3);
  const deltaTauRZ = ((3 * loadP) / (2 * Math.PI)) * ((absR * safeZ * safeZ) / r5);

  return {
    r: absR,
    z: safeZ,
    radialR: bigR,
    deltaSigmaZ,
    deltaSigmaR,
    deltaSigmaTheta,
    deltaTauRZ,
  };
}

/**
 * 第5章B-2：線荷重 qL (kN/m) に対する Flamant の解（集中荷重の y 方向積分）
 */
export function calculateFlamantLine(
  qLine: number,
  x: number,
  z: number
): PlaneStressIncrement {
  const safeZ = Math.max(0.05, z);
  const denom = Math.pow(x * x + safeZ * safeZ, 2);
  const coef = (2 * qLine) / Math.PI;
  return {
    deltaSigmaZ: (coef * Math.pow(safeZ, 3)) / denom,
    deltaSigmaX: (coef * x * x * safeZ) / denom,
    deltaTauXZ: (coef * x * safeZ * safeZ) / denom,
  };
}

/**
 * 第5章B-3：帯荷重 q (kPa), 幅 B (m) に対する閉形式解（線荷重の幅積分）
 */
export function calculateStripLoad(
  qPress: number,
  widthB: number,
  x: number,
  z: number
): PlaneStressIncrement {
  const safeZ = Math.max(0.05, z);
  const halfB = Math.max(0.05, widthB / 2);
  const theta1 = Math.atan2(x - halfB, safeZ);
  const theta2 = Math.atan2(x + halfB, safeZ);
  const alpha = theta2 - theta1;
  const twoDelta = theta1 + theta2;

  return {
    deltaSigmaZ: (qPress / Math.PI) * (alpha + Math.sin(alpha) * Math.cos(twoDelta)),
    deltaSigmaX: (qPress / Math.PI) * (alpha - Math.sin(alpha) * Math.cos(twoDelta)),
    deltaTauXZ: (qPress / Math.PI) * (Math.sin(alpha) * Math.sin(twoDelta)),
  };
}

/**
 * 帯荷重を N 本の離散線荷重で近似重ね合わせし、積分（閉形式解）への収束を確認する
 */
export function calculateStripSuperposition(
  qPress: number,
  widthB: number,
  x: number,
  z: number,
  divisions: number
): StripSuperpositionResult {
  const n = Math.max(1, Math.round(divisions));
  const safeB = Math.max(0.1, widthB);
  const du = safeB / n;
  const qLine = qPress * du;

  let sumZ = 0;
  let sumX = 0;
  let sumXZ = 0;
  for (let i = 0; i < n; i++) {
    const u = -safeB / 2 + (i + 0.5) * du;
    const inc = calculateFlamantLine(qLine, x - u, z);
    sumZ += inc.deltaSigmaZ;
    sumX += inc.deltaSigmaX;
    sumXZ += inc.deltaTauXZ;
  }

  const analytical = calculateStripLoad(qPress, safeB, x, z);
  const superposed: PlaneStressIncrement = {
    deltaSigmaZ: sumZ,
    deltaSigmaX: sumX,
    deltaTauXZ: sumXZ,
  };

  const relativeErrorPct =
    Math.abs(analytical.deltaSigmaZ) > 1e-6
      ? (Math.abs(superposed.deltaSigmaZ - analytical.deltaSigmaZ) /
          Math.abs(analytical.deltaSigmaZ)) *
        100
      : 0;

  return {
    analytical,
    superposed,
    relativeErrorPct,
    divisions: n,
  };
}

/**
 * 第6章A：等方線形弾性体の弾性定数変換
 */
export function calculateElasticConstants(eMpa: number, nuInput: number): ElasticConstantsResult {
  const eKpa = Math.max(100, eMpa * 1000);
  const nu = Math.max(0, Math.min(0.495, nuInput));

  const gKpa = eKpa / (2 * (1 + nu));
  const kKpa = eKpa / (3 * (1 - 2 * nu));
  const lambdaKpa = (eKpa * nu) / ((1 + nu) * (1 - 2 * nu));
  const eOedKpa = (eKpa * (1 - nu)) / ((1 + nu) * (1 - 2 * nu));
  const k0Elastic = nu / (1 - nu);

  return {
    eKpa,
    nu,
    gKpa,
    kKpa,
    lambdaKpa,
    eOedKpa,
    k0Elastic,
  };
}

/**
 * 第6章B：一般化フックの法則（3次元 / 平面ひずみ / K0 一次元圧密条件）
 */
export function calculateHookeDeformation(input: HookeDeformationInput): HookeDeformationResult {
  const constants = calculateElasticConstants(input.eMpa, input.nu);
  const { eKpa, nu, gKpa } = constants;

  let dSigmaX = input.dSigmaX;
  let dSigmaY = input.dSigmaY;
  const dSigmaZ = input.dSigmaZ;
  let dTauXZ = input.dTauXZ;

  if (input.mode === 'plane-strain') {
    dSigmaY = nu * (dSigmaX + dSigmaZ);
  } else if (input.mode === 'k0-1d') {
    const k0Stress = constants.k0Elastic * dSigmaZ;
    dSigmaX = k0Stress;
    dSigmaY = k0Stress;
    dTauXZ = 0;
  }

  const epsX = (dSigmaX - nu * (dSigmaY + dSigmaZ)) / eKpa;
  const epsY = (dSigmaY - nu * (dSigmaZ + dSigmaX)) / eKpa;
  const epsZ = (dSigmaZ - nu * (dSigmaX + dSigmaY)) / eKpa;
  const gammaXZ = dTauXZ / gKpa;

  const epsVol = epsX + epsY + epsZ;

  // 偏差ひずみ不変量 (2/3 * sqrt(((ex-ey)^2+(ey-ez)^2+(ez-ex)^2)/2 + 3/4 * gammaXZ^2))
  const eMean = epsVol / 3;
  const dex = epsX - eMean;
  const dey = epsY - eMean;
  const dez = epsZ - eMean;
  const exz = gammaXZ / 2;
  const j2e = 0.5 * (dex * dex + dey * dey + dez * dez + 2 * exz * exz);
  const epsShear = Math.sqrt((4 / 3) * j2e);

  const deltaP = (dSigmaX + dSigmaY + dSigmaZ) / 3;
  const j2s =
    (Math.pow(dSigmaX - dSigmaY, 2) +
      Math.pow(dSigmaY - dSigmaZ, 2) +
      Math.pow(dSigmaZ - dSigmaX, 2)) /
      6 +
    dTauXZ * dTauXZ;
  const deltaQ = Math.sqrt(3 * j2s);

  return {
    constants,
    effectiveStresses: {
      dSigmaX,
      dSigmaY,
      dSigmaZ,
      dTauXZ,
    },
    epsX,
    epsY,
    epsZ,
    gammaXZ,
    epsVol,
    epsShear,
    deltaP,
    deltaQ,
  };
}

/**
 * 第6章C：Boussinesq 表面沈下量および帯荷重下の層別弾性即時沈下
 */
export function calculateBoussinesqSurfaceSettlement(
  loadP: number,
  r: number,
  eMpa: number,
  nuInput: number
): number {
  const eKpa = Math.max(100, eMpa * 1000);
  const nu = Math.max(0, Math.min(0.495, nuInput));
  const safeR = Math.max(0.1, Math.abs(r));
  // w(r) in meters -> convert to mm
  const wMeters = (loadP * (1 - nu * nu)) / (Math.PI * eKpa * safeR);
  return wMeters * 1000;
}

export function calculateStripElasticSettlement(
  qPress: number,
  widthB: number,
  layerDepthH: number,
  eMpa: number,
  nuInput: number,
  nLayers = 6
): LayerSettlementResult {
  const constants = calculateElasticConstants(eMpa, nuInput);
  const { eKpa, nu } = constants;
  const safeH = Math.max(0.5, layerDepthH);
  const count = Math.max(1, nLayers);
  const dz = safeH / count;

  let totalMm = 0;
  const breakdown: LayerSettlementResult['layerBreakdown'] = [];

  for (let i = 0; i < count; i++) {
    const zMid = (i + 0.5) * dz;
    // 帯荷重中心 x=0 直下の応力増分（平面ひずみ条件を想定：Δσ_y = ν(Δσ_x + Δσ_z)）
    const inc = calculateStripLoad(qPress, widthB, 0, zMid);
    const dSigmaY = nu * (inc.deltaSigmaX + inc.deltaSigmaZ);
    const epsZ = (inc.deltaSigmaZ - nu * (inc.deltaSigmaX + dSigmaY)) / eKpa;
    const deltaHmm = epsZ * dz * 1000;
    totalMm += deltaHmm;
    breakdown.push({
      depthMid: round2(zMid),
      deltaZ: round2(dz),
      deltaSigmaZ: round2(inc.deltaSigmaZ),
      deltaSigmaX: round2(inc.deltaSigmaX),
      epsZ,
      deltaHmm: round2(deltaHmm),
    });
  }

  // 参考：正方形等分布載荷中心の半無限弾性公式 (Is ≈ 1.12)
  const surfaceFormulaSettlementMm =
    qPress * widthB * ((1 - nu * nu) / eKpa) * 1.12 * 1000;

  return {
    totalSettlementMm: round2(totalMm),
    layerBreakdown: breakdown,
    surfaceFormulaSettlementMm: round2(surfaceFormulaSettlementMm),
  };
}
