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
  tensionCrackDepth: number; // 壁内における引張亀裂深さ z0 (m, 0〜H にクランプ)
  theoreticalTensionCrackDepth: number; // 理論上の引張亀裂深さ z0_th (m, クランプ前)
  isFullHeightTension: boolean; // 壁全高にわたり主働土圧が引張域 (z0_th >= H) か
  totalActiveForce: number; // 主働土圧合力 Pa (kN/m)（引張領域無視・正値のみ積分）
  totalPassiveForce: number; // 受働土圧合力 Pp (kN/m)
  activeForceHeight: number | null; // 主働土圧合力の作用位置（壁底からの高さ ya, m）
  passiveForceHeight: number; // 受働土圧合力の作用位置（壁底からの高さ yp, m）
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
  let theoreticalZ0 = 0;
  let z0 = 0;
  if (paTopRaw < 0) {
    theoreticalZ0 = (2 * c * sqrtKa - q * ka) / (gamma * ka);
    z0 = Math.min(H, theoreticalZ0);
  }
  const isFullHeightTension = paBottomRaw <= 1e-9;

  const effectiveH = Math.max(0, H - z0);
  const paAtZ0 = Math.max(0, paTopRaw);
  const paAtBottomPos = Math.max(0, paBottomRaw);
  const totalActiveForce = 0.5 * (paAtZ0 + paAtBottomPos) * effectiveH;
  const totalPassiveForce = 0.5 * (ppTop + ppBottom) * H;

  // 台形分布の図心（壁底からの高さ）: y = (h_eff / 3) * (2 * p_top + p_bot) / (p_top + p_bot)
  const activeForceHeight =
    totalActiveForce > 1e-9 && paAtZ0 + paAtBottomPos > 1e-9
      ? (effectiveH / 3) * ((2 * paAtZ0 + paAtBottomPos) / (paAtZ0 + paAtBottomPos))
      : null;
  const passiveForceHeight =
    ppTop + ppBottom > 1e-9 ? (H / 3) * ((2 * ppTop + ppBottom) / (ppTop + ppBottom)) : H / 3;

  return {
    ka: Math.round(ka * 1000) / 1000,
    kp: Math.round(kp * 1000) / 1000,
    paTop: round2(paTopRaw),
    paBottom: round2(paBottomRaw),
    ppTop: round2(ppTop),
    ppBottom: round2(ppBottom),
    tensionCrackDepth: round2(z0),
    theoreticalTensionCrackDepth: round2(theoreticalZ0),
    isFullHeightTension,
    totalActiveForce: round2(totalActiveForce),
    totalPassiveForce: round2(totalPassiveForce),
    activeForceHeight: activeForceHeight !== null ? round2(activeForceHeight) : null,
    passiveForceHeight: round2(passiveForceHeight),
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
  shearAtLoadLeft: number; // x = a^- のせん断力 V(a^-) (kN)
  shearAtLoadRight: number; // x = a^+ のせん断力 V(a^+) (kN)
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

  // 等間隔グリッドに加えて特異点（x=a の左右極限・M_max 位置）を厳密に含める
  const steps = 40;
  const xPoints = new Set<number>([0, L, maxMomentPos]);
  for (let i = 1; i < steps; i++) {
    xPoints.add((L * i) / steps);
  }
  if (P > 0) {
    xPoints.add(a);
  }
  const rawSortedX = Array.from(xPoints).sort((u, v) => u - v);
  const sortedX: number[] = [];
  for (const x of rawSortedX) {
    if (sortedX.length === 0 || Math.abs(x - sortedX[sortedX.length - 1]) > 1e-9) {
      sortedX.push(x);
    }
  }

  const samples: { x: number; v: number; m: number }[] = [];
  for (const x of sortedX) {
    const isAtLoad = P > 0 && Math.abs(x - a) < 1e-9;
    if (isAtLoad) {
      // 集中荷重作用点の直前・直後を連続して記録し SFD の垂直段差を正確に表現
      if (a > 1e-9) {
        samples.push({
          x: round2(a),
          v: round2(evalShear(a, false)),
          m: round2(evalMoment(a)),
        });
      }
      if (a < L - 1e-9) {
        samples.push({
          x: round2(a),
          v: round2(evalShear(a, true)),
          m: round2(evalMoment(a)),
        });
      }
    } else {
      samples.push({
        x: round2(x),
        v: round2(evalShear(x, false)),
        m: round2(evalMoment(x)),
      });
    }
  }

  const maxShear = Math.max(Math.abs(ra), Math.abs(rb));
  const shearAtLoadLeft = evalShear(a, false);
  const shearAtLoadRight = evalShear(a, P > 0);

  return {
    ra: round2(ra),
    rb: round2(rb),
    maxMoment: round2(maxMoment),
    maxMomentPos: round2(maxMomentPos),
    maxShear: round2(maxShear),
    shearAtLoadLeft: round2(shearAtLoadLeft),
    shearAtLoadRight: round2(shearAtLoadRight),
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

// 4. 片持ち梁（左端固定 x=0・右端自由 x=L、集中荷重 P at x=a、等分布荷重 w、自由端時計回りモーメント M0、曲げ剛性 EI）
export interface CantileverInputs {
  span: number; // スパン L (m)
  pointLoad: number; // 集中荷重 P (kN, 下向き正)
  loadPos: number; // 集中荷重載荷位置 a (m, 0 < a <= L)
  udl: number; // 等分布荷重 w (kN/m, 下向き正)
  endMoment: number; // 自由端モーメント M0 (kN·m, 時計回り・下向きに曲げる向きを正)
  elasticModulusGPa: number; // ヤング率 E (GPa)
  sectionWidth: number; // 矩形断面幅 b (m)
  sectionHeight: number; // 矩形断面高さ h (m)
}

export interface CantileverResult {
  reactionForce: number; // 固定端鉛直反力 RA (kN)
  reactionMoment: number; // 固定端曲げモーメント MA (kN·m, 下側引張正規約のため負値)
  momentOfInertia: number; // 断面二次モーメント I = bh^3/12 (m^4)
  flexuralRigidity: number; // 曲げ剛性 EI (kN·m^2)
  maxShear: number; // 最大せん断力 |V|_max (kN)
  maxAbsMoment: number; // 最大曲げモーメント絶対値 |M|_max (kN·m)
  tipDeflectionMm: number; // 自由端たわみ δ_max (mm, 下向き正)
  tipSlopeMrad: number; // 自由端たわみ角 θ_max (mrad, 時計回り正)
  deflectionRatio: number | null; // L / δ_max（δ_max > 0 の場合）
  samples: { x: number; v: number; m: number; deflectionMm: number }[];
}

export function calculateCantileverBeam(inputs: CantileverInputs): CantileverResult {
  const L = Math.max(0.5, inputs.span);
  const P = Math.max(0, inputs.pointLoad);
  const a = Math.max(0.1, Math.min(L, inputs.loadPos));
  const w = Math.max(0, inputs.udl);
  const M0 = Math.max(0, inputs.endMoment);
  const E = Math.max(1, inputs.elasticModulusGPa);
  const b = Math.max(0.05, inputs.sectionWidth);
  const h = Math.max(0.05, inputs.sectionHeight);

  const I = (b * Math.pow(h, 3)) / 12; // m^4
  const EI = E * 1e6 * I; // kN·m^2 (1 GPa = 10^6 kN/m^2)

  const reactionForce = P + w * L;
  const reactionMoment = -(P * a + (w * L * L) / 2 + M0);

  const evalShear = (x: number, afterLoad: boolean) => {
    const base = w * (L - x);
    if (P <= 0) return base;
    return afterLoad || x > a ? base : base + P;
  };

  const evalMoment = (x: number) => {
    const base = -0.5 * w * Math.pow(L - x, 2) - M0;
    return x <= a ? base - P * (a - x) : base;
  };

  const evalDeflectionM = (x: number) => {
    const dP =
      x <= a
        ? (P * x * x * (3 * a - x)) / (6 * EI)
        : (P * a * a * (3 * x - a)) / (6 * EI);
    const dW = (w * x * x * (6 * L * L - 4 * L * x + x * x)) / (24 * EI);
    const dM = (M0 * x * x) / (2 * EI);
    return dP + dW + dM;
  };

  const tipSlopeRad =
    (P * a * a) / (2 * EI) + (w * Math.pow(L, 3)) / (6 * EI) + (M0 * L) / EI;
  const tipDeflectionM = evalDeflectionM(L);
  const tipDeflectionMm = tipDeflectionM * 1000;
  const deflectionRatio = tipDeflectionM > 1e-9 ? Math.round(L / tipDeflectionM) : null;

  const steps = 40;
  const xPoints = new Set<number>([0, L]);
  for (let i = 1; i < steps; i++) {
    xPoints.add((L * i) / steps);
  }
  if (P > 0) {
    xPoints.add(a);
  }
  const rawSortedX = Array.from(xPoints).sort((u, v) => u - v);
  const sortedX: number[] = [];
  for (const x of rawSortedX) {
    if (sortedX.length === 0 || Math.abs(x - sortedX[sortedX.length - 1]) > 1e-9) {
      sortedX.push(x);
    }
  }

  const samples: { x: number; v: number; m: number; deflectionMm: number }[] = [];
  for (const x of sortedX) {
    const isAtLoad = P > 0 && Math.abs(x - a) < 1e-9;
    const defl = round2(evalDeflectionM(x) * 1000);
    if (isAtLoad) {
      if (a > 1e-9) {
        samples.push({
          x: round2(a),
          v: round2(evalShear(a, false)),
          m: round2(evalMoment(a)),
          deflectionMm: defl,
        });
      }
      if (a < L - 1e-9) {
        samples.push({
          x: round2(a),
          v: round2(evalShear(a, true)),
          m: round2(evalMoment(a)),
          deflectionMm: defl,
        });
      }
    } else {
      samples.push({
        x: round2(x),
        v: round2(evalShear(x, false)),
        m: round2(evalMoment(x)),
        deflectionMm: defl,
      });
    }
  }

  return {
    reactionForce: round2(reactionForce),
    reactionMoment: round2(reactionMoment),
    momentOfInertia: Math.round(I * 1e6) / 1e6,
    flexuralRigidity: Math.round(EI),
    maxShear: round2(reactionForce),
    maxAbsMoment: round2(Math.abs(reactionMoment)),
    tipDeflectionMm: round2(tipDeflectionMm),
    tipSlopeMrad: round2(tipSlopeRad * 1000),
    deflectionRatio,
    samples,
  };
}

// 5. 比エネルギー曲線・限界水深・跳水（長方形断面開水路）
export interface SpecificEnergyInputs {
  discharge: number; // 流量 Q (m^3/s)
  width: number; // 水路幅 B (m)
  depth1: number; // 上流（対象）水深 h1 (m)
}

export interface SpecificEnergyResult {
  unitDischarge: number; // 単位幅流量 q = Q/B (m^2/s)
  criticalDepth: number; // 限界水深 hc = (q^2 / g)^(1/3) (m)
  criticalVelocity: number; // 限界流速 vc = sqrt(g * hc) (m/s)
  minSpecificEnergy: number; // 最小比エネルギー E_min = 1.5 * hc (m)
  velocity1: number; // 流速 v1 = q / h1 (m/s)
  froude1: number; // フルード数 Fr1
  specificEnergy1: number; // 比エネルギー E1 = h1 + v1^2/(2g) (m)
  regime1: '常流 (Subcritical)' | '限界流 (Critical)' | '射流 (Supercritical)';
  alternateDepth: number; // 同一比エネルギーの交代水深 h_alt (m)
  canJump: boolean; // 跳水が発生するか (Fr1 > 1.02)
  sequentDepth: number | null; // 跳水後共役水深 h2 (m)
  velocity2: number | null; // 跳水後流速 v2 (m/s)
  froude2: number | null; // 跳水後フルード数 Fr2
  specificEnergy2: number | null; // 跳水後比エネルギー E2 (m)
  energyLoss: number; // 跳水エネルギー損失 ΔE = E1 - E2 (m)
  energyLossRatioPercent: number; // エネルギー損失率 ΔE / E1 (%)
  jumpType: string; // 跳水タイプ（USBR分類）
  curvePoints: { h: number; e: number }[];
}

const GRAVITY = 9.80665;

export function calculateSpecificEnergyAndJump(
  inputs: SpecificEnergyInputs
): SpecificEnergyResult {
  const Q = Math.max(0.2, inputs.discharge);
  const B = Math.max(0.2, inputs.width);
  const h1 = Math.max(0.05, inputs.depth1);

  const q = Q / B;
  const hc = Math.cbrt((q * q) / GRAVITY);
  const vc = Math.sqrt(GRAVITY * hc);
  const eMin = 1.5 * hc;

  const v1 = q / h1;
  const fr1 = v1 / Math.sqrt(GRAVITY * h1);
  const e1 = h1 + (v1 * v1) / (2 * GRAVITY);

  let regime1: SpecificEnergyResult['regime1'] = '常流 (Subcritical)';
  if (Math.abs(fr1 - 1) <= 0.02) {
    regime1 = '限界流 (Critical)';
  } else if (fr1 > 1.02) {
    regime1 = '射流 (Supercritical)';
  }

  // 交代水深 h_alt の厳密閉形式解: (h - h1)(h^2 - (v1^2/2g) h - q^2/(2 g h1)) = 0
  let hAlt = hc;
  if (Math.abs(h1 - hc) > 1e-4 * hc) {
    const vHead = (q * q) / (2 * GRAVITY * h1 * h1);
    const cq = (q * q) / (2 * GRAVITY * h1);
    hAlt = 0.5 * (vHead + Math.sqrt(vHead * vHead + 4 * cq));
  }

  const canJump = fr1 > 1.02;
  let h2: number | null = null;
  let v2: number | null = null;
  let fr2: number | null = null;
  let e2: number | null = null;
  let deltaE = 0;
  let lossRatio = 0;
  let jumpType = '跳水なし（常流・限界流）';

  if (canJump) {
    h2 = (h1 / 2) * (Math.sqrt(1 + 8 * fr1 * fr1) - 1);
    v2 = q / h2;
    fr2 = v2 / Math.sqrt(GRAVITY * h2);
    e2 = h2 + (v2 * v2) / (2 * GRAVITY);
    deltaE = Math.max(0, e1 - e2);
    lossRatio = e1 > 1e-9 ? (deltaE / e1) * 100 : 0;

    if (fr1 <= 1.7) {
      jumpType = '波状跳水 (Undular Jump)';
    } else if (fr1 <= 2.5) {
      jumpType = '弱跳水 (Weak Jump)';
    } else if (fr1 <= 4.5) {
      jumpType = '振動跳水 (Oscillating Jump)';
    } else if (fr1 <= 9.0) {
      jumpType = '定常跳水 (Steady Jump)';
    } else {
      jumpType = '強跳水 (Strong Jump)';
    }
  }

  // E(h) 曲線サンプル（h_min 〜 h_max の範囲で滑らかに生成）
  const hMaxPlot = Math.max(hc * 3.2, h1 * 1.4, (h2 ?? hc) * 1.35, hAlt * 1.25, 2.0);
  const hMinPlot = Math.max(0.08, Math.min(hc * 0.28, h1 * 0.65));
  const curvePoints: { h: number; e: number }[] = [];
  const sampleCount = 64;
  for (let i = 0; i <= sampleCount; i++) {
    // 対数分布で低水深（射流側）の急勾配も滑らかにサンプリング
    const t = i / sampleCount;
    const h = hMinPlot * Math.pow(hMaxPlot / hMinPlot, t);
    const e = h + (q * q) / (2 * GRAVITY * h * h);
    curvePoints.push({ h: round2(h), e: round2(e) });
  }

  return {
    unitDischarge: round2(q),
    criticalDepth: round2(hc),
    criticalVelocity: round2(vc),
    minSpecificEnergy: round2(eMin),
    velocity1: round2(v1),
    froude1: round2(fr1),
    specificEnergy1: round2(e1),
    regime1,
    alternateDepth: round2(hAlt),
    canJump,
    sequentDepth: h2 !== null ? round2(h2) : null,
    velocity2: v2 !== null ? round2(v2) : null,
    froude2: fr2 !== null ? round2(fr2) : null,
    specificEnergy2: e2 !== null ? round2(e2) : null,
    energyLoss: round2(deltaE),
    energyLossRatioPercent: round2(lossRatio),
    jumpType,
    curvePoints,
  };
}
