import React, { useMemo, useState } from 'react';
import {
  buildDualSummary,
  evaluateComplementarySlackness,
  formatRational,
  formatRationalLatex,
  round3,
  runSimplexSteps,
  type SimplexProblemInput,
} from '../../utils/mathProgramming';
import { SliderInput } from '../SliderInput';
import { MathFormula } from '../MathFormula';
import { SimplexTableauView } from './SimplexTableauView';
import { ChapterExercisePanel, type ContinuumExercise } from '../continuum/ChapterExercisePanel';

interface LpCh3Props {
  completedIds: string[];
  onToggleDone: (id: string) => void;
  onMarkDone: (id: string) => void;
}

type DualPresetId = 'standard-3var' | 'concrete-mix' | 'soil-stabilizer';

interface DualPreset {
  id: DualPresetId;
  title: string;
  primalLatex: string;
  dualLatex: string;
  problem: SimplexProblemInput;
  unitLabel: string;
}

const DUAL_PRESETS: Record<DualPresetId, DualPreset> = {
  'standard-3var': {
    id: 'standard-3var',
    title: '① 建設資材3品目の利益最大化（最大型 → 最小型）',
    primalLatex:
      '\\max_{x}\\; 5x_1 + 3x_2 + 7x_3 \\quad\\text{s.t. } 2x_1 + x_2 + 2x_3 \\le 24,\\; x_1 + 2x_2 + 3x_3 \\le 30,\\; x \\ge 0',
    dualLatex:
      '\\min_{y}\\; 24y_1 + 30y_2 \\quad\\text{s.t. } 2y_1 + y_2 \\ge 5,\\; y_1 + 2y_2 \\ge 3,\\; 2y_1 + 3y_2 \\ge 7,\\; y \\ge 0',
    problem: {
      sense: 'max',
      c: [5, 3, 7],
      constraints: [
        { a: [2, 1, 2], op: '<=', b: 24 },
        { a: [1, 2, 3], op: '<=', b: 30 },
      ],
      varNames: ['x1', 'x2', 'x3'],
    },
    unitLabel: '',
  },
  'concrete-mix': {
    id: 'concrete-mix',
    title: '② コンクリート二次製品の生産配分（3制約）',
    primalLatex:
      '\\max_{x}\\; 5x_1 + 4x_2 \\quad\\text{s.t. } 2x_1 + x_2 \\le 18,\\; x_1 + 2x_2 \\le 18,\\; x_1 \\le 7,\\; x \\ge 0',
    dualLatex:
      '\\min_{y}\\; 18y_1 + 18y_2 + 7y_3 \\quad\\text{s.t. } 2y_1 + y_2 + y_3 \\ge 5,\\; y_1 + 2y_2 \\ge 4,\\; y \\ge 0',
    problem: {
      sense: 'max',
      c: [5, 4],
      constraints: [
        { a: [2, 1], op: '<=', b: 18 },
        { a: [1, 2], op: '<=', b: 18 },
        { a: [1, 0], op: '<=', b: 7 },
      ],
      varNames: ['x1', 'x2'],
    },
    unitLabel: '百万円',
  },
  'soil-stabilizer': {
    id: 'soil-stabilizer',
    title: '③ 軟弱地盤改良固化材の配合（最小型 → 最大型）',
    primalLatex:
      '\\min_{x}\\; 4x_1 + 5x_2 \\quad\\text{s.t. } 3x_1 + x_2 \\ge 9,\\; x_1 + 2x_2 \\ge 8,\\; x_2 \\ge 1,\\; x \\ge 0',
    dualLatex:
      '\\max_{y}\\; 9y_1 + 8y_2 + y_3 \\quad\\text{s.t. } 3y_1 + y_2 \\le 4,\\; y_1 + 2y_2 + y_3 \\le 5,\\; y \\ge 0',
    problem: {
      sense: 'min',
      c: [4, 5],
      constraints: [
        { a: [3, 1], op: '>=', b: 9 },
        { a: [1, 2], op: '>=', b: 8 },
        { a: [0, 1], op: '>=', b: 1 },
      ],
      varNames: ['x1', 'x2'],
    },
    unitLabel: '万円',
  },
};

export const LpCh3Duality: React.FC<LpCh3Props> = ({
  completedIds,
  onToggleDone,
  onMarkDone,
}) => {
  const [presetId, setPresetId] = useState<DualPresetId>('standard-3var');
  const [selectedConstraint, setSelectedConstraint] = useState(0);
  const [deltaB, setDeltaB] = useState(1);

  const preset = DUAL_PRESETS[presetId];
  const sim = useMemo(() => runSimplexSteps(preset.problem), [preset]);
  const optStep = sim.steps[sim.steps.length - 1];
  const dualSummary = useMemo(() => buildDualSummary(preset.problem), [preset]);
  const csRows = useMemo(
    () => evaluateComplementarySlackness(preset.problem, sim.primalSolution, sim.dualSolution),
    [preset, sim.primalSolution, sim.dualSolution]
  );

  const selectPreset = (id: DualPresetId) => {
    setPresetId(id);
    setSelectedConstraint(0);
    setDeltaB(1);
  };

  const safeConIdx = Math.min(selectedConstraint, preset.problem.constraints.length - 1);
  const shadowPrice = sim.dualSolution[safeConIdx] ?? 0;
  const predictedDeltaOpt = shadowPrice * deltaB;
  const baseOpt = sim.optimalObjective ?? 0;
  const predictedNewOpt = baseOpt + predictedDeltaOpt;

  const exercises: ContinuumExercise[] = [
    {
      id: 'lp-ch3-q1',
      title: '問1：相補性条件から生産配分問題の双対解 y₁* を求める',
      category: '双対理論・相補性条件',
      statement:
        '最大型の主問題（max 5x₁ + 4x₂, s.t. 2x₁ + x₂ ≤ 18, x₁ + 2x₂ ≤ 18, x₁ ≤ 7, x₁,x₂ ≥ 0）において、主問題の最適解が (x₁*, x₂*) = (6, 6) であることが分かっている。相補性条件を用いて双対最適解 (y₁*, y₂*, y₃*) を求め、第1制約に対応する双対変数 y₁* の値を答えよ。',
      mathContext:
        '\\text{主最適解 } (x_1^*, x_2^*) = (6, 6),\\quad \\text{双対制約 } 2y_1 + y_2 + y_3 \\ge 5,\\; y_1 + 2y_2 \\ge 4',
      kind: 'numeric',
      expectedValue: 2,
      tolerance: 0.05,
      unit: '',
      inputHint: '第3制約 x₁ ≤ 7 は x₁*=6 < 7 で余裕があるため、相補性条件より y₃* = 0 となります。',
      hint: 'x₁* > 0, x₂* > 0 より双対の2本の制約はともに等号で成立し、y₃* = 0 から 2y₁ + y₂ = 5, y₁ + 2y₂ = 4 を解けます。',
      steps: [
        {
          label: '主制約3に余裕 (7 - 6 = 1 > 0) があるため、相補性条件より y₃* = 0',
          math: '(7 - x_1^*) y_3^* = 1 \\cdot y_3^* = 0 \\implies y_3^* = 0',
        },
        {
          label: 'x₁* > 0, x₂* > 0 より双対制約1・2は等号成立。連立方程式を解く',
          math: '2y_1^* + y_2^* = 5,\\quad y_1^* + 2y_2^* = 4 \\implies (y_1^*, y_2^*, y_3^*) = (2,\\ 1,\\ 0)',
        },
      ],
      answerSummary: 'y₁* = 2（y₂* = 1, y₃* = 0）',
      onApplyPreset: () => selectPreset('concrete-mix'),
    },
    {
      id: 'lp-ch3-q2',
      title: '問2：シャドー・プライスによる制約右辺変化の影響予測',
      category: 'シャドー・プライス（潜在価格）',
      statement:
        '最小型の配合問題（min 4x₁ + 5x₂, s.t. 3x₁ + x₂ ≥ 9, x₁ + 2x₂ ≥ 8, x₂ ≥ 1, x₁,x₂ ≥ 0）において、主最適解は (x₁*, x₂*) = (2, 3) であり、双対最適解は (y₁*, y₂*, y₃*) = (0.6, 2.2, 0) である。第2制約 x₁ + 2x₂ ≥ 8 の右辺（必要下限）が Δb₂ = 0.5 だけ増えたとき、最適総費用はいくら増えるか。',
      mathContext:
        '\\Delta w^* = y_2^* \\cdot \\Delta b_2 \\quad (\\text{ただし } \\Delta b_2 = 0.5)',
      kind: 'numeric',
      expectedValue: 1.1,
      tolerance: 0.05,
      unit: '万円',
      inputHint: '微小変化 Δb₂ に対する目的関数最適値の変化量は、対応する双対最適値 y₂* を掛けて求めます。',
      hint: '双対変数 y₂* = 2.2 は「第2制約の右辺が 1 増えたときの最小費用の増分」を表します。2.2 × 0.5 を計算してください。',
      steps: [
        {
          label: '強双対定理と双対最適解の意味を確認する',
          math: 'w^* = 9y_1^* + 8y_2^* + 1y_3^* \\implies \\frac{\\partial w^*}{\\partial b_2} = y_2^* = 2.2',
        },
        {
          label: '右辺増分 Δb₂ = 0.5 を掛ける',
          math: '\\Delta w^* = 2.2 \\times 0.5 = 1.1\\text{ 万円}',
        },
      ],
      answerSummary: '1.1 万円増加する',
      onApplyPreset: () => {
        selectPreset('soil-stabilizer');
        setSelectedConstraint(1);
        setDeltaB(0.5);
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. 理解パート */}
      <section className="app-surface rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <h2 className="text-base sm:text-lg font-bold">
            1. 理解：双対問題・強双対定理・相補性条件とシャドー・プライス
          </h2>
          <span className="rounded-md bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
            第3章：双対理論と相補性条件
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm leading-relaxed">
          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">① 主問題と双対問題の対応</h3>
            <p className="text-xs app-text-muted">
              主問題（<MathFormula math="\max \mathbf{c}^T\mathbf{x},\ A\mathbf{x}\le\mathbf{b}" />）の係数行列を転置し、目的係数 <MathFormula math="\mathbf{c}" /> と右辺 <MathFormula math="\mathbf{b}" /> を入れ替えた <MathFormula math="\min \mathbf{b}^T\mathbf{y},\ A^T\mathbf{y}\ge\mathbf{c}" /> が双対問題です。最適値が存在すれば両者は必ず一致します（<strong>強双対定理</strong>）。
            </p>
          </div>

          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">② 相補性条件（K.K.T.の原型）</h3>
            <p className="text-xs app-text-muted">
              主制約に余裕（スラック <MathFormula math=">0" />）があれば、対応する双対変数は必ず <MathFormula math="0" />。逆に双対変数 <MathFormula math="y_i^* > 0" /> なら主制約 <MathFormula math="i" /> は等号でギリギリ成立します。
            </p>
            <MathFormula block math={`(\\text{主制約余裕}_i) \\cdot y_i^* = 0,\\quad (\\text{双対余裕}_j) \\cdot x_j^* = 0`} />
          </div>

          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">③ タブローからの読取と潜在価格</h3>
            <p className="text-xs app-text-muted">
              主問題をシンプレックス法で解いた<strong>最適タブローの <MathFormula math="z" /> 行におけるスラック列 <MathFormula math="\lambda_i" /> の係数</strong>がそのまま双対最適解 <MathFormula math="y_i^*" />（＝制約右辺を1増やしたときの最適値変化率・シャドー・プライス）になります。
            </p>
          </div>
        </div>
      </section>

      {/* 2. 想像パート */}
      <section className="app-surface rounded-xl p-5 space-y-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <h2 className="text-sm sm:text-base font-bold">
            2. 想像：主問題・双対問題・相補性条件の連動検証
          </h2>
          <span className="text-xs font-mono-num app-surface-subtle rounded px-2.5 py-1 font-semibold">
            最適値一致：{formatRational(baseOpt)} {preset.unitLabel} ={' '}
            {formatRational(
              dualSummary.dualObjectiveCoeffs.reduce(
                (acc, bVal, i) => acc + bVal * (sim.dualSolution[i] ?? 0),
                0
              )
            )}{' '}
            {preset.unitLabel}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(DUAL_PRESETS) as DualPresetId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => selectPreset(id)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold border cursor-pointer transition-colors ${
                presetId === id
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'app-surface-subtle border-[var(--border-control)]'
              }`}
            >
              {DUAL_PRESETS[id].title}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="app-surface-subtle rounded-lg p-3.5 overflow-x-auto space-y-1">
            <div className="text-xs font-bold text-blue-700 dark:text-blue-300">
              主問題 (Primal) — 解: ({sim.primalSolution.map((v) => formatRational(v)).join(', ')})
            </div>
            <MathFormula block math={preset.primalLatex} />
          </div>
          <div className="app-surface-subtle rounded-lg p-3.5 overflow-x-auto space-y-1">
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              双対問題 (Dual) — 解: ({sim.dualSolution.map((v) => formatRational(v)).join(', ')})
            </div>
            <MathFormula block math={preset.dualLatex} />
          </div>
        </div>

        {/* 最適タブローとスラック列ハイライト */}
        <div className="space-y-2">
          <div className="text-xs font-bold app-text-muted">
            主問題の最適タブロー（緑色のスラック/余剰列の z 行が双対最適解 y* に一致）
          </div>
          <SimplexTableauView
            step={optStep}
            highlightCols={sim.constraintVarCols.filter((c) => c >= 0)}
            caption="主問題の最適タブローと双対最適解の対応"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* 相補性条件テーブル */}
          <div className="lg:col-span-7 overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
            <table className="w-full border-collapse text-xs font-mono-num">
              <thead>
                <tr className="app-surface-subtle border-b border-[var(--border-subtle)]">
                  <th scope="col" className="px-3 py-2 text-left">相補性条件チェック</th>
                  <th scope="col" className="px-3 py-2 text-right">制約余裕</th>
                  <th scope="col" className="px-3 py-2 text-right">乗数</th>
                  <th scope="col" className="px-3 py-2 text-right">積</th>
                  <th scope="col" className="px-3 py-2 text-center">判定</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {csRows.map((row, idx) => (
                  <tr key={`cs-${idx}`}>
                    <th scope="row" className="px-3 py-2 text-left font-medium">
                      {row.label}
                    </th>
                    <td className="px-3 py-2 text-right">{formatRational(row.slackValue)}</td>
                    <td className="px-3 py-2 text-right">{formatRational(row.multiplierValue)}</td>
                    <td className="px-3 py-2 text-right font-bold">{round3(row.product)}</td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 font-semibold ${
                          row.isSatisfied
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-red-500/15 text-red-700 dark:text-red-300'
                        }`}
                      >
                        {row.isSatisfied ? '成立 (=0)' : '不一致'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 微小変化Δb予測パネル */}
          <div className="lg:col-span-5 app-surface-subtle rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-bold">
              シャドー・プライスによる微小変化予測 (Δb)
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {preset.problem.constraints.map((_, idx) => (
                <button
                  key={`con-btn-${idx}`}
                  type="button"
                  onClick={() => setSelectedConstraint(idx)}
                  className={`rounded px-2.5 py-1 text-xs font-semibold border cursor-pointer ${
                    safeConIdx === idx
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'app-surface border-[var(--border-control)]'
                  }`}
                >
                  制約 {idx + 1} (y{idx + 1}*={formatRational(sim.dualSolution[idx] ?? 0)})
                </button>
              ))}
            </div>

            <SliderInput
              label={`第${safeConIdx + 1}制約 右辺の変化量`}
              symbol="Δb"
              unit=""
              value={deltaB}
              min={-2}
              max={2}
              step={0.5}
              onChange={setDeltaB}
            />

            <div className="app-surface rounded-md p-3 text-xs space-y-1 font-mono-num">
              <MathFormula
                block
                math={`\\Delta ${preset.problem.sense === 'max' ? 'z' : 'w'}^* \\approx y_{${safeConIdx + 1}}^* \\cdot \\Delta b = ${formatRationalLatex(shadowPrice)} \\times (${deltaB}) = ${round3(predictedDeltaOpt)}`}
              />
              <p className="app-text-muted">
                予測最適値：{formatRational(baseOpt)} + ({round3(predictedDeltaOpt)}) ={' '}
                <strong className="text-[var(--text-primary)]">
                  {round3(predictedNewOpt)} {preset.unitLabel}
                </strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 演習パート */}
      <ChapterExercisePanel
        chapterTitle="第3章：双対理論と相補性条件・シャドー・プライス"
        exercises={exercises}
        completedIds={completedIds}
        onToggleDone={onToggleDone}
        onMarkDone={onMarkDone}
      />
    </div>
  );
};
