import React, { useMemo, useState } from 'react';
import {
  calculateBoussinesqPoint,
  calculateFlamantLine,
  calculateGeostaticStress,
  calculateStripLoad,
  calculateStripSuperposition,
  round2,
} from '../../utils/continuumPhysics';
import { SliderInput } from '../SliderInput';
import { MathFormula } from '../MathFormula';
import { ChapterExercisePanel, type ContinuumExercise } from './ChapterExercisePanel';

interface Ch5Props {
  completedIds: string[];
  onToggleDone: (id: string) => void;
  onMarkDone: (id: string) => void;
}

type GroundSubMode = 'equilibrium' | 'boussinesq' | 'superposition';

export const Ch5ElasticGroundStress: React.FC<Ch5Props> = ({
  completedIds,
  onToggleDone,
  onMarkDone,
}) => {
  const [subMode, setSubMode] = useState<GroundSubMode>('boussinesq');

  // Sub-mode A: 自重・つり合い
  const [gamma, setGamma] = useState(18);
  const [gammaSat, setGammaSat] = useState(20);
  const [waterZ, setWaterZ] = useState(2);
  const [k0, setK0] = useState(0.5);
  const [evalZGeo, setEvalZGeo] = useState(6);

  // Sub-mode B: Boussinesq 集中荷重
  const [loadP, setLoadP] = useState(1000);
  const [evalR, setEvalR] = useState(1.0);
  const [evalZB, setEvalZB] = useState(2.0);
  const [nuB, setNuB] = useState(0.3);

  // Sub-mode C: 線荷重・帯荷重重ね合わせ
  const [stripQ, setStripQ] = useState(100);
  const [stripB, setStripB] = useState(4.0);
  const [stripX, setStripX] = useState(0.0);
  const [stripZ, setStripZ] = useState(2.0);
  const [divisions, setDivisions] = useState(5);

  const geoEval = useMemo(
    () =>
      calculateGeostaticStress({
        depthZ: evalZGeo,
        gamma,
        gammaSat,
        waterTableZ: waterZ,
        k0,
      }),
    [evalZGeo, gamma, gammaSat, waterZ, k0]
  );

  const bouss = useMemo(
    () => calculateBoussinesqPoint(loadP, evalR, evalZB, nuB),
    [loadP, evalR, evalZB, nuB]
  );

  const flamantEquiv = useMemo(
    () => calculateFlamantLine(stripQ * stripB, stripX, stripZ),
    [stripQ, stripB, stripX, stripZ]
  );

  const superRes = useMemo(
    () => calculateStripSuperposition(stripQ, stripB, stripX, stripZ, divisions),
    [stripQ, stripB, stripX, stripZ, divisions]
  );

  // Boussinesq 圧力球根（等値線ヒートマップセル生成）
  const boussCells = useMemo(() => {
    const cells: { r: number; z: number; val: number }[] = [];
    const rSteps = 28;
    const zSteps = 18;
    for (let iz = 0; iz < zSteps; iz++) {
      const z = 0.35 + iz * 0.45;
      for (let ir = -rSteps / 2; ir < rSteps / 2; ir++) {
        const r = (ir + 0.5) * 0.45;
        const val = calculateBoussinesqPoint(loadP, Math.abs(r), z, nuB).deltaSigmaZ;
        cells.push({ r, z, val });
      }
    }
    return cells;
  }, [loadP, nuB]);

  // 重ね合わせ横断面プロファイル (x = -6m ~ +6m)
  const profilePoints = useMemo(() => {
    const pts: { x: number; exact: number; approx: number }[] = [];
    for (let i = -30; i <= 30; i++) {
      const x = i * 0.2;
      const exact = calculateStripLoad(stripQ, stripB, x, stripZ).deltaSigmaZ;
      const approx = calculateStripSuperposition(
        stripQ,
        stripB,
        x,
        stripZ,
        divisions
      ).superposed.deltaSigmaZ;
      pts.push({ x, exact, approx });
    }
    return pts;
  }, [stripQ, stripB, stripZ, divisions]);

  const exercises: ContinuumExercise[] = [
    {
      id: 'ch5-q1',
      title: '問1：Boussinesq の解による集中荷重直下の鉛直応力増分 Δσ_z',
      category: 'Boussinesq 集中荷重解',
      statement:
        '半無限弾性地盤の地表面に集中荷重 P = 1000 kN が作用している。荷重点の直下（水平距離 r = 0 m）、深さ z = 2.0 m の位置における鉛直応力増分 Δσ_z を求めよ。',
      kind: 'numeric',
      expectedValue: 119.37,
      tolerance: 1.0,
      unit: 'kPa',
      inputHint: 'r = 0 より R = z となり、影響係数は 3/(2π) ≈ 0.4775 になります。',
      hint: 'Δσ_z = (3P / (2π z²)) × [1 + (r/z)²]^(-5/2) に r = 0, z = 2.0, P = 1000 を代入します。',
      steps: [
        {
          label: 'r = 0 における Boussinesq の公式を整理する',
          math: '\\Delta\\sigma_z = \\frac{3P}{2\\pi z^2}\\left[1 + \\left(\\frac{r}{z}\\right)^2\\right]^{-5/2} = \\frac{3P}{2\\pi z^2}',
        },
        {
          label: 'P = 1000 kN, z = 2.0 m を代入する',
          math: '\\Delta\\sigma_z = \\frac{3 \\times 1000}{2\\pi \\times 2.0^2} = \\frac{3000}{8\\pi} \\approx 119.37\\text{ kPa}',
        },
      ],
      answerSummary: '119.37 kPa',
      onApplyPreset: () => {
        setSubMode('boussinesq');
        setLoadP(1000);
        setEvalR(0);
        setEvalZB(2.0);
      },
    },
    {
      id: 'ch5-q2',
      title: '問2：線荷重の積分（重ね合わせ）で得られる帯荷重中心直下の Δσ_z',
      category: '重ね合わせと帯荷重解',
      statement:
        '地表面に幅 B = 4.0 m の帯状等分布荷重 q = 100 kPa が作用している。中心軸上（x = 0 m）、深さ z = 2.0 m における鉛直応力増分 Δσ_z を求めよ。',
      kind: 'numeric',
      expectedValue: 81.83,
      tolerance: 1.0,
      unit: 'kPa',
      inputHint: '中心軸上 x=0 では見込み角 α = 2 arctan((B/2)/z) となります。',
      hint: 'z = 2 m, b = B/2 = 2 m より見込み半角 β = arctan(2/2) = 45° (= π/4 rad) です。Δσ_z = (q/π)(2β + sin(2β)) に代入します。',
      steps: [
        {
          label: '見込み角 α = 2β と方向角 δ を求める',
          math: '\\beta = \\arctan\\left(\\frac{B/2}{z}\\right) = \\arctan(1) = \\frac{\\pi}{4}\\text{ rad},\\quad \\alpha = 2\\beta = \\frac{\\pi}{2},\\quad \\delta = 0',
        },
        {
          label: '帯荷重の積分公式に代入する',
          math: '\\Delta\\sigma_z = \\frac{q}{\\pi}\\left(\\alpha + \\sin\\alpha\\cos 2\\delta\\right) = \\frac{100}{\\pi}\\left(\\frac{\\pi}{2} + \\sin\\frac{\\pi}{2}\\right) = 50 + \\frac{100}{\\pi} \\approx 81.83\\text{ kPa}',
        },
      ],
      answerSummary: '81.83 kPa',
      onApplyPreset: () => {
        setSubMode('superposition');
        setStripQ(100);
        setStripB(4.0);
        setStripX(0);
        setStripZ(2.0);
        setDivisions(20);
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. 理解 */}
      <section className="app-surface rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <h2 className="text-base sm:text-lg font-bold">
            1. 理解：力のつり合い条件から Boussinesq・重ね合わせ積分へ
          </h2>
          <span className="rounded-md bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
            第5章：弾性地盤内の応力
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm leading-relaxed">
          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">① 空間分布応力へのつり合い条件</h3>
            <p className="text-xs app-text-muted">
              場所ごとに応力が変化するとき、微小要素の表裏の差（応力勾配）と自重 <MathFormula math="\gamma" /> がつり合う必要があります。
            </p>
            <MathFormula
              block
              math={`\\begin{aligned} \\frac{\\partial\\sigma_x}{\\partial x}+\\frac{\\partial\\tau_{zx}}{\\partial z} &= 0 \\\\ \\frac{\\partial\\tau_{xz}}{\\partial x}+\\frac{\\partial\\sigma_z}{\\partial z} &= \\gamma \\end{aligned}`}
            />
          </div>

          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">② 集中荷重（Boussinesq の解）</h3>
            <p className="text-xs app-text-muted">
              半無限等方弾性体表面への点荷重 <MathFormula math="P" /> に対する厳密解。深さ <MathFormula math="z" /> の2乗に反比例して急減し、圧力球根を作ります。
            </p>
            <MathFormula
              block
              math={`\\Delta\\sigma_z = \\frac{3P}{2\\pi z^2}\\left[1+\\left(\\frac{r}{z}\\right)^2\\right]^{-5/2}`}
            />
          </div>

          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">③ 重ね合わせ（線荷重 → 帯荷重）</h3>
            <p className="text-xs app-text-muted">
              線形弾性体では解の重ね合わせ（積分）が成立！点荷重を奥行きに積分すると<strong>線荷重（Flamant）</strong>、さらに幅 <MathFormula math="B" /> に積分すると<strong>帯荷重</strong>になります。
            </p>
            <MathFormula
              block
              math={`\\Delta\\sigma_z = \\frac{q}{\\pi}\\left(\\alpha + \\sin\\alpha\\cos 2\\delta\\right)`}
            />
          </div>
        </div>
      </section>

      {/* 2. 想像 */}
      <section className="space-y-4">
        {/* サブモード切替バー */}
        <div className="app-surface rounded-xl p-2 flex flex-wrap gap-2">
          {(
            [
              { id: 'equilibrium', label: 'A. 力のつり合い条件と自重応力' },
              { id: 'boussinesq', label: 'B. Boussinesq 集中荷重と圧力球根' },
              { id: 'superposition', label: 'C. 解の重ね合わせ積分（線荷重 → 帯荷重）' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSubMode(m.id)}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer transition-colors ${
                subMode === m.id
                  ? 'bg-blue-700 text-white'
                  : 'app-surface-subtle hover:opacity-90'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {subMode === 'equilibrium' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <aside className="lg:col-span-4 app-surface rounded-xl p-4 space-y-3.5 shadow-sm">
              <h3 className="text-sm font-bold border-b border-[var(--border-subtle)] pb-2">
                地盤パラメータと評価深さ
              </h3>
              <SliderInput label="地下水面上の単位体積重量" symbol="γ" unit="kN/m³" value={gamma} min={14} max={21} step={0.5} onChange={setGamma} />
              <SliderInput label="飽和単位体積重量" symbol="γ_sat" unit="kN/m³" value={gammaSat} min={16} max={23} step={0.5} onChange={setGammaSat} />
              <SliderInput label="地下水位の深さ" symbol="z_w" unit="m" value={waterZ} min={0} max={10} step={0.5} onChange={setWaterZ} />
              <SliderInput label="静止土圧係数" symbol="K₀" unit="" value={k0} min={0.3} max={1.0} step={0.05} onChange={setK0} />
              <SliderInput label="注目する深さ" symbol="z" unit="m" value={evalZGeo} min={0.5} max={10} step={0.5} onChange={setEvalZGeo} />
            </aside>

            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 微分つり合い要素SVG */}
              <div className="app-surface rounded-xl p-4 space-y-2 shadow-sm">
                <h4 className="text-xs font-bold">微小要素の応力勾配と自重のつり合い</h4>
                <svg viewBox="0 0 280 230" className="w-full h-auto select-none" role="img" aria-label="微分形の力のつり合い条件を示す微小土要素">
                  <rect x="85" y="65" width="110" height="90" fill="var(--diagram-blue)" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.8" />
                  <text x="140" y="34" textAnchor="middle" className="text-[11px] font-bold fill-[var(--diagram-blue)]">
                    σ_z (上端)
                  </text>
                  <line x1="140" y1="40" x2="140" y2="62" stroke="var(--diagram-blue)" strokeWidth="2.2" />
                  <line x1="140" y1="184" x2="140" y2="158" stroke="var(--diagram-blue)" strokeWidth="2.2" />
                  <text x="140" y="200" textAnchor="middle" className="text-[11px] font-bold fill-[var(--diagram-blue)]">
                    σ_z + (∂σ_z/∂z)dz
                  </text>
                  <text x="140" y="114" textAnchor="middle" className="text-xs font-bold fill-[var(--diagram-amber)]">
                    自重 γ·dx·dz ↓
                  </text>
                  <text x="38" y="112" textAnchor="middle" className="text-[10px] font-semibold fill-[var(--diagram-teal)]">
                    τ_xz
                  </text>
                  <text x="238" y="112" textAnchor="middle" className="text-[10px] font-semibold fill-[var(--diagram-teal)]">
                    τ_xz+(∂τ/∂x)dx
                  </text>
                </svg>
                <p className="text-xs app-text-muted leading-relaxed">
                  水平一様地盤（<MathFormula math="\partial/\partial x=0,\ \tau_{xz}=0" />）では <MathFormula math="\frac{d\sigma_z}{dz} = \gamma" /> となり、積分すると自重応力 <MathFormula math="\sigma_v = \int\gamma\,dz" /> が導かれます。
                </p>
              </div>

              {/* 深度分布プロット */}
              <div className="app-surface rounded-xl p-4 space-y-2 shadow-sm">
                <h4 className="text-xs font-bold">深度別 全応力・水圧・有効応力プロファイル</h4>
                <svg viewBox="0 0 280 230" className="w-full h-auto select-none" role="img" aria-label="深さ方向の全応力・間隙水圧・有効応力分布図">
                  {/* 座標軸 */}
                  <line x1="40" y1="25" x2="260" y2="25" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" />
                  <line x1="40" y1="25" x2="40" y2="210" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" />
                  <text x="256" y="18" textAnchor="end" className="text-[10px] fill-current">応力 (kPa)</text>
                  <text x="12" y="208" className="text-[10px] fill-current">z=10m</text>

                  {/* 地下水位線 */}
                  <line
                    x1="40"
                    y1={25 + (waterZ / 10) * 180}
                    x2="260"
                    y2={25 + (waterZ / 10) * 180}
                    stroke="var(--diagram-sky)"
                    strokeDasharray="4 3"
                    strokeWidth="1.3"
                  />
                  <text x="256" y={21 + (waterZ / 10) * 180} textAnchor="end" className="text-[10px] fill-[var(--diagram-sky)]">
                    地下水位 z_w={waterZ}m
                  </text>

                  {/* ポリライン描画 (max stress ~240 kPa) */}
                  {(['sigmaVTotal', 'sigmaVEff', 'poreWaterU', 'sigmaHEff'] as const).map((key) => {
                    const colors: Record<typeof key, string> = {
                      sigmaVTotal: 'var(--diagram-muted)',
                      sigmaVEff: 'var(--diagram-blue)',
                      poreWaterU: 'var(--diagram-sky)',
                      sigmaHEff: 'var(--diagram-teal)',
                    };
                    const pts = Array.from({ length: 21 }, (_, idx) => {
                      const z = idx * 0.5;
                      const g = calculateGeostaticStress({
                        depthZ: z,
                        gamma,
                        gammaSat,
                        waterTableZ: waterZ,
                        k0,
                      });
                      const xPx = 40 + Math.min(210, (g[key] / 240) * 210);
                      const yPx = 25 + (z / 10) * 180;
                      return `${xPx.toFixed(1)},${yPx.toFixed(1)}`;
                    }).join(' ');
                    return (
                      <polyline
                        key={key}
                        fill="none"
                        stroke={colors[key]}
                        strokeWidth={key === 'sigmaVEff' ? '2.4' : '1.8'}
                        strokeDasharray={key === 'sigmaVTotal' ? '4 3' : undefined}
                        points={pts}
                      />
                    );
                  })}

                  {/* 評価深さマーカー */}
                  <circle
                    cx={40 + Math.min(210, (geoEval.sigmaVEff / 240) * 210)}
                    cy={25 + (evalZGeo / 10) * 180}
                    r="4.5"
                    fill="var(--diagram-blue)"
                    stroke="var(--diagram-halo)"
                    strokeWidth="1.5"
                  />
                </svg>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono-num">
                  <div className="app-surface-subtle rounded p-2">
                    σ_v = {round2(geoEval.sigmaVTotal)} kPa<br />
                    u = {round2(geoEval.poreWaterU)} kPa
                  </div>
                  <div className="app-surface-subtle rounded p-2">
                    σ'_v = {round2(geoEval.sigmaVEff)} kPa<br />
                    σ'_h = {round2(geoEval.sigmaHEff)} kPa
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {subMode === 'boussinesq' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <aside className="lg:col-span-4 app-surface rounded-xl p-4 space-y-3.5 shadow-sm">
              <h3 className="text-sm font-bold border-b border-[var(--border-subtle)] pb-2">
                集中荷重・観測点パラメータ
              </h3>
              <SliderInput label="集中荷重" symbol="P" unit="kN" value={loadP} min={100} max={3000} step={50} onChange={setLoadP} />
              <SliderInput label="水平距離" symbol="r" unit="m" value={evalR} min={0} max={6} step={0.2} onChange={setEvalR} />
              <SliderInput label="深さ" symbol="z" unit="m" value={evalZB} min={0.5} max={8} step={0.2} onChange={setEvalZB} />
              <SliderInput label="ポアソン比" symbol="ν" unit="" value={nuB} min={0.0} max={0.49} step={0.01} onChange={setNuB} />
            </aside>

            <div className="lg:col-span-8 space-y-4">
              <div className="app-surface rounded-xl overflow-hidden shadow-sm">
                <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2 flex items-center justify-between text-xs font-semibold">
                  <span>Boussinesq の解による「圧力球根（Δσ_z 分布ヒートマップ）」</span>
                  <span className="font-mono-num">P = {loadP} kN</span>
                </div>
                <svg viewBox="0 0 520 290" className="w-full h-auto block select-none" role="img" aria-label="Boussinesq 集中荷重による地中鉛直応力増分の圧力球根図">
                  {/* 地表面ライン */}
                  <line x1="20" y1="36" x2="500" y2="36" stroke="currentColor" strokeWidth="2" />
                  {/* 集中荷重矢印 */}
                  <line x1="260" y1="6" x2="260" y2="33" stroke="var(--diagram-red)" strokeWidth="3" />
                  <polygon points="260,36 254,26 266,26" fill="var(--diagram-red)" />
                  <text x="272" y="22" className="text-xs font-bold fill-[var(--diagram-red)] font-mono-num">
                    P = {loadP} kN
                  </text>

                  {/* 圧力球根ヒートマップセル */}
                  {boussCells.map((cell, idx) => {
                    const xPx = 260 + cell.r * 36;
                    const yPx = 36 + cell.z * 28;
                    const ratio = Math.min(1, cell.val / Math.max(20, loadP * 0.12));
                    const opacity = Math.max(0.06, Math.pow(ratio, 0.5) * 0.82);
                    return (
                      <rect
                        key={idx}
                        x={xPx - 8.5}
                        y={yPx - 6.5}
                        width="17"
                        height="13.5"
                        fill="var(--diagram-blue)"
                        fillOpacity={opacity}
                      />
                    );
                  })}

                  {/* 観測点マーカー */}
                  <line x1="260" y1="36" x2={260 + evalR * 36} y2={36 + evalZB * 28} stroke="var(--diagram-amber)" strokeWidth="1.5" strokeDasharray="4 3" />
                  <circle cx={260 + evalR * 36} cy={36 + evalZB * 28} r="5.5" fill="var(--diagram-amber)" stroke="var(--diagram-halo)" strokeWidth="1.5" />
                  <text x={260 + evalR * 36 + 8} y={36 + evalZB * 28 + 4} className="text-xs font-bold fill-[var(--diagram-amber)] font-mono-num">
                    (r={evalR}m, z={evalZB}m): Δσ_z={round2(bouss.deltaSigmaZ)} kPa
                  </text>
                </svg>
              </div>

              <div className="app-surface rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="app-surface-subtle rounded-lg p-2.5">
                  <div className="app-text-muted">鉛直増分 Δσ_z</div>
                  <div className="font-bold font-mono-num text-blue-700 dark:text-blue-300 text-sm">{round2(bouss.deltaSigmaZ)} kPa</div>
                </div>
                <div className="app-surface-subtle rounded-lg p-2.5">
                  <div className="app-text-muted">半径方向 Δσ_r</div>
                  <div className="font-bold font-mono-num text-sm">{round2(bouss.deltaSigmaR)} kPa</div>
                </div>
                <div className="app-surface-subtle rounded-lg p-2.5">
                  <div className="app-text-muted">円周方向 Δσ_θ</div>
                  <div className="font-bold font-mono-num text-sm">{round2(bouss.deltaSigmaTheta)} kPa</div>
                </div>
                <div className="app-surface-subtle rounded-lg p-2.5">
                  <div className="app-text-muted">せん断増分 Δτ_rz</div>
                  <div className="font-bold font-mono-num text-teal-700 dark:text-teal-300 text-sm">{round2(bouss.deltaTauRZ)} kPa</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {subMode === 'superposition' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <aside className="lg:col-span-4 app-surface rounded-xl p-4 space-y-3.5 shadow-sm">
              <h3 className="text-sm font-bold border-b border-[var(--border-subtle)] pb-2">
                帯荷重・重ね合わせ分割数パラメータ
              </h3>
              <SliderInput label="等分布荷重強度" symbol="q" unit="kPa" value={stripQ} min={20} max={300} step={10} onChange={setStripQ} />
              <SliderInput label="載荷幅" symbol="B" unit="m" value={stripB} min={1} max={8} step={0.5} onChange={setStripB} />
              <SliderInput label="評価水平位置" symbol="x" unit="m" value={stripX} min={-5} max={5} step={0.2} onChange={setStripX} />
              <SliderInput label="評価深さ" symbol="z" unit="m" value={stripZ} min={0.4} max={8} step={0.2} onChange={setStripZ} />
              <SliderInput
                label="離散線荷重への分割数"
                symbol="N"
                unit="本"
                value={divisions}
                min={1}
                max={40}
                step={1}
                onChange={setDivisions}
              />
              <p className="text-xs app-text-muted leading-relaxed">
                <strong>N=1</strong> は全荷重 <MathFormula math="qB" /> を1本の線荷重（Flamant解）に集中させた状態。<strong>N を増やす</strong>ほど重ね合わせ和が連続積分の帯荷重解へ収束します！
              </p>
            </aside>

            <div className="lg:col-span-8 space-y-4">
              <div className="app-surface rounded-xl overflow-hidden shadow-sm">
                <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                  <span>線荷重 N={divisions} 本の重ね合わせ vs 積分（帯荷重）解（深さ z={stripZ} m）</span>
                  <span className="font-mono-num text-emerald-700 dark:text-emerald-300">
                    相対誤差: {round2(superRes.relativeErrorPct)}%
                  </span>
                </div>

                <svg viewBox="0 0 540 280" className="w-full h-auto block select-none" role="img" aria-label="離散線荷重の重ね合わせ分布が帯荷重の厳密積分曲線へ収束する比較グラフ">
                  {/* 上段：地表面の離散線荷重表現 */}
                  <line x1="30" y1="54" x2="510" y2="54" stroke="currentColor" strokeWidth="1.8" />
                  <rect
                    x={270 - (stripB / 2) * 38}
                    y="32"
                    width={stripB * 38}
                    height="22"
                    fill="var(--diagram-blue)"
                    fillOpacity="0.16"
                    stroke="var(--diagram-blue)"
                    strokeWidth="1.5"
                  />
                  {Array.from({ length: divisions }, (_, i) => {
                    const u = -stripB / 2 + ((i + 0.5) * stripB) / divisions;
                    const ax = 270 + u * 38;
                    return (
                      <line
                        key={i}
                        x1={ax}
                        y1="14"
                        x2={ax}
                        y2="52"
                        stroke="var(--diagram-red)"
                        strokeWidth={divisions > 20 ? '1' : '1.6'}
                      />
                    );
                  })}

                  {/* 下段：深さ z の横断面分布 Δσ_z(x, z) */}
                  <line x1="40" y1="245" x2="500" y2="245" stroke="currentColor" strokeOpacity="0.5" />
                  <line x1="270" y1="80" x2="270" y2="250" stroke="currentColor" strokeOpacity="0.25" strokeDasharray="3 3" />
                  <text x="500" y="262" textAnchor="end" className="text-[10px] fill-current">水平距離 x (m)</text>
                  <text x="46" y="92" className="text-[10px] fill-current">Δσ_z (kPa)</text>

                  {/* 厳密帯荷重曲線 (実線青) */}
                  <polyline
                    fill="none"
                    stroke="var(--diagram-blue)"
                    strokeWidth="2.5"
                    points={profilePoints
                      .map((p) => {
                        const px = 270 + p.x * 38;
                        const py = 245 - Math.min(155, (p.exact / Math.max(stripQ, 1)) * 145);
                        return `${px.toFixed(1)},${py.toFixed(1)}`;
                      })
                      .join(' ')}
                  />

                  {/* 離散重ね合わせ曲線 (破線赤) */}
                  <polyline
                    fill="none"
                    stroke="var(--diagram-red)"
                    strokeWidth="2"
                    strokeDasharray="5 3"
                    points={profilePoints
                      .map((p) => {
                        const px = 270 + p.x * 38;
                        const py = 245 - Math.min(155, (p.approx / Math.max(stripQ, 1)) * 145);
                        return `${px.toFixed(1)},${py.toFixed(1)}`;
                      })
                      .join(' ')}
                  />

                  {/* 評価点 x マーカー */}
                  <circle
                    cx={270 + stripX * 38}
                    cy={245 - Math.min(155, (superRes.analytical.deltaSigmaZ / Math.max(stripQ, 1)) * 145)}
                    r="5"
                    fill="var(--diagram-blue)"
                    stroke="var(--diagram-halo)"
                    strokeWidth="1.5"
                  />
                </svg>

                <div className="app-surface-subtle border-x-0 border-b-0 px-4 py-2 flex flex-wrap gap-4 text-xs app-text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-0.5 w-4 bg-[var(--diagram-blue)] inline-block" aria-hidden="true" /> 帯荷重・厳密積分解
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-0.5 w-4 border-t-2 border-dashed border-[var(--diagram-red)] inline-block" aria-hidden="true" /> 線荷重 {divisions}本の重ね合わせ
                  </span>
                </div>
              </div>

              <div className="app-surface rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="app-surface-subtle rounded-lg p-3">
                  <div className="app-text-muted">単一線荷重 (Flamant, q_L=qB)</div>
                  <div className="font-bold font-mono-num text-sm">
                    Δσ_z = {round2(flamantEquiv.deltaSigmaZ)} kPa
                  </div>
                </div>
                <div className="app-surface-subtle rounded-lg p-3">
                  <div className="app-text-muted">重ね合わせ和 (N={divisions}本)</div>
                  <div className="font-bold font-mono-num text-red-700 dark:text-red-300 text-sm">
                    Δσ_z = {round2(superRes.superposed.deltaSigmaZ)} kPa
                  </div>
                </div>
                <div className="app-surface-subtle rounded-lg p-3">
                  <div className="app-text-muted">帯荷重 厳密積分解</div>
                  <div className="font-bold font-mono-num text-blue-700 dark:text-blue-300 text-sm">
                    Δσ_z = {round2(superRes.analytical.deltaSigmaZ)} kPa
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. 演習 */}
      <ChapterExercisePanel
        chapterTitle="第5章：弾性地盤内の応力"
        exercises={exercises}
        completedIds={completedIds}
        onToggleDone={onToggleDone}
        onMarkDone={onMarkDone}
      />
    </div>
  );
};
