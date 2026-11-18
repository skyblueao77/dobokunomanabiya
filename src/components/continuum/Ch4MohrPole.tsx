import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  calculateMohrPole2D,
  degToRad,
  round2,
} from '../../utils/continuumPhysics';
import { type UnitId } from '../../data/curriculum';
import { SliderInput } from '../SliderInput';
import { MathFormula } from '../MathFormula';
import { ChapterExercisePanel, type ContinuumExercise } from './ChapterExercisePanel';

interface Ch4Props {
  completedIds: string[];
  onToggleDone: (id: string) => void;
  onMarkDone: (id: string) => void;
  onOpenUnit?: (unitId: UnitId) => void;
}

export const Ch4MohrPole: React.FC<Ch4Props> = ({
  completedIds,
  onToggleDone,
  onMarkDone,
  onOpenUnit,
}) => {
  const [sigmaZ, setSigmaZ] = useState(200);
  const [sigmaX, setSigmaX] = useState(120);
  const [tauH, setTauH] = useState(30);
  const [theta, setTheta] = useState(45);
  const [show3DPreview, setShow3DPreview] = useState(false);
  const [sigma2Ratio, setSigma2Ratio] = useState(0.5);
  const [poleStep, setPoleStep] = useState<'all' | 'hv' | 'pole' | 'ray' | 'principal'>('all');

  const res = useMemo(
    () => calculateMohrPole2D({ sigmaX, sigmaZ, tauH, theta }),
    [sigmaX, sigmaZ, tauH, theta]
  );

  const sigma2Val = useMemo(
    () => res.sigma3 + sigma2Ratio * (res.sigma1 - res.sigma3),
    [res.sigma1, res.sigma3, sigma2Ratio]
  );

  const exercises: ContinuumExercise[] = [
    {
      id: 'ch4-q1',
      title: '問1：一般2次元応力状態から最大主応力 σ₁ を求める',
      category: 'モールの応力円',
      statement:
        'ある土要素（圧縮正）の水平面に σ_z = 200 kPa、反時計回り向きのせん断応力 τ_H = 30 kPa が作用し、鉛直面に σ_x = 120 kPa が作用している。この点の最大主応力 σ₁ を求めよ。',
      kind: 'numeric',
      expectedValue: 210,
      tolerance: 0.5,
      unit: 'kPa',
      inputHint: '円の中心 C と半径 R（ピタゴラスの定理）を順に求めます。',
      hint: 'C = (σ_z + σ_x)/2 = 160 kPa、半差 (σ_z - σ_x)/2 = 40 kPa、τ_H = 30 kPa より 3:4:5 の直角三角形が使えます。',
      steps: [
        {
          label: 'モール円の中心 C と半径 R を求める',
          math: 'C = \\frac{200 + 120}{2} = 160\\text{ kPa},\\quad R = \\sqrt{\\left(\\frac{200 - 120}{2}\\right)^2 + 30^2} = \\sqrt{40^2 + 30^2} = 50\\text{ kPa}',
        },
        {
          label: '最大主応力 σ₁ = C + R を計算する',
          math: '\\sigma_1 = 160 + 50 = 210\\text{ kPa}\\quad (\\sigma_3 = 160 - 50 = 110\\text{ kPa})',
        },
      ],
      answerSummary: '210 kPa',
      onApplyPreset: () => {
        setSigmaZ(200);
        setSigmaX(120);
        setTauH(30);
        setTheta(45);
        setPoleStep('all');
      },
    },
    {
      id: 'ch4-q2',
      title: '問2：用極法で θ = 45° 斜面の垂直応力 σ_θ を読み取る',
      category: '用極法 (Pole Method)',
      statement:
        '問1と同じ応力状態（σ_z = 200 kPa, σ_x = 120 kPa, τ_H = 30 kPa）において、水平面から反時計回りに θ = 45° 傾いた面に作用する垂直応力 σ_45° を求めよ。',
      kind: 'numeric',
      expectedValue: 130,
      tolerance: 0.5,
      unit: 'kPa',
      inputHint: '極 P = (120, 30) から傾き 45° の直線を引いた交点 Q の σ 座標（または変換公式）を計算します。',
      hint: '変換公式 σ_θ = C + ((σ_z-σ_x)/2)cos(2θ) - τ_H sin(2θ) に 2θ = 90° を代入すると、sin90°=1, cos90°=0 で簡単に求まります。',
      steps: [
        {
          label: '極 P を定める（水平面 H=(200, 30) からの水平線と鉛直面 V=(120, -30) からの鉛直線の交点）',
          math: 'P = (\\sigma_x, \\tau_H) = (120,\\ 30)\\text{ kPa}',
        },
        {
          label: '変換公式（または P から傾き 45° の直線と円 (σ-160)² + τ² = 50² の交点）を求める',
          math: '\\sigma_{45^\\circ} = 160 + 40\\cos(90^\\circ) - 30\\sin(90^\\circ) = 160 - 30 = 130\\text{ kPa}\\quad (\\tau_{45^\\circ} = 40\\text{ kPa})',
        },
      ],
      answerSummary: '130 kPa（せん断応力 τ = 40 kPa）',
      onApplyPreset: () => {
        setSigmaZ(200);
        setSigmaX(120);
        setTauH(30);
        setTheta(45);
        setPoleStep('all');
      },
    },
  ];

  // モール円 SVG スケール設定 (1:1 縮尺)
  const w = 540;
  const h = 380;
  const padL = 48;
  const padR = 24;
  const padT = 24;
  const padB = 36;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const minSigma = Math.min(0, res.sigma3 - 25);
  const maxSigma = Math.max(250, res.sigma1 + 25);
  const sigmaSpan = Math.max(120, maxSigma - minSigma);
  const maxTau = Math.max(60, res.radius * 1.35);
  const scale = Math.min(plotW / sigmaSpan, plotH / (2 * maxTau));

  const originX = padL - minSigma * scale;
  const originY = padT + plotH / 2;
  const toX = (s: number) => originX + s * scale;
  const toY = (t: number) => originY - t * scale;

  const cX = toX(res.center);
  const rPx = Math.max(2, res.radius * scale);
  const pX = toX(res.pole.sigma);
  const pY = toY(res.pole.tau);
  const hX = toX(res.pointH.sigma);
  const hY = toY(res.pointH.tau);
  const vX = toX(res.pointV.sigma);
  const vY = toY(res.pointV.tau);
  const qX = toX(res.sigmaTheta);
  const qY = toY(res.tauTheta);
  const s1X = toX(res.sigma1);
  const s3X = toX(res.sigma3);

  // 極 P から伸びるガイド線（円を通過して少し延長）
  const thRad = degToRad(theta);
  const rayDx = Math.cos(thRad);
  const rayDy = -Math.sin(thRad); // SVG y-down
  const rayLen = rPx * 2.3 + 30;

  return (
    <div className="space-y-6">
      {/* 1. 理解 */}
      <section className="app-surface rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <h2 className="text-base sm:text-lg font-bold">
            1. 理解：一般応力状態からのモール円と「用極法 (Pole Method)」
          </h2>
          <span className="rounded-md bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
            第4章：モールの応力円と用極法
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm leading-relaxed">
          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">用極法（面の原点）が圧倒的に便利な理由</h3>
            <p className="text-xs sm:text-sm app-text-muted">
              座標変換の <MathFormula math="2\theta" /> 公式を暗記・計算しなくても、円周上の「<strong>極 <MathFormula math="P" /></strong>」を1点見つけるだけで、<strong>実空間の面の傾き角 <MathFormula math="\theta" /> そのままの角度で直線を引く</strong>ことで任意面の応力・主応力面の向きを図解で即座に読み取れます（円周角の定理）。
            </p>
            <ol className="text-xs app-text-muted list-decimal pl-4 space-y-1">
              <li>水平面 <MathFormula math="H=(\sigma_z, \tau_H)" /> と鉛直面 <MathFormula math="V=(\sigma_x, -\tau_H)" /> を打って円を描く（要素を反時計回りに回すせん断を <MathFormula math="\tau>0" />）。</li>
              <li><MathFormula math="H" /> から<strong>水平線</strong>（または <MathFormula math="V" /> から<strong>鉛直線</strong>）を引き、円と交わる点が <strong>極 <MathFormula math="P=(\sigma_x, \tau_H)" /></strong>。</li>
              <li><MathFormula math="P" /> から求めたい面と<strong>平行な直線（傾き <MathFormula math="\theta" />）</strong>を引き、円との交点 <MathFormula math="Q" /> がその面の応力 <MathFormula math="(\sigma_\theta, \tau_\theta)" />！</li>
            </ol>
          </div>

          <div className="app-surface-subtle rounded-lg p-4 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <h3 className="font-bold text-sm">公式と既存単元「破壊規準・有効応力」との接続</h3>
              <MathFormula
                block
                math={`C = \\frac{\\sigma_z + \\sigma_x}{2},\\quad R = \\sqrt{\\left(\\frac{\\sigma_z - \\sigma_x}{2}\\right)^2 + \\tau_H^2},\\quad \\sigma_{1,3} = C \\pm R`}
              />
              <p className="text-xs app-text-muted">
                主応力 <MathFormula math="\sigma_1, \sigma_3" /> が求まれば、モール・クーロンの破壊包絡線（<MathFormula math="\tau_f = c + \sigma\tan\phi" />）や有効応力との判定ができます。
              </p>
            </div>
            {onOpenUnit && (
              <button
                type="button"
                onClick={() => onOpenUnit('mohr-circle')}
                className="interactive-btn self-start inline-flex items-center gap-1.5 rounded-lg bg-blue-700 text-white px-3 py-1.5 text-xs font-semibold cursor-pointer"
              >
                破壊規準・有効応力シミュレーター（既存単元）を開く
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. 想像 */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-4 app-surface rounded-xl p-4 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold border-b border-[var(--border-subtle)] pb-2">
            2. 想像：用極法インタラクティブ作図
          </h2>

          <SliderInput label="水平面の垂直応力" symbol="σ_z" unit="kPa" value={sigmaZ} min={0} max={350} step={5} onChange={setSigmaZ} />
          <SliderInput label="鉛直面の垂直応力" symbol="σ_x" unit="kPa" value={sigmaX} min={0} max={350} step={5} onChange={setSigmaX} />
          <SliderInput label="水平面のせん断 (CCW正)" symbol="τ_H" unit="kPa" value={tauH} min={-120} max={120} step={5} onChange={setTauH} />
          <SliderInput label="求める面の傾き (CCW)" symbol="θ" unit="°" value={theta} min={0} max={180} step={1} onChange={setTheta} />

          <div className="border-t border-[var(--border-subtle)] pt-3 space-y-2">
            <div className="text-xs font-bold">作図ステップを順に表示</div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {(
                [
                  { id: 'all', label: 'すべて表示' },
                  { id: 'hv', label: '① H・V を打つ' },
                  { id: 'pole', label: '② 極 P を求める' },
                  { id: 'ray', label: '③ P から θ 線' },
                  { id: 'principal', label: '主応力面確認' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setPoleStep(st.id)}
                  className={`px-2 py-1 rounded border font-semibold cursor-pointer ${
                    poleStep === st.id
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'app-surface-subtle border-[var(--border-control)]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--border-subtle)] pt-3 space-y-2.5">
            <label className="flex items-center justify-between gap-2 text-xs font-semibold cursor-pointer">
              <span>3次元モール円 (σ₁, σ₂, σ₃) 重ね表示</span>
              <input
                type="checkbox"
                checked={show3DPreview}
                onChange={(e) => setShow3DPreview(e.target.checked)}
                className="h-4 w-4 accent-[var(--accent-color)]"
              />
            </label>
            {show3DPreview && (
              <SliderInput
                label="中間主応力比 b = (σ₂-σ₃)/(σ₁-σ₃)"
                symbol="b"
                unit=""
                value={sigma2Ratio}
                min={0}
                max={1}
                step={0.05}
                onChange={setSigma2Ratio}
              />
            )}
          </div>
        </aside>

        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            {/* 実空間土要素 */}
            <div className="md:col-span-4 app-surface rounded-xl overflow-hidden shadow-sm flex flex-col">
              <div className="app-surface-subtle border-x-0 border-t-0 px-3 py-2 text-xs font-semibold">
                実空間の2D要素（角度 θ={theta}°）
              </div>
              <div className="p-3 flex-1 flex flex-col items-center justify-center">
                <svg viewBox="-10 0 230 200" className="w-full max-w-[220px] h-auto select-none" role="img" aria-label="実空間の土要素と対象面角度">
                  <rect x="55" y="55" width="100" height="90" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.7" strokeWidth="1.8" />
                  <text x="105" y="34" textAnchor="middle" className="text-xs font-bold fill-[var(--diagram-blue)] font-mono-num">
                    σ_z={sigmaZ}
                  </text>
                  <line x1="105" y1="38" x2="105" y2="53" stroke="var(--diagram-blue)" strokeWidth="2.2" />
                  <line x1="105" y1="162" x2="105" y2="147" stroke="var(--diagram-blue)" strokeWidth="2.2" />

                  <text x="4" y="88" textAnchor="start" className="text-xs font-bold fill-[var(--diagram-indigo)] font-mono-num">
                    σ_x={sigmaX}
                  </text>
                  <line x1="36" y1="100" x2="53" y2="100" stroke="var(--diagram-indigo)" strokeWidth="2.2" />
                  <line x1="174" y1="100" x2="157" y2="100" stroke="var(--diagram-indigo)" strokeWidth="2.2" />

                  {/* 対象切断面 (水平から θ CCW = SVG -θ) */}
                  <g transform={`rotate(${-theta} 105 100)`}>
                    <line x1="50" y1="100" x2="160" y2="100" stroke="var(--diagram-teal)" strokeWidth="2.6" />
                  </g>
                  {/* 主応力面 破線 */}
                  <g transform={`rotate(${-res.thetaP1} 105 100)`}>
                    <line x1="60" y1="100" x2="150" y2="100" stroke="var(--diagram-amber)" strokeWidth="1.5" strokeDasharray="4 3" />
                  </g>
                  <text x="105" y="186" textAnchor="middle" className="text-xs font-mono-num fill-[var(--diagram-teal)] font-bold">
                    実線: θ={theta}° / 破線: σ₁面 {round2(res.thetaP1)}°
                  </text>
                </svg>
              </div>
            </div>

            {/* モール円＋用極法 SVG */}
            <div className="md:col-span-8 app-surface rounded-xl overflow-hidden shadow-sm">
              <div className="app-surface-subtle border-x-0 border-t-0 px-3 py-2 flex items-center justify-between text-xs font-semibold">
                <span>モール円と用極法（1:1縮尺・圧縮正・CCWせん断上側正）</span>
                <span className="font-mono-num">P = ({res.pole.sigma}, {res.pole.tau})</span>
              </div>
              <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto block select-none" role="img" aria-label="用極法によるモールの応力円図">
                <defs>
                  <clipPath id="c4-clip">
                    <rect x={padL} y={padT} width={plotW} height={plotH} />
                  </clipPath>
                </defs>

                {/* 座標軸 */}
                <line x1={padL} y1={originY} x2={w - padR} y2={originY} stroke="currentColor" strokeOpacity="0.68" strokeWidth="1.4" />
                {originX >= padL && originX <= w - padR && (
                  <line x1={originX} y1={padT} x2={originX} y2={h - padB} stroke="currentColor" strokeOpacity="0.68" strokeWidth="1.4" />
                )}
                <text x={w - padR} y={originY + 18} textAnchor="end" className="text-xs font-semibold fill-current">σ (kPa)</text>
                <text x={Math.max(padL + 6, originX + 8)} y={padT + 14} className="text-xs font-semibold fill-current">τ (CCW正)</text>

                <g clipPath="url(#c4-clip)">
                  {/* 3Dモール円プレビュー */}
                  {show3DPreview && (
                    <g opacity="0.85">
                      <circle cx={toX((res.sigma1 + sigma2Val) / 2)} cy={originY} r={Math.max(1, ((res.sigma1 - sigma2Val) / 2) * scale)} fill="var(--diagram-blue-fill)" stroke="var(--diagram-indigo)" strokeWidth="1.6" strokeDasharray="4 3" />
                      <circle cx={toX((sigma2Val + res.sigma3) / 2)} cy={originY} r={Math.max(1, ((sigma2Val - res.sigma3) / 2) * scale)} fill="var(--diagram-blue-fill)" stroke="var(--diagram-indigo)" strokeWidth="1.6" strokeDasharray="4 3" />
                    </g>
                  )}

                  {/* メインの2Dモール円 */}
                  <circle cx={cX} cy={originY} r={rPx} fill="var(--diagram-blue-fill)" stroke="var(--diagram-blue)" strokeWidth="2.4" />

                  {/* Step1: H と V を結ぶ直径 */}
                  <line x1={hX} y1={hY} x2={vX} y2={vY} stroke="var(--diagram-muted)" strokeWidth="1.3" strokeDasharray="4 3" />

                  {/* Step2: 極 P を見つける水平線(H→P)と鉛直線(V→P) */}
                  {(poleStep === 'all' || poleStep === 'pole' || poleStep === 'ray' || poleStep === 'principal') && (
                    <>
                      <line x1={hX} y1={hY} x2={pX} y2={pY} stroke="var(--diagram-amber)" strokeWidth="1.8" strokeDasharray="5 3" />
                      <line x1={vX} y1={vY} x2={pX} y2={pY} stroke="var(--diagram-amber)" strokeWidth="1.4" strokeDasharray="3 3" />
                    </>
                  )}

                  {/* Step3: 極 P から角度 θ の直線 → Q */}
                  {(poleStep === 'all' || poleStep === 'ray') && (
                    <>
                      <line
                        x1={pX - rayDx * 20}
                        y1={pY - rayDy * 20}
                        x2={pX + rayDx * rayLen}
                        y2={pY + rayDy * rayLen}
                        stroke="var(--diagram-teal)"
                        strokeWidth="1.8"
                        opacity="0.65"
                      />
                      <line x1={pX} y1={pY} x2={qX} y2={qY} stroke="var(--diagram-teal)" strokeWidth="2.4" />
                      <circle cx={qX} cy={qY} r="5.5" fill="var(--diagram-teal)" stroke="var(--diagram-halo)" strokeWidth="1.5" />
                      <text x={qX + 8} y={qY - 8} className="text-xs font-bold fill-[var(--diagram-teal)] font-mono-num">
                        Q({round2(res.sigmaTheta)}, {round2(res.tauTheta)})
                      </text>
                    </>
                  )}

                  {/* 主応力面ガイド */}
                  {(poleStep === 'all' || poleStep === 'principal') && (
                    <>
                      <line x1={pX} y1={pY} x2={s1X} y2={originY} stroke="var(--diagram-red)" strokeWidth="1.5" strokeDasharray="4 3" />
                      <line x1={pX} y1={pY} x2={s3X} y2={originY} stroke="var(--diagram-indigo)" strokeWidth="1.3" strokeDasharray="4 3" />
                    </>
                  )}

                  {/* 点 H, V, σ1, σ3, P */}
                  <circle cx={hX} cy={hY} r="4.5" fill="var(--diagram-blue)" />
                  <text x={hX + 7} y={hY - 6} className="text-xs font-bold fill-[var(--diagram-blue)]">
                    H(σ_z,τ_H)
                  </text>

                  <circle cx={vX} cy={vY} r="4.5" fill="var(--diagram-indigo)" />
                  <text x={vX - 8} y={vY + 14} textAnchor="end" className="text-xs font-bold fill-[var(--diagram-indigo)]">
                    V(σ_x,-τ_H)
                  </text>

                  <circle cx={s1X} cy={originY} r="4" fill="var(--diagram-red)" />
                  <text x={s1X} y={originY + 16} textAnchor="middle" className="text-xs font-bold fill-[var(--diagram-red)]">
                    σ₁={round2(res.sigma1)}
                  </text>

                  <circle cx={s3X} cy={originY} r="4" fill="var(--diagram-blue)" />
                  <text x={s3X} y={originY + 16} textAnchor="middle" className="text-xs font-bold fill-[var(--diagram-blue)]">
                    σ₃={round2(res.sigma3)}
                  </text>

                  {(poleStep !== 'hv') && (
                    <>
                      <circle cx={pX} cy={pY} r="6" fill="var(--diagram-amber)" stroke="var(--diagram-halo)" strokeWidth="1.8" />
                      <text x={pX - 8} y={pY - 8} textAnchor="end" className="text-xs font-extrabold fill-[var(--diagram-amber)]">
                        極 P
                      </text>
                    </>
                  )}
                </g>
              </svg>
            </div>
          </div>

          <div className="app-surface rounded-xl p-4 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="app-surface-subtle rounded-lg p-2.5">
              <div className="app-text-muted">中心 C / 半径 R</div>
              <div className="font-bold font-mono-num">{round2(res.center)} / {round2(res.radius)} kPa</div>
            </div>
            <div className="app-surface-subtle rounded-lg p-2.5">
              <div className="app-text-muted">最大・最小主応力</div>
              <div className="font-bold font-mono-num">{round2(res.sigma1)} / {round2(res.sigma3)} kPa</div>
            </div>
            <div className="app-surface-subtle rounded-lg p-2.5">
              <div className="app-text-muted">θ={theta}° 面の応力</div>
              <div className="font-bold font-mono-num text-teal-700 dark:text-teal-300">
                ({round2(res.sigmaTheta)}, {round2(res.tauTheta)})
              </div>
            </div>
            <div className="app-surface-subtle rounded-lg p-2.5">
              <div className="app-text-muted">最大主応力面の角度</div>
              <div className="font-bold font-mono-num text-amber-700 dark:text-amber-300">
                θ_p1 = {round2(res.thetaP1)}°
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 演習 */}
      <ChapterExercisePanel
        chapterTitle="第4章：モールの応力円と用極法"
        exercises={exercises}
        completedIds={completedIds}
        onToggleDone={onToggleDone}
        onMarkDone={onMarkDone}
      />
    </div>
  );
};
