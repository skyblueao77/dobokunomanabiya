import { degToRad, round2 } from './mohrPhysics';

// 1. ランキン土圧（砂質土・粘性土対応、水平地表面・鉛直背面壁）
export interface RankineInputs {
  height: number; // 擁壁高さ H (m)
  gamma: number; // 土の単位体積重量 γ (kN/m^3)
  phi: number; // 内部摩擦角 φ (deg)
  c: number; // 粘着力 c (kPa)
  q: number; // 地表面上載荷重 q (kPa)
}

export interface RankineResult {
  ka: number; // 主働土圧係数 Ka = tan^2(45 - φ/2)
  kp: number; // 受働土圧係数 Kp = tan^2(45 + φ/2)
  paTop: number; // 壁頂主働土圧強度 (kPa)
  paBottom: number; // 壁底主働土圧強度 (kPa)
  ppTop: number; // 壁頂受働土圧強度 (kPa)
  ppBottom: number; // 壁底受働土圧強度 (kPa)
  tensionCrackDepth: number; // 引張亀裂深さ z0 (m)
  totalActiveForce: number; // 主働土圧合力 Pa (kN/m)（引張領域無視・正値のみ積分）
  totalPassiveForce: number; // 受働土圧合力 Pp (kN/m)
}

export function calculateRankineEarthPressure(inputs: RankineInputs): RankineResult {
  const H = Math.max(0.5, inputs.height);
  const gamma = Math.max(10, inputs.gamma);
  const phi = Math.max(0, Math.min(45, inputs.phi));
  const c = Math.max(0, inputs.c);
  const q = Math.max(0, inputs.q);

  const ka = Math.pow(Math.tan(degToRad(45 - phi / 2)), 2);
  const kp = Math.pow(Math.tan(degToRad(45 + phi / 2)), 2);
  const sqrtKa = Math.sqrt(ka);
  const sqrtKp = Math.sqrt(kp);

  const paTopRaw = q * ka - 2 * c * sqrtKa;
  const paBottomRaw = (q + gamma * H) * ka - 2 * c * sqrtKa;
  const ppTop = q * kp + 2 * c * sqrtKp;
  const ppBottom = (q + gamma * H) * kp + 2 * c * sqrtKp;

  // 引張亀裂深さ z0（pa(z) <= 0 の範囲）
  let z0 = 0;
  if (paTopRaw < 0) {
    z0 = Math.min(H, (2 * c * sqrtKa - q * ka) / (gamma * ka));
  }

  const effectiveH = Math.max(0, H - z0);
  const paAtZ0 = Math.max(0, paTopRaw);
  const paAtBottomPos = Math.max(0, paBottomRaw);
  const totalActiveForce = 0.5 * (paAtZ0 + paAtBottomPos) * effectiveH;
  const totalPassiveForce = 0.5 * (ppTop + ppBottom) * H;

  return {
    ka: Math.round(ka * 1000) / 1000,
    kp: Math.round(kp * 1000) / 1000,
    paTop: round2(paTopRaw),
    paBottom: round2(paBottomRaw),
    ppTop: round2(ppTop),
    ppBottom: round2(ppBottom),
    tensionCrackDepth: round2(z0),
    totalActiveForce: round2(totalActiveForce),
    totalPassiveForce: round2(totalPassiveForce),
  };
}

// 2. 単純梁（支点A左端、支点B右端、スパン L、集中荷重 P at x=a、等分布荷重 w）
export interface BeamInputs {
  span: number; // スパン L (m)
  pointLoad: number; // 集中荷重 P (kN)
  loadPos: number; // 載荷位置 a (m)
  udl: number; // 等分布荷重 w (kN/m)
}

export interface BeamResult {
  ra: number; // 左支点反力 RA (kN)
  rb: number; // 右支点反力 RB (kN)
  maxMoment: number; // 最大曲げモーメント M_max (kN·m)
  maxMomentPos: number; // M_max の位置 (m)
  maxShear: number; // 最大せん断力絶対値 |V|_max (kN)
  samples: { x: number; v: number; m: number }[];
}

export function calculateSimplySupportedBeam(inputs: BeamInputs): BeamResult {
  const L = Math.max(1, inputs.span);
  const P = Math.max(0, inputs.pointLoad);
  const a = Math.max(0, Math.min(L, inputs.loadPos));
  const w = Math.max(0, inputs.udl);

  const ra = (P * (L - a)) / L + (w * L) / 2;
  const rb = (P * a) / L + (w * L) / 2;

  const evalMoment = (x: number) => {
    const base = ra * x - 0.5 * w * x * x;
    return x > a ? base - P * (x - a) : base;
  };
  const evalShear = (x: number, afterLoad: boolean) => {
    const base = ra - w * x;
    return afterLoad || x > a ? base - P : base;
  };

  // M(x) の極値候補: x=a, 左区間の V=0 点, 右区間の V=0 点
  const candidates = [0, a, L];
  if (w > 1e-6) {
    const xLeftZero = ra / w;
    if (xLeftZero >= 0 && xLeftZero <= a) candidates.push(xLeftZero);
    const xRightZero = (ra - P) / w;
    if (xRightZero >= a && xRightZero <= L) candidates.push(xRightZero);
  }

  let maxMoment = 0;
  let maxMomentPos = 0;
  for (const cx of candidates) {
    const m = evalMoment(cx);
    if (m >= maxMoment) {
      maxMoment = m;
      maxMomentPos = cx;
    }
  }

  const samples: { x: number; v: number; m: number }[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const x = (L * i) / steps;
    samples.push({
      x: round2(x),
      v: round2(evalShear(x, false)),
      m: round2(evalMoment(x)),
    });
  }

  const maxShear = Math.max(Math.abs(ra), Math.abs(rb));

  return {
    ra: round2(ra),
    rb: round2(rb),
    maxMoment: round2(maxMoment),
    maxMomentPos: round2(maxMomentPos),
    maxShear: round2(maxShear),
    samples,
  };
}

// 3. 開水路等流（マニングの公式・台形/長方形断面）
export interface ChannelInputs {
  bottomWidth: number; // 底幅 B (m)
  depth: number; // 水深 h (m)
  sideSlope: number; // 法面勾配 m (1:m、0で長方形断面)
  slopeRatio: number; // 水路勾配 I (1/N の N ではなく I, e.g., 0.001)
  roughness: number; // マニングの粗度係数 n
}

export interface ChannelResult {
  area: number; // 通水断面積 A (m^2)
  wettedPerimeter: number; // 潤辺 P (m)
  hydraulicRadius: number; // 径深 R = A/P (m)
  topWidth: number; // 水面幅 T (m)
  velocity: number; // 平均流速 v (m/s)
  discharge: number; // 流量 Q (m^3/s)
  froudeNumber: number; // フルード数 Fr
  regime: '常流 (Subcritical)' | '限界流 (Critical)' | '射流 (Supercritical)';
}

export function calculateOpenChannelFlow(inputs: ChannelInputs): ChannelResult {
  const B = Math.max(0.2, inputs.bottomWidth);
  const h = Math.max(0.05, inputs.depth);
  const m = Math.max(0, inputs.sideSlope);
  const I = Math.max(0.0001, inputs.slopeRatio);
  const n = Math.max(0.008, inputs.roughness);

  const area = (B + m * h) * h;
  const wettedPerimeter = B + 2 * h * Math.sqrt(1 + m * m);
  const hydraulicRadius = area / wettedPerimeter;
  const topWidth = B + 2 * m * h;
  const hydraulicDepth = area / topWidth;

  const velocity = (1 / n) * Math.pow(hydraulicRadius, 2 / 3) * Math.sqrt(I);
  const discharge = area * velocity;
  const froudeNumber = velocity / Math.sqrt(9.80665 * hydraulicDepth);

  let regime: ChannelResult['regime'] = '常流 (Subcritical)';
  if (Math.abs(froudeNumber - 1) < 0.03) {
    regime = '限界流 (Critical)';
  } else if (froudeNumber > 1) {
    regime = '射流 (Supercritical)';
  }

  return {
    area: round2(area),
    wettedPerimeter: round2(wettedPerimeter),
    hydraulicRadius: round2(hydraulicRadius),
    topWidth: round2(topWidth),
    velocity: round2(velocity),
    discharge: round2(discharge),
    froudeNumber: round2(froudeNumber),
    regime,
  };
}
