import React, { useMemo, useState } from 'react';
import {
  calculateCauchy3D,
  calculateTransform2D,
  degToRad,
  round2,
  round4,
  type SignConvention,
} from '../../utils/continuumPhysics';
import { SliderInput } from '../SliderInput';
import { MathFormula } from '../MathFormula';
import { ChapterExercisePanel, type ContinuumExercise } from './ChapterExercisePanel';

interface Ch2Props {
  completedIds: string[];
  onToggleDone: (id: string) => void;
  onMarkDone: (id: string) => void;
}

export const Ch2CauchyTransform: React.FC<Ch2Props> = ({
  completedIds,
  onToggleDone,
  onMarkDone,
}) => {
  const [sxx, setSxx] = useState(160);
  const [syy, setSyy] = useState(80);
  const [txy, setTxy] = useState(30);
  const [theta, setTheta] = useState(30);
  const [szz3d, setSzz3d] = useState(120);
  const [tiltZ, setTiltZ] = useState(0); // 3D面法線の z 成分角度 (0°=xy面内, 90°=z軸)
  const [convention, setConvention] = useState<SignConvention>('compression');

  const nVec = useMemo<[number, number, number]>(() => {
    const phi = degToRad(tiltZ);
    const th = degToRad(theta);
    return [Math.cos(phi) * Math.cos(th), Math.cos(phi) * Math.sin(th), Math.sin(phi)];
  }, [theta, tiltZ]);

  const cauchy = useMemo(
    () =>
      calculateCauchy3D(
        { sxx, syy, szz: szz3d, txy, tyz: 0, tzx: 0 },
        nVec
      ),
    [sxx, syy, szz3d, txy, nVec]
  );

  const rot2d = useMemo(() => calculateTransform2D(sxx, syy, txy, theta), [sxx, syy, txy, theta]);

  const exercises: ContinuumExercise[] = [
    {
      id: 'ch2-q1',
      title: '問1：コーシーの公式による斜面の垂直応力 σ_n',
      category: 'コーシーの公式',
      statement:
        '2次元応力場（圧縮正）において σ_x = 160 kPa, σ_y = 80 kPa, τ_xy = 30 kPa であるとき、法線ベクトルが x 軸から反時計回りに θ = 30° をなす断面（n = (cos30°, sin30°)）に作用する垂直応力 σ_n (= σ_x\') を求めよ。',
      kind: 'numeric',
      expectedValue: 165.98,
      tolerance: 0.6,
      unit: 'kPa',
      inputHint: '小数第1位または第2位まで入力（例: 166.0）',
      hint: 'σ_x\' = (σ_x+σ_y)/2 + ((σ_x-σ_y)/2)cos(2θ) + τ_xy sin(2θ) または n^T σ n を計算します。2θ = 60° です。',
      steps: [
        {
          label: '法線ベクトル n とコーシーの公式 t = σn を計算する',
          math: '\\mathbf{n} = \\begin{pmatrix} \\cos 30^\\circ \\\\ \\sin 30^\\circ \\end{pmatrix} = \\begin{pmatrix} 0.8660 \\\\ 0.5000 \\end{pmatrix},\\quad \\mathbf{t} = \\begin{pmatrix} 160 & 30 \\\\ 30 & 80 \\end{pmatrix}\\begin{pmatrix} 0.8660 \\\\ 0.5000 \\end{pmatrix} = \\begin{pmatrix} 153.56 \\\\ 65.98 \\end{pmatrix}',
        },
        {
          label: '垂直応力 σ_n = n · t（または座標変換公式）を求める',
          math: '\\sigma_n = \\frac{160+80}{2} + \\frac{160-80}{2}\\cos 60^\\circ + 30\\sin 60^\\circ = 120 + 20 + 25.98 \\approx 165.98\\text{ kPa}',
        },
      ],
      answerSummary: '165.98 kPa',
      onApplyPreset: () => {
        setConvention('compression');
        setSxx(160);
        setSyy(80);
        setTxy(30);
        setTheta(30);
        setTiltZ(0);
      },
    },
    {
      id: 'ch2-q2',
      title: '問2：座標変換後のせん断応力 τ_x\'y\'',
      category: '座標変換公式',
      statement:
        '問1と同じ応力状態（σ_x = 160 kPa, σ_y = 80 kPa, τ_xy = 30 kPa）において、座標軸を反時計回りに θ = 30° 回転した後のせん断応力 τ_x\'y\' を求めよ（符号も含めて回答）。',
      kind: 'numeric',
      expectedValue: -19.64,
      tolerance: 0.6,
      unit: 'kPa',
      inputHint: '負号が必要な場合は - を付けて入力してください（例: -19.6）。',
      hint: 'τ_x\'y\' = -((σ_x - σ_y)/2)sin(2θ) + τ_xy cos(2θ) を用います。',
      steps: [
        {
          label: '座標変換公式に 2θ = 60° を代入する',
          math: "\\tau_{x'y'} = -\\frac{160-80}{2}\\sin(60^\\circ) + 30\\cos(60^\\circ)",
        },
        {
          label: '数値を計算する',
          math: "\\tau_{x'y'} = -40 \\times \\frac{\\sqrt{3}}{2} + 30 \\times 0.5 = -34.64 + 15.00 \\approx -19.64\\text{ kPa}",
        },
      ],
      answerSummary: '-19.64 kPa',
      onApplyPreset: () => {
        setConvention('compression');
        setSxx(160);
        setSyy(80);
        setTxy(30);
        setTheta(30);
        setTiltZ(0);
      },
    },
  ];

  // SVG くさび・ベクトル可視化 (2D投影 xy 平面)
  const cx = 180;
  const cy = 145;
  const thRad = degToRad(theta);
  const nx = Math.cos(thRad);
  const ny = -Math.sin(thRad); // SVG は y 下向きなので数学的 +y は上向き (-y)
  // 切断面の接線ベクトル m = (-sin θ, cos θ) -> SVG: (-sin θ, -cos θ)
  const mx = -Math.sin(thRad);
  const my = -Math.cos(thRad);

  const vecScale = 0.28;
  const txSvg = cauchy.traction[0] * vecScale;
  const tySvg = -cauchy.traction[1] * vecScale;
  const snSvgX = cauchy.sigmaN * nx * vecScale;
  const snSvgY = cauchy.sigmaN * ny * vecScale;

  // くさびの斜辺座標（中心 cx, cy を通る長さ 120px の切断面）
  const halfCut = 56;
  const cutA: [number, number] = [cx - mx * halfCut, cy - my * halfCut];
  const cutB: [number, number] = [cx + mx * halfCut, cy + my * halfCut];

  return (
    <div className="space-y-6">
      {/* 1. 理解 */}
      <section className="app-surface rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <h2 className="text-base sm:text-lg font-bold">
            1. 理解：コーシーの公式と座標変換の本質
          </h2>
          <span className="rounded-md bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
            第2章：コーシーの公式・座標変換
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm leading-relaxed">
          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">コーシーの公式（微小四面体の力のつり合い）</h3>
            <p className="text-xs sm:text-sm app-text-muted">
              直交座標面上の応力成分（<MathFormula math="\boldsymbol{\sigma}" />）さえ分かっていれば、単位法線ベクトル <MathFormula math="\mathbf{n}" /> を持つ<strong>あらゆる傾きの断面</strong>に働く応力ベクトル <MathFormula math="\mathbf{t}" /> は、単なる行列積で直ちに求まります。
            </p>
            <MathFormula
              block
              math={`\\mathbf{t} = \\boldsymbol{\\sigma}\\mathbf{n},\\qquad \\sigma_n = \\mathbf{n}^T\\boldsymbol{\\sigma}\\mathbf{n},\\qquad \\tau_n = \\sqrt{\\|\\mathbf{t}\\|^2 - \\sigma_n^2}`}
            />
          </div>

          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">
              座標変換（基底の回転 <MathFormula math="\boldsymbol{\sigma}' = \mathbf{Q}\boldsymbol{\sigma}\mathbf{Q}^T" />）
            </h3>
            <p className="text-xs sm:text-sm app-text-muted">
              座標軸を角度 <MathFormula math="\theta" /> 回転した新座標系 <MathFormula math="(x', y')" /> の応力成分は、<MathFormula math="x'" /> 軸・<MathFormula math="y'" /> 軸にコーシーの公式を適用したものです。2次元では倍角 <MathFormula math="2\theta" /> の変換式となり、<strong>垂直応力の和 <MathFormula math="\sigma_{x'}+\sigma_{y'}=\sigma_x+\sigma_y" /> が常に保存</strong>されます。
            </p>
            <MathFormula
              block
              math={`\\sigma_{x'} = \\frac{\\sigma_x+\\sigma_y}{2}+\\frac{\\sigma_x-\\sigma_y}{2}\\cos 2\\theta+\\tau_{xy}\\sin 2\\theta`}
            />
          </div>
        </div>
      </section>

      {/* 2. 想像 */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-5 app-surface rounded-xl p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 gap-2 flex-wrap">
            <h3 className="text-sm font-bold">2. 想像：断面法線・座標回転シミュレーター</h3>
            <div className="inline-flex rounded-lg border border-[var(--border-control)] overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setConvention('compression')}
                className={`px-2 py-1 font-semibold cursor-pointer ${
                  convention === 'compression' ? 'bg-blue-700 text-white' : 'app-surface-subtle'
                }`}
              >
                圧縮正
              </button>
              <button
                type="button"
                onClick={() => setConvention('tension')}
                className={`px-2 py-1 font-semibold cursor-pointer ${
                  convention === 'tension' ? 'bg-amber-700 text-white' : 'app-surface-subtle'
                }`}
              >
                引張正
              </button>
            </div>
          </div>

          <SliderInput label="x 方向垂直応力" symbol="σ_x" unit="kPa" value={sxx} min={-200} max={300} step={5} onChange={setSxx} />
          <SliderInput label="y 方向垂直応力" symbol="σ_y" unit="kPa" value={syy} min={-200} max={300} step={5} onChange={setSyy} />
          <SliderInput label="xy せん断応力" symbol="τ_xy" unit="kPa" value={txy} min={-120} max={120} step={5} onChange={setTxy} />
          <SliderInput label="断面・座標回転角" symbol="θ" unit="°" value={theta} min={0} max={180} step={1} onChange={setTheta} />

          <div className="border-t border-[var(--border-subtle)] pt-3 space-y-3">
            <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              3次元拡張（法線ベクトルの z 方向傾き）
            </div>
            <SliderInput label="z 方向垂直応力" symbol="σ_z" unit="kPa" value={szz3d} min={-200} max={300} step={5} onChange={setSzz3d} />
            <SliderInput label="法線の仰角 (0°=2D平面)" symbol="φ_z" unit="°" value={tiltZ} min={0} max={90} step={1} onChange={setTiltZ} />
          </div>
        </aside>

        <div className="lg:col-span-7 space-y-4">
          <div className="app-surface rounded-xl overflow-hidden shadow-sm">
            <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm font-semibold">
                斜面の応力ベクトル分解（t = σ_n n + t_s）と回転座標 (x', y')
              </span>
              <span className="text-xs font-mono-num app-text-muted">
                n = ({round4(nVec[0])}, {round4(nVec[1])}, {round4(nVec[2])})
              </span>
            </div>

            <div className="p-4 flex flex-col items-center">
              <svg
                viewBox="0 0 360 280"
                className="w-full max-w-[430px] h-auto select-none"
                role="img"
                aria-label="切断面上の法線ベクトルと応力ベクトルの垂直・せん断分解図"
              >
                <defs>
                  <marker id="c2-n" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--diagram-muted)" />
                  </marker>
                  <marker id="c2-t" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--diagram-violet)" />
                  </marker>
                  <marker id="c2-sn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--diagram-blue)" />
                  </marker>
                  <marker id="c2-ts" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--diagram-teal)" />
                  </marker>
                </defs>

                {/* 元座標軸 x, y */}
                <line x1="35" y1={cy} x2="325" y2={cy} stroke="currentColor" strokeOpacity="0.35" strokeDasharray="4 4" />
                <line x1={cx} y1="260" x2={cx} y2="20" stroke="currentColor" strokeOpacity="0.35" strokeDasharray="4 4" />
                <text x="328" y={cy + 4} className="text-[11px] fill-[var(--text-muted)]">x</text>
                <text x={cx + 5} y="24" className="text-[11px] fill-[var(--text-muted)]">y</text>

                {/* 回転後座標軸 x' (n方向), y' (m方向) */}
                <line
                  x1={cx - nx * 110}
                  y1={cy - ny * 110}
                  x2={cx + nx * 110}
                  y2={cy + ny * 110}
                  stroke="var(--diagram-blue)"
                  strokeOpacity="0.45"
                  strokeDasharray="3 3"
                />
                <text x={cx + nx * 114} y={cy + ny * 114} className="text-[11px] font-bold fill-[var(--diagram-blue)]">
                  x'
                </text>

                {/* 切断面 */}
                <line
                  x1={cutA[0]}
                  y1={cutA[1]}
                  x2={cutB[0]}
                  y2={cutB[1]}
                  stroke="currentColor"
                  strokeWidth="3"
                />

                {/* 単位法線ベクトル n */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx + nx * 38}
                  y2={cy + ny * 38}
                  stroke="var(--diagram-muted)"
                  strokeWidth="2"
                  markerEnd="url(#c2-n)"
                />
                <text x={cx + nx * 46} y={cy + ny * 46} className="text-[11px] font-bold fill-[var(--text-muted)]">
                  n
                </text>

                {/* 応力ベクトル t (xy投影) */}
                {Math.hypot(txSvg, tySvg) > 2 && (
                  <>
                    <line
                      x1={cx}
                      y1={cy}
                      x2={cx + txSvg}
                      y2={cy + tySvg}
                      stroke="var(--diagram-violet)"
                      strokeWidth="2.5"
                      markerEnd="url(#c2-t)"
                    />
                    <text x={cx + txSvg + 6} y={cy + tySvg} className="text-[11px] font-bold fill-[var(--diagram-violet)]">
                      t
                    </text>
                  </>
                )}

                {/* 垂直応力成分 σ_n n */}
                {Math.hypot(snSvgX, snSvgY) > 2 && (
                  <line
                    x1={cx}
                    y1={cy}
                    x2={cx + snSvgX}
                    y2={cy + snSvgY}
                    stroke="var(--diagram-blue)"
                    strokeWidth="2.2"
                    markerEnd="url(#c2-sn)"
                  />
                )}

                {/* せん断応力成分 (t の先端と σ_n n の先端を結ぶ投影) */}
                {Math.hypot(txSvg - snSvgX, tySvg - snSvgY) > 2 && (
                  <>
                    <line
                      x1={cx + snSvgX}
                      y1={cy + snSvgY}
                      x2={cx + txSvg}
                      y2={cy + tySvg}
                      stroke="var(--diagram-teal)"
                      strokeWidth="1.8"
                      strokeDasharray="3 2"
                      markerEnd="url(#c2-ts)"
                    />
                  </>
                )}

                {/* 角度 θ の表示 */}
                <text x="20" y="26" className="text-xs font-bold fill-current font-mono-num">
                  θ = {theta}° (φ_z = {tiltZ}°)
                </text>
              </svg>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full text-xs mt-1">
                <div className="app-surface-subtle rounded-lg p-2.5">
                  <div className="app-text-muted">垂直応力 σ_n</div>
                  <div className="font-bold text-blue-700 dark:text-blue-300 font-mono-num text-sm">
                    {round2(cauchy.sigmaN)} kPa
                  </div>
                </div>
                <div className="app-surface-subtle rounded-lg p-2.5">
                  <div className="app-text-muted">せん断応力大きさ τ_n</div>
                  <div className="font-bold text-teal-700 dark:text-teal-300 font-mono-num text-sm">
                    {round2(cauchy.tauN)} kPa
                  </div>
                </div>
                <div className="app-surface-subtle rounded-lg p-2.5">
                  <div className="app-text-muted">合応力大きさ ||t||</div>
                  <div className="font-bold text-violet-700 dark:text-violet-300 font-mono-num text-sm">
                    {round2(cauchy.tractionMagnitude)} kPa
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="app-surface rounded-xl p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-bold app-text-muted">
              リアルタイム計算（{convention === 'compression' ? '圧縮正' : '引張正'}・コーシーの公式 &amp; 2D座標変換）
            </h3>
            <MathFormula
              block
              math={`\\mathbf{t} = \\boldsymbol{\\sigma}\\mathbf{n} = \\begin{pmatrix} ${round2(cauchy.traction[0])} \\\\ ${round2(cauchy.traction[1])} \\\\ ${round2(cauchy.traction[2])} \\end{pmatrix}\\text{ kPa}`}
            />
            {tiltZ === 0 && (
              <MathFormula
                block
                math={`\\sigma_{x'} = ${round2(rot2d.sigmaXp)}\\text{ kPa},\\quad \\sigma_{y'} = ${round2(rot2d.sigmaYp)}\\text{ kPa},\\quad \\tau_{x'y'} = ${round2(rot2d.tauXpYp)}\\text{ kPa}\\quad (\\sigma_{x'}+\\sigma_{y'} = ${round2(rot2d.traceAfter)} = \\sigma_x+\\sigma_y)`}
              />
            )}
          </div>
        </div>
      </section>

      {/* 3. 演習 */}
      <ChapterExercisePanel
        chapterTitle="第2章：コーシーの公式・座標変換"
        exercises={exercises}
        completedIds={completedIds}
        onToggleDone={onToggleDone}
        onMarkDone={onMarkDone}
      />
    </div>
  );
};
