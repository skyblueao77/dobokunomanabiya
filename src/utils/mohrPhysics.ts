export interface MohrInputs {
  sigma1: number; // 最大主応力 σ1 (kPa)
  sigma3: number; // 最小主応力 σ3 (kPa)
  theta: number; // 対象面の角度 θ (deg, 0 ~ 90)
  c: number; // 粘着力 c (kPa)
  phi: number; // 内部摩擦角 φ (deg, 0 ~ 45)
  u: number; // 間隙水圧 u (kPa)
  useEffectiveStress: boolean; // 有効応力モードかどうか
}

export interface MohrResult {
  // 全応力パラメータ
  centerTotal: number; // C (kPa)
  radius: number; // R (kPa)
  sigmaThetaTotal: number; // σ_θ (kPa)
  tauTheta: number; // τ_θ (kPa)

  // 有効応力パラメータ
  sigma1Eff: number; // σ'1 (kPa)
  sigma3Eff: number; // σ'3 (kPa)
  centerEff: number; // C' (kPa)
  sigmaThetaEff: number; // σ'_θ (kPa)

  // 破壊規準パラメータ (選択中のモードに基づく)
  activeCenter: number;
  activeSigma1: number;
  activeSigma3: number;
  activeSigmaTheta: number;
  maxAllowableRadius: number; // 破壊包絡線に接する限界半径 R_f
  isFailure: boolean; // R >= R_f
  thetaF: number; // 理論上のせん断面角度 θ_f = 45 + φ/2 (deg)
  safetyFactor: number | null; // R_f / R (R > 0 の場合)
}

/**
 * 小数点第2位で丸める（浮動小数点誤差対策）
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * 角度（度）をラジアンに変換
 */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * 土質力学の規約（圧縮正・引張負）に基づくモールの応力円・破壊規準の計算
 */
export function calculateMohrCircle(inputs: MohrInputs): MohrResult {
  const sigma1 = inputs.sigma1;
  const sigma3 = Math.min(inputs.sigma3, sigma1); // σ1 >= σ3 を保証
  const theta = Math.max(0, Math.min(90, inputs.theta));
  const c = Math.max(0, inputs.c);
  const phi = Math.max(0, Math.min(45, inputs.phi));
  const u = inputs.u;

  const centerTotal = (sigma1 + sigma3) / 2;
  const radius = (sigma1 - sigma3) / 2;

  const twoThetaRad = degToRad(2 * theta);
  const sigmaThetaTotal = centerTotal + radius * Math.cos(twoThetaRad);
  const tauTheta = radius * Math.sin(twoThetaRad);

  const sigma1Eff = sigma1 - u;
  const sigma3Eff = sigma3 - u;
  const centerEff = centerTotal - u;
  const sigmaThetaEff = sigmaThetaTotal - u;

  const activeCenter = inputs.useEffectiveStress ? centerEff : centerTotal;
  const activeSigma1 = inputs.useEffectiveStress ? sigma1Eff : sigma1;
  const activeSigma3 = inputs.useEffectiveStress ? sigma3Eff : sigma3;
  const activeSigmaTheta = inputs.useEffectiveStress ? sigmaThetaEff : sigmaThetaTotal;

  // 破壊包絡線 τ_f = c + σ tan(φ) に接する限界半径:
  // (C + c cotφ) sinφ = C sinφ + c cosφ （φ=0° でもゼロ除算を回避）
  const phiRad = degToRad(phi);
  const maxAllowableRadius = activeCenter * Math.sin(phiRad) + c * Math.cos(phiRad);

  // 浮動小数点誤差を考慮して判定
  const isFailure = radius >= maxAllowableRadius - 1e-6;
  const thetaF = 45 + phi / 2;
  const safetyFactor = radius > 1e-6 ? maxAllowableRadius / radius : null;

  return {
    centerTotal: round2(centerTotal),
    radius: round2(radius),
    sigmaThetaTotal: round2(sigmaThetaTotal),
    tauTheta: round2(tauTheta),
    sigma1Eff: round2(sigma1Eff),
    sigma3Eff: round2(sigma3Eff),
    centerEff: round2(centerEff),
    sigmaThetaEff: round2(sigmaThetaEff),
    activeCenter: round2(activeCenter),
    activeSigma1: round2(activeSigma1),
    activeSigma3: round2(activeSigma3),
    activeSigmaTheta: round2(activeSigmaTheta),
    maxAllowableRadius: round2(maxAllowableRadius),
    isFailure,
    thetaF: round2(thetaF),
    safetyFactor: safetyFactor !== null ? round2(safetyFactor) : null,
  };
}
