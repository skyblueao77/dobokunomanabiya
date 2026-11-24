import React, { useMemo, useState } from 'react';
import {
  analyzeObjSensitivity,
  analyzeRhsSensitivity,
  formatRational,
  round2,
  runSimplexSteps,
  type SimplexProblemInput,
} from '../../utils/mathProgramming';
import { SliderInput } from '../SliderInput';
import { MathFormula } from '../MathFormula';
import { SimplexTableauView } from './SimplexTableauView';
import { ChapterExercisePanel, type ContinuumExercise } from '../continuum/ChapterExercisePanel';

interface LpCh4Props {
  completedIds: string[];
  onToggleDone: (id: string) => void;
  onMarkDone: (id: string) => void;
}

const BASE_PROBLEM: SimplexProblemInput = {
  sense: 'max',
  c: [5, 3, 7],
  constraints: [
    { a: [2, 1, 2], op: '<=', b: 24 },
    { a: [1, 2, 3], op: '<=', b: 30 },
  ],
  varNames: ['x1', 'x2', 'x3'],
};

type SensMode = 'rhs' | 'obj';

function formatBound(val: number): string {
  if (val === -Infinity) return '-∞';
  if (val === Infinity) return '+∞';
  return formatRational(val);
}

export const LpCh4Sensitivity: React.FC<LpCh4Props> = ({
  completedIds,
  onToggleDone,
  onMarkDone,
}) => {
  const [mode, setMode] = useState<SensMode>('rhs');
  const [conIdx, setConIdx] = useState<0 | 1>(1);
  const [deltaB, setDeltaB] = useState(2);
  const [varIdx, setVarIdx] = useState<0 | 1 | 2>(0);
  const [deltaC, setDeltaC] = useState(1);

  const baseSim = useMemo(() => runSimplexSteps(BASE_PROBLEM), []);
  const optStep = baseSim.steps[baseSim.steps.length - 1];

  const rhsRes = useMemo(
    () => analyzeRhsSensitivity(optStep, baseSim.constraintVarCols[conIdx], conIdx, deltaB),
    [optStep, baseSim.constraintVarCols, conIdx, deltaB]
  );

  const objRes = useMemo(
    () => analyzeObjSensitivity(optStep, varIdx, deltaC),
    [optStep, varIdx, deltaC]
  );

  // 真のLP再計算による現在パラメータでの最適解（基底変更後の比較用）
  const trueRecalc = useMemo(() => {
    if (mode === 'rhs') {
      const nextCons = BASE_PROBLEM.constraints.map((c, idx) =>
        idx === conIdx ? { ...c, b: c.b + deltaB } : c
      );
      return runSimplexSteps({ ...BASE_PROBLEM, constraints: nextCons });
    }
    const nextC = BASE_PROBLEM.c.map((cv, idx) => (idx === varIdx ? cv + deltaC : cv));
    return runSimplexSteps({ ...BASE_PROBLEM, c: nextC });
  }, [mode, conIdx, deltaB, varIdx, deltaC]);

  // Δ に応じた線形予測 vs 真の最適値グラフ用のサンプル点
  const chartPoints = useMemo(() => {
    const pts: { d: number; linearZ: number; trueZ: number | null }[] = [];
    const rangeMin = mode === 'rhs' ? -10 : -5;
    const rangeMax = mode === 'rhs' ? 12 : 6;
    const step = mode === 'rhs' ? 1 : 0.5;
    for (let d = rangeMin; d <= rangeMax + 1e-9; d += step) {
      const cleanD = round2(d);
      if (mode === 'rhs') {
        const lin = optStep.zValue + rhsRes.shadowPrice * cleanD;
        const nextCons = BASE_PROBLEM.constraints.map((c, idx) =>
          idx === conIdx ? { ...c, b: c.b + cleanD } : c
        );
        const sim = runSimplexSteps({ ...BASE_PROBLEM, constraints: nextCons });
        pts.push({
          d: cleanD,
          linearZ: lin,
          trueZ: sim.finalStatus === 'optimal' ? sim.optimalObjective : null,
        });
      } else {
        const basicRow = optStep.basis.indexOf(varIdx);
        const slope = basicRow !== -1 ? optStep.rhs[basicRow] : 0;
        const lin = optStep.zValue + slope * cleanD;
        const nextC = BASE_PROBLEM.c.map((cv, idx) => (idx === varIdx ? cv + cleanD : cv));
        const sim = runSimplexSteps({ ...BASE_PROBLEM, c: nextC });
        pts.push({
          d: cleanD,
          linearZ: lin,
          trueZ: sim.finalStatus === 'optimal' ? sim.optimalObjective : null,
        });
      }
    }
    return pts;
  }, [mode, conIdx, varIdx, optStep.zValue, optStep.basis, optStep.rhs, rhsRes.shadowPrice]);

  const activeDelta = mode === 'rhs' ? deltaB : deltaC;
  const activeMin = mode === 'rhs' ? rhsRes.minDelta : objRes.minDelta;
  const activeMax = mode === 'rhs' ? rhsRes.maxDelta : objRes.maxDelta;
  const isBasisValid = mode === 'rhs' ? rhsRes.isBasisValid : objRes.isBasisValid;
  const linearZNow = mode === 'rhs' ? rhsRes.updatedZValue : objRes.updatedZValue;

  const exercises: ContinuumExercise[] = [
    {
      id: 'lp-ch4-q1',
      title: '問1：制約右辺値 Δb₂ の変化に対する最適基底維持の上限',
      category: '右辺値の感度分析',
      statement:
        '基準問題 max 5x₁ + 3x₂ + 7x₃, s.t. 2x₁ + x₂ + 2x₃ ≤ 24, x₁ + 2x₂ + 3x₃ ≤ 30 において、第2制約の右辺が 30 + Δb₂ に変化する。現在の最適基底 (x₁, x₃) がそのまま最適であり続ける Δb₂ の最大値（上限）を求めよ。',
      mathContext:
        '\\mathbf{x}_B(\\Delta b_2) = \\begin{pmatrix} x_1 \\\\ x_3 \\end{pmatrix} = \\begin{pmatrix} 3 \\\\ 9 \\end{pmatrix} + \\begin{pmatrix} -1/2 \\\\ 1/2 \\end{pmatrix}\\Delta b_2 \\ge \\mathbf{0}',
      kind: 'numeric',
      expectedValue: 6,
      tolerance: 0.05,
      unit: '',
      inputHint: 'スラック変数 λ₂ 列の係数 (-1/2, 1/2) を用いて x₁ ≥ 0, x₃ ≥ 0 となる範囲を解きます。',
      hint: '3 - (1/2)Δb₂ ≥ 0 から上限 Δb₂ ≤ 6 が、9 + (1/2)Δb₂ ≥ 0 から下限 Δb₂ ≥ -18 が得られます。',
      steps: [
        {
          label: '最適タブローの λ₂ 列の係数 (-1/2, 1/2) から各基底変数の非負条件を立てる',
          math: 'x_1 = 3 - \\frac{1}{2}\\Delta b_2 \\ge 0,\\quad x_3 = 9 + \\frac{1}{2}\\Delta b_2 \\ge 0',
        },
        {
          label: 'Δb₂ について解き、上限を求める',
          math: '-18 \\le \\Delta b_2 \\le 6 \\implies \\text{上限 } = 6',
        },
      ],
      answerSummary: 'Δb₂ の上限 = 6（範囲 -18 ≤ Δb₂ ≤ 6）',
      onApplyPreset: () => {
        setMode('rhs');
        setConIdx(1);
        setDeltaB(6);
      },
    },
    {
      id: 'lp-ch4-q2',
      title: '問2：目的関数係数 Δc₁ の変化に対する最適基底維持の上限',
      category: '目的係数の感度分析',
      statement:
        '同じ基準問題において、基底変数 x₁ の目的係数 5 が 5 + Δc₁ に変化する。現在の最適基底 (x₁, x₃) が最適性を失わない（全非基底変数の z 行係数が 0 以上を保つ）Δc₁ の最大値（上限）を求めよ。',
      mathContext:
        '\\text{第1基底行 }(x_1\\text{行})\\text{ の非基底係数 } (x_2, \\lambda_1, \\lambda_2) = \\left(-\\frac{1}{4},\\; \\frac{3}{4},\\; -\\frac{1}{2}\\right),\\quad \\bar{\\mathbf{c}} = (1,\\; 2,\\; 1)',
      kind: 'numeric',
      expectedValue: 2,
      tolerance: 0.05,
      unit: '',
      inputHint: '非基底列 k ごとに (z行係数) + (x₁行係数) × Δc₁ ≥ 0 を立てて共通範囲を求めます。',
      hint: 'x₂列: 1 - (1/4)Δc₁ ≥ 0 (Δc₁ ≤ 4)、λ₁列: 2 + (3/4)Δc₁ ≥ 0 (Δc₁ ≥ -8/3)、λ₂列: 1 - (1/2)Δc₁ ≥ 0 (Δc₁ ≤ 2) の共通部分をとります。',
      steps: [
        {
          label: '各非基底列に対する z 行係数更新式を立てる',
          math: '1 - \\frac{1}{4}\\Delta c_1 \\ge 0,\\quad 2 + \\frac{3}{4}\\Delta c_1 \\ge 0,\\quad 1 - \\frac{1}{2}\\Delta c_1 \\ge 0',
        },
        {
          label: 'すべての不等式を満たす Δc₁ の範囲をまとめる',
          math: '-\\frac{8}{3} \\le \\Delta c_1 \\le 2 \\implies \\text{上限 } = 2',
        },
      ],
      answerSummary: 'Δc₁ の上限 = 2（範囲 -8/3 ≤ Δc₁ ≤ 2）',
      onApplyPreset: () => {
        setMode('obj');
        setVarIdx(0);
        setDeltaC(2);
      },
    },
  ];

  // SVG チャート座標
  const cw = 480;
  const ch = 220;
  const padL = 46;
  const padR = 20;
  const padT = 18;
  const padB = 34;
  const pW = cw - padL - padR;
  const pH = ch - padT - padB;
  const dMin = chartPoints[0]?.d ?? -10;
  const dMax = chartPoints[chartPoints.length - 1]?.d ?? 12;
  const allZ = chartPoints
    .flatMap((p) => (p.trueZ !== null ? [p.linearZ, p.trueZ] : [p.linearZ]))
    .filter((v) => Number.isFinite(v));
  const zMin = Math.min(...allZ) - 5;
  const zMax = Math.max(...allZ) + 5;
  const toCx = (d: number) => padL + ((d - dMin) / Math.max(1e-6, dMax - dMin)) * pW;
  const toCy = (z: number) => padT + pH - ((z - zMin) / Math.max(1e-6, zMax - zMin)) * pH;

  const linearPath = chartPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toCx(p.d).toFixed(1)} ${toCy(p.linearZ).toFixed(1)}`)
    .join(' ');
  const truePts = chartPoints.filter((p): p is { d: number; linearZ: number; trueZ: number } => p.trueZ !== null);
  const truePath = truePts
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toCx(p.d).toFixed(1)} ${toCy(p.trueZ).toFixed(1)}`)
    .join(' ');

  return (
    <div className="space-y-6">
      {/* 1. 理解パート */}
      <section className="app-surface rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <h2 className="text-base sm:text-lg font-bold">
            1. 理解：条件変化に対する最適解の追跡（感度分析）
          </h2>
          <span className="rounded-md bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
            第4章：感度分析
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm leading-relaxed">
          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">① 制約右辺値（資源量）の変化 Δbᵢ</h3>
            <p className="text-xs app-text-muted">
              制約 <MathFormula math="i" /> の右辺が <MathFormula math="b_i + \Delta b_i" /> に変わると、最適タブローのスラック列 <MathFormula math="\lambda_i" /> の係数 <MathFormula math="\alpha_{r,\lambda_i}" /> を使って基底変数の値が更新されます。すべて <MathFormula math="\ge 0" /> を保つ範囲では最適基底が変わりません。
            </p>
            <MathFormula
              block
              math={`b_r^*(\\Delta b_i) = b_r^* + \\alpha_{r,\\lambda_i}\\Delta b_i \\ge 0,\\quad z^*(\\Delta b_i) = z^* + y_i^*\\Delta b_i`}
            />
          </div>

          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">② 目的関数係数（利益単価）の変化 Δcⱼ</h3>
            <p className="text-xs app-text-muted">
              最適性の条件は「全非基底列の被約費用 <MathFormula math="\bar{c}_k \ge 0" />」が保たれることです。基底変数 <MathFormula math="x_j" />（行 <MathFormula math="r" />）の係数が <MathFormula math="\Delta c_j" /> 変化すると、各非基底列 <MathFormula math="k" /> の <MathFormula math="z" /> 行係数が次のように変わります。
            </p>
            <MathFormula
              block
              math={`\\bar{c}_k^{\\text{new}} = \\bar{c}_k + a_{r,k}\\Delta c_j \\ge 0\\quad (\\text{非基底変数 } x_j \\text{ なら } \\bar{c}_j - \\Delta c_j \\ge 0)`}
            />
          </div>
        </div>
      </section>

      {/* 2. 想像パート */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-5 app-surface rounded-xl p-4 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold border-b border-[var(--border-subtle)] pb-2">
            2. 想像：パラメータ摂動シミュレーター
          </h2>

          <div className="app-surface-subtle rounded-lg p-3 overflow-x-auto text-xs">
            <div className="font-bold mb-1">基準問題 (最適基底 x₁=3, x₃=9, z*=78)</div>
            <MathFormula
              block
              math={`\\max 5x_1 + 3x_2 + 7x_3 \\quad \\text{s.t. } 2x_1+x_2+2x_3\\le 24,\\; x_1+2x_2+3x_3\\le 30`}
            />
          </div>

          {/* モード切替 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('rhs')}
              className={`rounded-lg px-3 py-2 text-xs font-semibold border cursor-pointer ${
                mode === 'rhs'
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'app-surface-subtle border-[var(--border-control)]'
              }`}
            >
              A. 右辺値の変化 Δb
            </button>
            <button
              type="button"
              onClick={() => setMode('obj')}
              className={`rounded-lg px-3 py-2 text-xs font-semibold border cursor-pointer ${
                mode === 'obj'
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'app-surface-subtle border-[var(--border-control)]'
              }`}
            >
              B. 目的係数の変化 Δc
            </button>
          </div>

          {mode === 'rhs' ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {([0, 1] as const).map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setConIdx(idx)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold border cursor-pointer ${
                      conIdx === idx
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'app-surface-subtle border-[var(--border-control)]'
                    }`}
                  >
                    第{idx + 1}制約 (b{idx + 1} = {BASE_PROBLEM.constraints[idx].b})
                  </button>
                ))}
              </div>

              <SliderInput
                label={`第${conIdx + 1}制約 右辺の変化量`}
                symbol={`Δb_${conIdx + 1}`}
                unit=""
                value={deltaB}
                min={-10}
                max={12}
                step={0.5}
                onChange={setDeltaB}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {([0, 1, 2] as const).map((idx) => {
                  const isB = optStep.basis.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setVarIdx(idx)}
                      className={`rounded-md px-2.5 py-1.5 text-xs font-semibold border cursor-pointer ${
                        varIdx === idx
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'app-surface-subtle border-[var(--border-control)]'
                      }`}
                    >
                      x{idx + 1} ({isB ? '基底' : '非基底'})
                    </button>
                  );
                })}
              </div>

              <SliderInput
                label={`変数 x${varIdx + 1} の目的係数変化`}
                symbol={`Δc_${varIdx + 1}`}
                unit=""
                value={deltaC}
                min={-5}
                max={6}
                step={0.5}
                onChange={setDeltaC}
              />
            </div>
          )}

          {/* 許容範囲サマリー */}
          <div className="app-surface-subtle rounded-lg p-3.5 space-y-2 text-xs font-mono-num">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">最適基底が維持される許容範囲：</span>
              <span
                className={`rounded px-2 py-0.5 font-bold ${
                  isBasisValid
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-500/15 text-red-700 dark:text-red-300'
                }`}
              >
                {isBasisValid ? '基底有効' : '基底変更が必要'}
              </span>
            </div>
            <div className="text-sm font-bold">
              {formatBound(activeMin)} ≤ {mode === 'rhs' ? `Δb_${conIdx + 1}` : `Δc_${varIdx + 1}`} ≤{' '}
              {formatBound(activeMax)}
            </div>
            <p className="app-text-muted leading-relaxed">
              基底維持式での予測 z = <strong>{formatRational(linearZNow)}</strong>
              {trueRecalc.optimalObjective !== null && (
                <>
                  {' '}
                  ／ 真のLP再計算 z* = <strong>{formatRational(trueRecalc.optimalObjective)}</strong>
                </>
              )}
            </p>
          </div>
        </aside>

        <div className="lg:col-span-7 space-y-4">
          {/* 線形予測 vs 真の最適値チャート */}
          <div className="app-surface rounded-xl overflow-hidden shadow-sm">
            <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">
                基底固定による線形予測 vs 真の最適値（許容範囲外で傾きが変化）
              </span>
            </div>
            <div className="p-4 flex flex-col items-center">
              <svg
                viewBox={`0 0 ${cw} ${ch}`}
                className="w-full max-w-[500px] h-auto select-none"
                role="img"
                aria-label="パラメータ変化に対する基底固定予測と真の最適値の比較グラフ"
              >
                {/* 許容範囲ハイライト帯 */}
                {(() => {
                  const xLeft = toCx(Math.max(dMin, activeMin));
                  const xRight = toCx(Math.min(dMax, activeMax));
                  if (xRight <= xLeft) return null;
                  return (
                    <rect
                      x={xLeft}
                      y={padT}
                      width={xRight - xLeft}
                      height={pH}
                      fill="var(--diagram-emerald)"
                      fillOpacity="0.12"
                    />
                  );
                })()}

                {/* 軸 */}
                <line x1={padL} y1={padT + pH} x2={padL + pW} y2={padT + pH} stroke="currentColor" strokeOpacity="0.6" />
                <line x1={toCx(0)} y1={padT} x2={toCx(0)} y2={padT + pH} stroke="currentColor" strokeOpacity="0.3" strokeDasharray="3 3" />

                {/* 予測線 & 真の曲線 */}
                <path d={linearPath} fill="none" stroke="var(--diagram-amber)" strokeWidth="2" strokeDasharray="5 4" />
                {truePath && (
                  <path d={truePath} fill="none" stroke="var(--diagram-blue)" strokeWidth="2.5" />
                )}

                {/* 現在 Δ 垂直線 */}
                <line
                  x1={toCx(activeDelta)}
                  y1={padT}
                  x2={toCx(activeDelta)}
                  y2={padT + pH}
                  stroke={isBasisValid ? 'var(--diagram-emerald)' : 'var(--diagram-red)'}
                  strokeWidth="2"
                />

                <text x={padL + pW} y={padT + pH + 22} textAnchor="end" className="text-[11px] fill-[var(--text-muted)] font-mono-num">
                  {mode === 'rhs' ? `Δb_${conIdx + 1}` : `Δc_${varIdx + 1}`} = {activeDelta}
                </text>
                <text x={toCx(0) + 4} y={padT + 12} className="text-[11px] fill-[var(--text-muted)] font-mono-num">
                  Δ=0 (z*=78)
                </text>
              </svg>

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs app-text-muted pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-[var(--diagram-emerald)] opacity-30 inline-block" aria-hidden="true" />
                  基底維持の許容区間
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 bg-[var(--diagram-amber)] inline-block" aria-hidden="true" />
                  同一基底の線形予測
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 bg-[var(--diagram-blue)] inline-block" aria-hidden="true" />
                  真の最適値（再最適化）
                </span>
              </div>
            </div>
          </div>

          {/* 更新後タブロー */}
          <div className="app-surface rounded-xl p-4 shadow-sm space-y-2.5">
            <h3 className="text-xs font-bold app-text-muted">
              摂動適用後のタブロー（負になった基底値・被約費用は赤で警告表示）
            </h3>
            <SimplexTableauView
              step={optStep}
              highlightCols={mode === 'rhs' ? [baseSim.constraintVarCols[conIdx]] : [varIdx]}
              overrideZRow={mode === 'obj' ? objRes.updatedZRow : undefined}
              overrideZValue={linearZNow}
              overrideRhs={mode === 'rhs' ? rhsRes.updatedRhs : undefined}
              highlightNegative={true}
              caption="感度分析による摂動適用後のタブロー"
            />
          </div>
        </div>
      </section>

      {/* 3. 演習パート */}
      <ChapterExercisePanel
        chapterTitle="第4章：感度分析（右辺値・目的係数）"
        exercises={exercises}
        completedIds={completedIds}
        onToggleDone={onToggleDone}
        onMarkDone={onMarkDone}
      />
    </div>
  );
};
