import React, { useMemo, useState } from 'react';
import {
  calculateBoussinesqSurfaceSettlement,
  calculateHookeDeformation,
  calculateStripElasticSettlement,
  round2,
  round4,
  type DeformationMode,
} from '../../utils/continuumPhysics';
import { SliderInput } from '../SliderInput';
import { MathFormula } from '../MathFormula';
import { ChapterExercisePanel, type ContinuumExercise } from './ChapterExercisePanel';

interface Ch6Props {
  completedIds: string[];
  onToggleDone: (id: string) => void;
  onMarkDone: (id: string) => void;
}

export const Ch6ElasticDeformation: React.FC<Ch6Props> = ({
  completedIds,
  onToggleDone,
  onMarkDone,
}) => {
  const [eMpa, setEMpa] = useState(20);
  const [nu, setNu] = useState(0.25);
  const [mode, setMode] = useState<DeformationMode>('k0-1d');
  const [dSigmaZ, setDSigmaZ] = useState(120);
  const [dSigmaX, setDSigmaX] = useState(40);
  const [dSigmaY, setDSigmaY] = useState(40);
  const [dTauXZ, setDTauXZ] = useState(25);

  // 沈下パネルパラメータ
  const [stripQ, setStripQ] = useState(100);
  const [stripB, setStripB] = useState(4.0);
  const [layerH, setLayerH] = useState(8.0);
  const [pointP, setPointP] = useState(500);

  const def = useMemo(
    () =>
      calculateHookeDeformation({
        eMpa,
        nu,
        mode,
        dSigmaZ,
        dSigmaX,
        dSigmaY,
        dTauXZ,
      }),
    [eMpa, nu, mode, dSigmaZ, dSigmaX, dSigmaY, dTauXZ]
  );

  const settlement = useMemo(
    () => calculateStripElasticSettlement(stripQ, stripB, layerH, eMpa, nu, 6),
    [stripQ, stripB, layerH, eMpa, nu]
  );

  const surfaceProfile = useMemo(() => {
    const pts: { r: number; wMm: number }[] = [];
    for (let i = 1; i <= 24; i++) {
      const r = i * 0.25;
      pts.push({
        r,
        wMm: calculateBoussinesqSurfaceSettlement(pointP, r, eMpa, nu),
      });
    }
    return pts;
  }, [pointP, eMpa, nu]);

  const exercises: ContinuumExercise[] = [
    {
      id: 'ch6-q1',
      title: '問1：一次元圧密（K₀ 拘束条件）における水平応力増分 Δσ_x',
      category: '一般化フックの法則・K₀',
      statement:
        'ポアソン比 ν = 0.25、ヤング率 E = 20 MPa の等方弾性地盤が側方変位拘束状態（ε_x = ε_y = 0）にある。鉛直応力増分 Δσ_z = 120 kPa が作用したときに生じる水平応力増分 Δσ_x (= Δσ_y) を求めよ。',
      kind: 'numeric',
      expectedValue: 40,
      tolerance: 0.5,
      unit: 'kPa',
      inputHint: 'ε_x = 0 の条件から K₀ = ν / (1 - ν) を導いて計算します。',
      hint: 'ε_x = [Δσ_x - ν(Δσ_y + Δσ_z)] / E = 0 と Δσ_x = Δσ_y より (1 - ν)Δσ_x = ν Δσ_z となります。',
      steps: [
        {
          label: '側方ひずみゼロ (ε_x = ε_y = 0) から弾性静止土圧係数 K₀ を求める',
          math: 'K_0 = \\frac{\\Delta\\sigma_x}{\\Delta\\sigma_z} = \\frac{\\nu}{1 - \\nu} = \\frac{0.25}{1 - 0.25} = \\frac{1}{3}',
        },
        {
          label: 'Δσ_z = 120 kPa を掛けて Δσ_x を計算する',
          math: '\\Delta\\sigma_x = \\frac{1}{3} \\times 120 = 40\\text{ kPa}',
        },
      ],
      answerSummary: '40 kPa',
      onApplyPreset: () => {
        setEMpa(20);
        setNu(0.25);
        setMode('k0-1d');
        setDSigmaZ(120);
      },
    },
    {
      id: 'ch6-q2',
      title: '問2：一次元拘束弾性係数（圧密弾性係数）E_oed の算出',
      category: '弾性定数と拘束変形',
      statement:
        '問1と同じ地盤（E = 20 MPa, ν = 0.25）において、側方ひずみゼロの条件のもとで Δσ_z = E_oed · ε_z を満たす拘束弾性係数 E_oed (MPa) を求めよ。',
      kind: 'numeric',
      expectedValue: 24,
      tolerance: 0.5,
      unit: 'MPa',
      inputHint: 'E_oed = E(1 - ν) / [(1 + ν)(1 - 2ν)] に数値を代入します。',
      hint: 'E_oed は側方が拘束されているため、一軸状態のヤング率 E=20 MPa より大きくなります。',
      steps: [
        {
          label: '一次元拘束弾性係数 E_oed の公式に E = 20 MPa, ν = 0.25 を代入する',
          math: 'E_{\\text{oed}} = \\frac{E(1 - \\nu)}{(1 + \\nu)(1 - 2\\nu)} = \\frac{20 \\times (1 - 0.25)}{(1 + 0.25)(1 - 0.5)}',
        },
        {
          label: '分子・分母を計算する',
          math: 'E_{\\text{oed}} = \\frac{20 \\times 0.75}{1.25 \\times 0.5} = \\frac{15}{0.625} = 24\\text{ MPa}',
        },
      ],
      answerSummary: '24 MPa',
      onApplyPreset: () => {
        setEMpa(20);
        setNu(0.25);
        setMode('k0-1d');
        setDSigmaZ(120);
      },
    },
  ];

  // 変形要素SVG (圧縮正なので ε>0 で縮む。視覚的に見やすい倍率を適用)
  const boxSize = 100;
  const cx = 140;
  const cy = 115;
  const visScale = 12000; // 1000 με = 12 px
  const clampPx = (v: number) => Math.max(-34, Math.min(34, v));
  const dxPx = clampPx(-def.epsX * visScale); // 圧縮で幅減少
  const dzPx = clampPx(-def.epsZ * visScale); // 圧縮で高さ減少
  const shearPx = clampPx(def.gammaXZ * visScale * 0.7);

  const halfW = (boxSize + dxPx) / 2;
  const halfH = (boxSize + dzPx) / 2;
  // 平行四辺形の4隅 (上辺が shearPx だけ右へずれる)
  const polyPts = [
    `${cx - halfW + shearPx / 2},${cy - halfH}`,
    `${cx + halfW + shearPx / 2},${cy - halfH}`,
    `${cx + halfW - shearPx / 2},${cy + halfH}`,
    `${cx - halfW - shearPx / 2},${cy + halfH}`,
  ].join(' ');

  return (
    <div className="space-y-6">
      {/* 1. 理解 */}
      <section className="app-surface rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <h2 className="text-base sm:text-lg font-bold">
            1. 理解：ひずみ・適合条件・一般化フックの法則と地盤沈下
          </h2>
          <span className="rounded-md bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
            第6章：弾性地盤内の応力と変形
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm leading-relaxed">
          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">① 微小ひずみと適合条件（つり合いとの対比）</h3>
            <p className="text-xs app-text-muted">
              応力に「力のつり合い条件」が要請されるように、ひずみ（6成分）には 3つの変位 <MathFormula math="(u,v,w)" /> から矛盾なく隙間や重なりなく連続変形できるための<strong>適合条件</strong>が要請されます。
            </p>
            <MathFormula
              block
              math={`\\frac{\\partial^2\\varepsilon_x}{\\partial z^2}+\\frac{\\partial^2\\varepsilon_z}{\\partial x^2}=\\frac{\\partial^2\\gamma_{xz}}{\\partial x\\partial z}`}
            />
          </div>

          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">② 一般化フックの法則と体積・せん断分離</h3>
            <p className="text-xs app-text-muted">
              等方弾性体は 2つの定数 <MathFormula math="(E,\nu)" /> または <MathFormula math="(K,G)" /> で完全に記述され、体積ひずみ <MathFormula math="\varepsilon_v" /> は平均応力 <MathFormula math="\Delta p" /> のみ、せん断変形は <MathFormula math="\Delta q" /> のみに比例します。
            </p>
            <MathFormula
              block
              math={`\\varepsilon_v = \\frac{\\Delta p}{K},\\quad K=\\frac{E}{3(1-2\\nu)},\\quad G=\\frac{E}{2(1+\\nu)}`}
            />
          </div>

          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">③ 境界拘束と弾性地盤の表面沈下</h3>
            <p className="text-xs app-text-muted">
              実際の地盤は側方を周囲の土に拘束されるため（<MathFormula math="K_0" /> 状態）、見かけの剛性が <MathFormula math="E_{\text{oed}}" /> へ高まります。また集中荷重下の表面沈下は <MathFormula math="w(r)=\frac{P(1-\nu^2)}{\pi E r}" /> に従います。
            </p>
            <MathFormula
              block
              math={`K_0=\\frac{\\nu}{1-\\nu},\\quad E_{\\text{oed}}=\\frac{E(1-\\nu)}{(1+\\nu)(1-2\\nu)}`}
            />
          </div>
        </div>

        {/* 適合条件の直感SVG比較 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="app-surface-subtle rounded-lg p-3 flex items-center gap-3">
            <svg viewBox="0 0 110 70" className="w-24 shrink-0 h-auto" aria-hidden="true">
              <polygon points="10,12 50,16 48,54 12,52" fill="var(--diagram-teal-fill)" stroke="var(--diagram-emerald)" strokeWidth="1.6" />
              <polygon points="50,16 95,12 93,52 48,54" fill="var(--diagram-teal-fill)" stroke="var(--diagram-emerald)" strokeWidth="1.6" />
            </svg>
            <div className="text-xs">
              <div className="font-bold text-emerald-700 dark:text-emerald-300">適合条件を満たす変形場</div>
              <p className="app-text-muted">隣接要素の境界がぴったり一致し、地中内に空隙や重なりが生じません。</p>
            </div>
          </div>

          <div className="app-surface-subtle rounded-lg p-3 flex items-center gap-3">
            <svg viewBox="0 0 110 70" className="w-24 shrink-0 h-auto" aria-hidden="true">
              <polygon points="10,12 45,14 42,52 12,50" fill="var(--diagram-red-fill)" stroke="var(--diagram-red)" strokeWidth="1.6" />
              <polygon points="56,16 96,12 94,54 48,46" fill="var(--diagram-red-fill)" stroke="var(--diagram-red)" strokeWidth="1.6" />
            </svg>
            <div className="text-xs">
              <div className="font-bold text-red-700 dark:text-red-300">非適合な勝手なひずみ分布</div>
              <p className="app-text-muted">各要素のひずみを自由に与えると要素同士が離れたり重なったりして連続体が破綻します。</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 想像 */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-5 app-surface rounded-xl p-4 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold border-b border-[var(--border-subtle)] pb-2">
            2. 想像：構成則・境界拘束・弾性沈下シミュレーター
          </h2>

          <div className="space-y-1.5">
            <div className="text-xs font-semibold">境界拘束モード</div>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {(
                [
                  { id: 'general-3d', label: '一般3次元' },
                  { id: 'plane-strain', label: '平面ひずみ (ε_y=0)' },
                  { id: 'k0-1d', label: 'K₀ 一次元 (ε_x=ε_y=0)' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`px-2 py-1.5 rounded-lg border font-semibold cursor-pointer ${
                    mode === m.id
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'app-surface-subtle border-[var(--border-control)]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <SliderInput label="ヤング率" symbol="E" unit="MPa" value={eMpa} min={2} max={100} step={1} onChange={setEMpa} />
          <SliderInput label="ポアソン比" symbol="ν" unit="" value={nu} min={0} max={0.49} step={0.01} onChange={setNu} />
          <SliderInput label="鉛直応力増分" symbol="Δσ_z" unit="kPa" value={dSigmaZ} min={-100} max={300} step={10} onChange={setDSigmaZ} />

          {mode !== 'k0-1d' && (
            <>
              <SliderInput label="水平応力増分 x" symbol="Δσ_x" unit="kPa" value={dSigmaX} min={-100} max={250} step={10} onChange={setDSigmaX} />
              {mode === 'general-3d' && (
                <SliderInput label="奥行き応力増分 y" symbol="Δσ_y" unit="kPa" value={dSigmaY} min={-100} max={250} step={10} onChange={setDSigmaY} />
              )}
              <SliderInput label="せん断応力増分" symbol="Δτ_xz" unit="kPa" value={dTauXZ} min={-100} max={100} step={5} onChange={setDTauXZ} />
            </>
          )}

          <div className="border-t border-[var(--border-subtle)] pt-3 space-y-3">
            <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
              地表面載荷による即時沈下パラメータ
            </div>
            <SliderInput label="帯荷重強度" symbol="q" unit="kPa" value={stripQ} min={20} max={250} step={10} onChange={setStripQ} />
            <SliderInput label="基礎幅" symbol="B" unit="m" value={stripB} min={1} max={8} step={0.5} onChange={setStripB} />
            <SliderInput label="圧縮対象層厚" symbol="H" unit="m" value={layerH} min={2} max={16} step={1} onChange={setLayerH} />
            <SliderInput label="点荷重 (Boussinesq変位用)" symbol="P" unit="kN" value={pointP} min={100} max={2000} step={50} onChange={setPointP} />
          </div>
        </aside>

        <div className="lg:col-span-7 space-y-4">
          {/* 弾性定数ライブ変換 & 変形要素SVG */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5 app-surface rounded-xl overflow-hidden shadow-sm flex flex-col">
              <div className="app-surface-subtle border-x-0 border-t-0 px-3 py-2 text-xs font-semibold">
                微小要素の変形イメージ（拡大表示）
              </div>
              <div className="p-3 flex-1 flex flex-col items-center justify-center">
                <svg viewBox="0 0 280 230" className="w-full max-w-[260px] h-auto select-none" role="img" aria-label="変形前後の微小土要素の体積変化とせん断ひずみ図">
                  {/* 元の正方形 (破線) */}
                  <rect
                    x={cx - boxSize / 2}
                    y={cy - boxSize / 2}
                    width={boxSize}
                    height={boxSize}
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity="0.45"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  {/* 変形後 (平行四辺形) */}
                  <polygon
                    points={polyPts}
                    fill="var(--diagram-blue-fill)"
                    stroke="var(--diagram-blue)"
                    strokeWidth="2.4"
                  />
                  <text x="140" y="205" textAnchor="middle" className="text-xs font-mono-num fill-current">
                    ε_z={round4(def.epsZ * 100)}% / ε_x={round4(def.epsX * 100)}%
                  </text>
                  <text x="140" y="220" textAnchor="middle" className="text-xs font-mono-num fill-[var(--diagram-teal)] font-bold">
                    体積ひずみ ε_v={round4(def.epsVol * 100)}%・γ_xz={round4(def.gammaXZ * 100)}%
                  </text>
                </svg>
              </div>
            </div>

            <div className="md:col-span-7 app-surface rounded-xl p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold border-b border-[var(--border-subtle)] pb-1.5">
                弾性定数変換 &amp; 体積／せん断ひずみの分離結果
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono-num">
                <div className="app-surface-subtle rounded p-2">
                  <span className="app-text-muted font-sans">せん断弾性係数 G:</span><br />
                  <strong>{round2(def.constants.gKpa / 1000)} MPa</strong>
                </div>
                <div className="app-surface-subtle rounded p-2">
                  <span className="app-text-muted font-sans">体積弾性係数 K:</span><br />
                  <strong>{round2(def.constants.kKpa / 1000)} MPa</strong>
                </div>
                <div className="app-surface-subtle rounded p-2">
                  <span className="app-text-muted font-sans">拘束弾性係数 E_oed:</span><br />
                  <strong>{round2(def.constants.eOedKpa / 1000)} MPa</strong>
                </div>
                <div className="app-surface-subtle rounded p-2">
                  <span className="app-text-muted font-sans">弾性 K₀ = ν/(1-ν):</span><br />
                  <strong>{round4(def.constants.k0Elastic)}</strong>
                </div>
              </div>

              <div className="app-surface-subtle rounded-lg p-3 text-xs space-y-1">
                <div className="font-semibold">有効応力増分と体積・せん断応答</div>
                <div className="font-mono-num">
                  Δσ_x = {round2(def.effectiveStresses.dSigmaX)} kPa, Δσ_y = {round2(def.effectiveStresses.dSigmaY)} kPa, Δσ_z = {round2(def.effectiveStresses.dSigmaZ)} kPa
                </div>
                <div className="font-mono-num text-blue-700 dark:text-blue-300">
                  体積応答: Δp = {round2(def.deltaP)} kPa → ε_v = Δp/K = {round2(def.epsVol * 1e6)} με
                </div>
                <div className="font-mono-num text-teal-700 dark:text-teal-300">
                  せん断応答: Δq = {round2(def.deltaQ)} kPa → ε_s = {round2(def.epsShear * 1e6)} με
                </div>
              </div>
            </div>
          </div>

          {/* Boussinesq表面沈下曲線 & 層別弾性沈下 */}
          <div className="app-surface rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold">
                地表面載荷による弾性変位・即時沈下
              </h3>
              <span className="text-xs font-mono-num font-bold text-blue-700 dark:text-blue-300">
                帯荷重下の層別合計沈下 S_e = {settlement.totalSettlementMm} mm
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <div className="text-xs font-semibold app-text-muted mb-1">
                  Boussinesq 点荷重 P={pointP} kN の表面沈下プロファイル w(r)
                </div>
                <svg viewBox="0 0 260 150" className="w-full h-auto select-none" role="img" aria-label="Boussinesq 集中荷重による地表面沈下曲線">
                  <line x1="30" y1="24" x2="245" y2="24" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" />
                  <line x1="30" y1="24" x2="30" y2="135" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" />
                  <text x="245" y="16" textAnchor="end" className="text-xs fill-current">距離 r (0〜6m)</text>
                  <text x="34" y="136" className="text-xs fill-current">沈下 w (mm)</text>
                  <polyline
                    fill="none"
                    stroke="var(--diagram-blue)"
                    strokeWidth="2.4"
                    points={surfaceProfile
                      .map((pt) => {
                        const maxW = Math.max(5, surfaceProfile[0].wMm);
                        const xPx = 30 + (pt.r / 6) * 210;
                        const yPx = 24 + Math.min(102, (pt.wMm / maxW) * 98);
                        return `${xPx.toFixed(1)},${yPx.toFixed(1)}`;
                      })
                      .join(' ')}
                  />
                </svg>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="font-semibold app-text-muted">
                  帯荷重 (q={stripQ} kPa, B={stripB} m, 層厚 H={layerH} m) 6層積算内訳
                </div>
                <div className="space-y-1">
                  {settlement.layerBreakdown.map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 font-mono-num app-surface-subtle rounded px-2.5 py-1">
                      <span>z={row.depthMid}m</span>
                      <span>Δσ_z={row.deltaSigmaZ} kPa</span>
                      <span className="font-bold text-blue-700 dark:text-blue-300">ΔH={row.deltaHmm} mm</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 演習 */}
      <ChapterExercisePanel
        chapterTitle="第6章：弾性地盤内の応力と変形"
        exercises={exercises}
        completedIds={completedIds}
        onToggleDone={onToggleDone}
        onMarkDone={onMarkDone}
      />
    </div>
  );
};
