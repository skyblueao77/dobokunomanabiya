import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, SkipForward } from 'lucide-react';
import {
  formatRational,
  runGaussJordanCustomOrder,
  runSimplexSteps,
  type SimplexProblemInput,
} from '../../utils/mathProgramming';
import { MathFormula } from '../MathFormula';
import { SimplexTableauView } from './SimplexTableauView';
import { ChapterExercisePanel, type ContinuumExercise } from '../continuum/ChapterExercisePanel';

interface LpCh2Props {
  completedIds: string[];
  onToggleDone: (id: string) => void;
  onMarkDone: (id: string) => void;
}

type SimplexPresetId = 'standard-3var' | 'neg-coeff' | 'two-phase';

interface SimplexPreset {
  id: SimplexPresetId;
  title: string;
  description: string;
  primalLatex: string;
  standardFormLatex: string;
  problem: SimplexProblemInput;
}

const SIMPLEX_PRESETS: Record<SimplexPresetId, SimplexPreset> = {
  'standard-3var': {
    id: 'standard-3var',
    title: '① 建設資材3品目の利益最大化（標準形）',
    description: 'すべての制約が「≤」かつ右辺が正のため、スラック変数を初期基底として即座に開始できます。',
    primalLatex:
      '\\max_{x_1,x_2,x_3}\\; 5x_1 + 3x_2 + 7x_3 \\quad\\text{s.t. } 2x_1 + x_2 + 2x_3 \\le 24,\\; x_1 + 2x_2 + 3x_3 \\le 30,\\; x_1,x_2,x_3 \\ge 0',
    standardFormLatex:
      '\\begin{aligned} z - 5x_1 - 3x_2 - 7x_3 &= 0 \\\\ 2x_1 + x_2 + 2x_3 + \\lambda_1 &= 24 \\\\ x_1 + 2x_2 + 3x_3 + \\lambda_2 &= 30 \\quad (x_j, \\lambda_i \\ge 0) \\end{aligned}',
    problem: {
      sense: 'max',
      c: [5, 3, 7],
      constraints: [
        { a: [2, 1, 2], op: '<=', b: 24 },
        { a: [1, 2, 3], op: '<=', b: 30 },
      ],
      varNames: ['x1', 'x2', 'x3'],
    },
  },
  'neg-coeff': {
    id: 'neg-coeff',
    title: '② 負係数を含む制約と「増加限界の除外ルール」',
    description:
      'ピボット列に 0 以下の係数が現れた行は、進入変数を増やしても負にならないため最小比計算から除外します。',
    primalLatex:
      '\\max_{x_1,x_2}\\; 2x_1 + 5x_2 \\quad\\text{s.t. } -x_1 + x_2 \\le 4,\\; x_1 + 2x_2 \\le 14,\\; 3x_1 - x_2 \\le 15,\\; x_1,x_2 \\ge 0',
    standardFormLatex:
      '\\begin{aligned} z - 2x_1 - 5x_2 &= 0 \\\\ -x_1 + x_2 + \\lambda_1 &= 4 \\\\ x_1 + 2x_2 + \\lambda_2 &= 14 \\\\ 3x_1 - x_2 + \\lambda_3 &= 15 \\quad (x_j, \\lambda_i \\ge 0) \\end{aligned}',
    problem: {
      sense: 'max',
      c: [2, 5],
      constraints: [
        { a: [-1, 1], op: '<=', b: 4 },
        { a: [1, 2], op: '<=', b: 14 },
        { a: [3, -1], op: '<=', b: 15 },
      ],
      varNames: ['x1', 'x2'],
    },
  },
  'two-phase': {
    id: 'two-phase',
    title: '③ 原点が非実行可能な最小化問題（二段階法）',
    description:
      '原点が制約を満たさない「≥」型問題。第1段階で人為変数を用いて実行可能頂点を見つけ、第2段階で本来の目的を最適化します。',
    primalLatex:
      '\\min_{x_1,x_2}\\; 2x_1 + 5x_2 \\quad\\text{s.t. } x_1 + 2x_2 \\ge 6,\\; 2x_1 + x_2 \\ge 6,\\; x_1,x_2 \\ge 0',
    standardFormLatex:
      '\\begin{aligned} (-w) + 2x_1 + 5x_2 &= 0 \\quad (z = -w \\text{ を最大化}) \\\\ x_1 + 2x_2 - \\lambda_1 + a_1 &= 6 \\\\ 2x_1 + x_2 - \\lambda_2 + a_2 &= 6 \\quad (x_j, \\lambda_i, a_i \\ge 0) \\end{aligned}',
    problem: {
      sense: 'min',
      c: [2, 5],
      constraints: [
        { a: [1, 2], op: '>=', b: 6 },
        { a: [2, 1], op: '>=', b: 6 },
      ],
      varNames: ['x1', 'x2'],
    },
  },
};

export const LpCh2Simplex: React.FC<LpCh2Props> = ({
  completedIds,
  onToggleDone,
  onMarkDone,
}) => {
  // 2A: 変則ガウス・ジョルダン消去
  const gjRes = useMemo(
    () =>
      runGaussJordanCustomOrder(
        [
          [2, 0, 1],
          [0, 4, 0],
          [1, 2, 0],
        ],
        [11, 12, 9],
        [
          [1, 1],
          [2, 0],
          [0, 2],
        ]
      ),
    []
  );
  const [gjStepIdx, setGjStepIdx] = useState(0);
  const currentGj = gjRes.steps[gjStepIdx] ?? gjRes.steps[0];

  // 2B: シンプレックスタブロー
  const [presetId, setPresetId] = useState<SimplexPresetId>('standard-3var');
  const [simStepIdx, setSimStepIdx] = useState(0);

  const preset = SIMPLEX_PRESETS[presetId];
  const simRes = useMemo(() => runSimplexSteps(preset.problem), [preset]);
  const safeSimIdx = Math.min(simStepIdx, simRes.steps.length - 1);
  const currentSim = simRes.steps[safeSimIdx];

  const selectPreset = (id: SimplexPresetId) => {
    setPresetId(id);
    setSimStepIdx(0);
  };

  const exercises: ContinuumExercise[] = [
    {
      id: 'lp-ch2-q1',
      title: '問1：負係数を含む制約がある LP のシンプレックス法',
      category: '増加限界とシンプレックス法',
      statement:
        '次の線形計画問題をシンプレックス法で解く。初回反復で x₂ を進入変数に選んだとき、増加限界の計算ルールに注意しながら反復を進め、目的関数 z の最適値を求めよ。',
      mathContext:
        '\\max_{x_1, x_2} 2x_1 + 5x_2 \\quad\\text{s.t. } -x_1 + x_2 \\le 4,\\; x_1 + 2x_2 \\le 14,\\; 3x_1 - x_2 \\le 15,\\; x_1, x_2 \\ge 0',
      kind: 'numeric',
      expectedValue: 34,
      tolerance: 0.2,
      unit: '',
      inputHint: '第3制約の x₂ 係数は -1 ≤ 0 のため増加限界の計算対象から除外します。',
      hint: '初回は x₂ が進入し、第1制約の増加限界 4/1=4 が最小なので λ₁ が退出して (x₁, x₂)=(0, 4) へ移動。次に x₁ が進入し (2, 6) で最適になります。',
      steps: [
        {
          label: '反復1：x₂ 列を進入列に選び、増加限界を計算（第3行は係数 -1 ≤ 0 のため除外）',
          math: '\\text{第1行: } \\frac{4}{1}=4,\\quad \\text{第2行: } \\frac{14}{2}=7,\\quad \\text{第3行: 除外} \\implies \\text{最小比 } 4\\text{（}\\lambda_1\\text{ 退出）}',
        },
        {
          label: '反復2：x₁ を進入させると (x₁, x₂) = (2, 6) に到達し、全 z 行係数が非負となる',
          math: 'z^* = 2(2) + 5(6) = 34',
        },
      ],
      answerSummary: '最適値 z* = 34（最適解 x₁ = 2, x₂ = 6）',
      onApplyPreset: () => selectPreset('neg-coeff'),
    },
    {
      id: 'lp-ch2-q2',
      title: '問2：3変数標準線形計画問題の最適値',
      category: 'シンプレックスタブロー',
      statement:
        '次の3変数線形計画問題を等式標準形に直し、シンプレックス法を適用して目的関数 z の最適値を求めよ。',
      mathContext:
        '\\max_{x_1, x_2, x_3} 5x_1 + 3x_2 + 7x_3 \\quad\\text{s.t. } 2x_1 + x_2 + 2x_3 \\le 24,\\; x_1 + 2x_2 + 3x_3 \\le 30,\\; x_1,x_2,x_3 \\ge 0',
      kind: 'numeric',
      expectedValue: 78,
      tolerance: 0.2,
      unit: '',
      inputHint: '最も利益単価の高い x₃ から進入させ、続いて x₁ を進入させます。',
      hint: '反復1で x₃ が第2行 (30/3=10) から進入し、反復2で x₁ が第1行から進入すると基底 (x₁, x₃) = (3, 9) に到達します。',
      steps: [
        {
          label: '反復1：x₃ を進入させ λ₂ を退出させる（基底: λ₁=4, x₃=10, z=70）',
          math: '\\min\\left(\\frac{24}{2},\\ \\frac{30}{3}\\right) = 10 \\implies x_3 = 10',
        },
        {
          label: '反復2：z 行で唯一負の x₁ を進入させ λ₁ を退出させる',
          math: 'x_1 = 3,\\ x_2 = 0,\\ x_3 = 9 \\implies z^* = 5(3) + 3(0) + 7(9) = 78',
        },
      ],
      answerSummary: '最適値 z* = 78（x₁ = 3, x₂ = 0, x₃ = 9）',
      onApplyPreset: () => selectPreset('standard-3var'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. 理解パート */}
      <section className="app-surface rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <h2 className="text-base sm:text-lg font-bold">
            1. 理解：等式標準形・変則掃き出し法とシンプレックス法の原理
          </h2>
          <span className="rounded-md bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
            第2章：等式標準形とシンプレックス法
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm leading-relaxed">
          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">① 等式標準形への変換</h3>
            <p className="text-xs app-text-muted">
              各不等式制約に非負の<strong>スラック変数</strong> <MathFormula math="\lambda_i \ge 0" />（<MathFormula math="\ge" /> なら余剰変数 <MathFormula math="-\lambda_i" /> と人為変数 <MathFormula math="a_i" />）を導入して等式に揃え、目的関数も <MathFormula math="z - \sum c_j x_j = 0" /> の形にまとめます。
            </p>
          </div>

          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">② ピボット選択（増加限界の注意点）</h3>
            <ul className="text-xs app-text-muted list-disc pl-4 space-y-1">
              <li>
                <strong>進入列</strong>：<MathFormula math="z" /> 行の非基底係数が負（最も小さい値）の変数を選ぶ。すべて <MathFormula math="\ge 0" /> なら最適！
              </li>
              <li>
                <strong>退出行</strong>：進入列の係数 <MathFormula math="a_{i,k} > 0" /> の行だけ比 <MathFormula math="b_i / a_{i,k}" /> を計算し最小の行を選ぶ。<strong><MathFormula math="a_{i,k} \le 0" /> の行は除外</strong>（増やしても非負制約を破らないため）。
              </li>
            </ul>
          </div>

          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">③ 変則ガウス・ジョルダン法</h3>
            <p className="text-xs app-text-muted">
              行を入れ替えなくても、<strong>各行にどの変数の単位列ベクトル（1 と 0 のみ）が配置されているか</strong>を追跡すれば、右辺の値からそのまま基底変数の解を読み取れます。これがタブローの「基底変数」列の意味です。
            </p>
          </div>
        </div>
      </section>

      {/* 2A. 変則ガウス・ジョルダン消去ステッパー */}
      <section className="app-surface rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <div>
            <h2 className="text-sm sm:text-base font-bold">
              2A. 想像：変則ガウス・ジョルダン消去ステッパー（行交換なし）
            </h2>
            <p className="text-xs app-text-muted mt-0.5">
              ピボット位置を「第2行 x₂ → 第3行 x₁ → 第1行 x₃」の順に掃き出し、行と変数の対応がどう決まるかを確認します。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setGjStepIdx(0)}
              disabled={gjStepIdx === 0}
              className="interactive-btn app-surface-subtle inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold disabled:opacity-45 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              初期へ
            </button>
            <button
              type="button"
              onClick={() => setGjStepIdx((i) => Math.max(0, i - 1))}
              disabled={gjStepIdx === 0}
              className="interactive-btn app-surface-subtle inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold disabled:opacity-45 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              戻る
            </button>
            <button
              type="button"
              onClick={() => setGjStepIdx((i) => Math.min(gjRes.steps.length - 1, i + 1))}
              disabled={gjStepIdx === gjRes.steps.length - 1}
              className="interactive-btn inline-flex items-center gap-1 rounded-md bg-blue-700 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-45 cursor-pointer"
            >
              次へ
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-4 app-surface-subtle rounded-lg p-3 overflow-x-auto">
            <MathFormula
              block
              math={`\\begin{pmatrix} 2 & 0 & 1 \\\\ 0 & 4 & 0 \\\\ 1 & 2 & 0 \\end{pmatrix}\\begin{pmatrix} x_1 \\\\ x_2 \\\\ x_3 \\end{pmatrix} = \\begin{pmatrix} 11 \\\\ 12 \\\\ 9 \\end{pmatrix}`}
            />
            <p className="text-xs app-text-muted mt-1">
              ステップ {gjStepIdx} / {gjRes.steps.length - 1}：{currentGj.description}
            </p>
          </div>

          <div className="lg:col-span-8 overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
            <table className="w-full border-collapse text-xs font-mono-num">
              <thead>
                <tr className="app-surface-subtle border-b border-[var(--border-subtle)]">
                  <th scope="col" className="px-3 py-2 text-left">対応する変数</th>
                  <th scope="col" className="px-3 py-2 text-right">x₁</th>
                  <th scope="col" className="px-3 py-2 text-right">x₂</th>
                  <th scope="col" className="px-3 py-2 text-right">x₃</th>
                  <th scope="col" className="px-3 py-2 text-right border-l border-[var(--border-subtle)]">右辺 b</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {currentGj.matrix.map((row, rIdx) => {
                  const mapped = currentGj.rowVarMapping[rIdx];
                  return (
                    <tr key={`gj-r-${rIdx}`}>
                      <th scope="row" className="px-3 py-2 text-left font-bold">
                        {mapped !== null ? (
                          <span className="text-emerald-700 dark:text-emerald-300">
                            x{mapped + 1} = {formatRational(row[3])}
                          </span>
                        ) : (
                          <span className="app-text-muted">未確定（行{rIdx + 1}）</span>
                        )}
                      </th>
                      {[0, 1, 2].map((cIdx) => {
                        const isNextPivot =
                          currentGj.nextPivot?.[0] === rIdx && currentGj.nextPivot?.[1] === cIdx;
                        const isJustApplied =
                          currentGj.appliedPivot?.[0] === rIdx && currentGj.appliedPivot?.[1] === cIdx;
                        return (
                          <td
                            key={`gj-${rIdx}-${cIdx}`}
                            className={`px-3 py-2 text-right ${
                              isNextPivot
                                ? 'bg-amber-500/25 font-bold ring-2 ring-inset ring-amber-600 dark:ring-amber-400'
                                : isJustApplied
                                  ? 'bg-emerald-500/15 font-bold'
                                  : ''
                            }`}
                          >
                            {formatRational(row[cIdx])}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-right font-semibold border-l border-[var(--border-subtle)]">
                        {formatRational(row[3])}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 2B. インタラクティブ・シンプレックスタブロー */}
      <section className="app-surface rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <h2 className="text-sm sm:text-base font-bold">
            2B. 想像：シンプレックスタブロー・ステップ実行器
          </h2>
          <span className="text-xs font-mono-num app-surface-subtle rounded px-2.5 py-1 font-semibold">
            ステップ {safeSimIdx + 1} / {simRes.steps.length}
            {currentSim.phase === 1 ? '（第1段階：人為変数消去）' : '（第2段階：本計算）'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(SIMPLEX_PRESETS) as SimplexPresetId[]).map((id) => (
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
              {SIMPLEX_PRESETS[id].title}
            </button>
          ))}
        </div>

        <p className="text-xs app-text-muted">{preset.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="app-surface-subtle rounded-lg p-3 overflow-x-auto">
            <div className="text-xs font-bold mb-1">元の線形計画問題</div>
            <MathFormula block math={preset.primalLatex} />
          </div>
          <div className="app-surface-subtle rounded-lg p-3 overflow-x-auto">
            <div className="text-xs font-bold mb-1">スラック変数等を導入した等式標準形</div>
            <MathFormula block math={preset.standardFormLatex} />
          </div>
        </div>

        {/* 操作バー */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSimStepIdx(0)}
              disabled={safeSimIdx === 0}
              className="interactive-btn app-surface-subtle inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-45 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              初期タブロー
            </button>
            <button
              type="button"
              onClick={() => setSimStepIdx((i) => Math.max(0, i - 1))}
              disabled={safeSimIdx === 0}
              className="interactive-btn app-surface-subtle inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-45 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              前の反復
            </button>
            <button
              type="button"
              onClick={() => setSimStepIdx((i) => Math.min(simRes.steps.length - 1, i + 1))}
              disabled={safeSimIdx >= simRes.steps.length - 1}
              className="interactive-btn inline-flex items-center gap-1 rounded-lg bg-blue-700 text-white px-3.5 py-1.5 text-xs font-semibold disabled:opacity-45 cursor-pointer"
            >
              ピボットを実行（次へ）
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setSimStepIdx(simRes.steps.length - 1)}
              disabled={safeSimIdx >= simRes.steps.length - 1}
              className="interactive-btn app-surface-subtle inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-45 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
              最適解へ
            </button>
          </div>

          {currentSim.status === 'optimal' && simRes.optimalObjective !== null && (
            <span className="rounded-lg bg-emerald-500/15 border border-emerald-500/35 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 font-mono-num">
              最適解: ({simRes.primalSolution.map((v) => formatRational(v)).join(', ')}) ／ 最適値:{' '}
              {formatRational(simRes.optimalObjective)}
            </span>
          )}
        </div>

        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3.5 py-2 text-xs font-medium">
          {currentSim.note}
        </div>

        <SimplexTableauView
          step={currentSim}
          highlightPivot={true}
          caption="シンプレックスタブローの反復経過"
        />

        <div className="flex flex-wrap items-center gap-4 text-xs app-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-blue-500/20 border border-blue-500/40 inline-block" aria-hidden="true" />
            進入列（ピボット列）
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-amber-500/30 border border-amber-600 inline-block" aria-hidden="true" />
            ピボット要素（退出行との交点）
          </span>
        </div>
      </section>

      {/* 3. 演習パート */}
      <ChapterExercisePanel
        chapterTitle="第2章：等式標準形・掃き出し法とシンプレックス法"
        exercises={exercises}
        completedIds={completedIds}
        onToggleDone={onToggleDone}
        onMarkDone={onMarkDone}
      />
    </div>
  );
};
