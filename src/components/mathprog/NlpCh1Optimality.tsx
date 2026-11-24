import React, { useMemo, useState } from 'react';
import {
  NLP_MODELS,
  evaluateNlpPoint,
  round2,
  round3,
  type NlpModelId,
} from '../../utils/mathProgramming';
import { SliderInput } from '../SliderInput';
import { MathFormula } from '../MathFormula';
import { NlpContourPlot } from './NlpContourPlot';
import { ChapterExercisePanel, type ContinuumExercise } from '../continuum/ChapterExercisePanel';

interface NlpCh1Props {
  completedIds: string[];
  onToggleDone: (id: string) => void;
  onMarkDone: (id: string) => void;
}

const OPTIMALITY_MODEL_IDS: NlpModelId[] = ['quad-convex', 'cubic-saddle', 'double-well'];

export const NlpCh1Optimality: React.FC<NlpCh1Props> = ({
  completedIds,
  onToggleDone,
  onMarkDone,
}) => {
  const [modelId, setModelId] = useState<NlpModelId>('quad-convex');
  const [x1, setX1] = useState(2.0);
  const [x2, setX2] = useState(1.0);

  const model = NLP_MODELS[modelId];
  const ev = useMemo(() => evaluateNlpPoint(modelId, x1, x2), [modelId, x1, x2]);

  const selectModel = (id: NlpModelId, pt?: [number, number]) => {
    setModelId(id);
    const target = pt ?? NLP_MODELS[id].stationaryPoints?.[0]?.x ?? [0, 0];
    setX1(target[0]);
    setX2(target[1]);
  };

  const defLabel =
    ev.definiteness === 'positive-definite'
      ? '正定値（下に凸：極小点の十分条件）'
      : ev.definiteness === 'negative-definite'
        ? '負定値（上に凸：極大点）'
        : ev.definiteness === 'indefinite'
          ? '不定値（ある方向は増加・別方向は減少：鞍点）'
          : '半定値または退化';

  const exercises: ContinuumExercise[] = [
    {
      id: 'nlp-ch1-q1',
      title: '問1：2次非線形計画問題の一階・二階最適性条件と最小値',
      category: '最適性条件（2次関数）',
      statement:
        '制約なし非線形計画問題 min f(x₁, x₂) = 2x₁² - 2x₁x₂ + x₂² - 6x₁ + 2x₂ + 10 について、一階の最適性条件 ∇f(x*) = 0 を満たす点 x* を求め、その点における目的関数の最小値 f(x*) を答えよ。',
      mathContext:
        '\\min_{x_1, x_2} f(x_1, x_2) = 2x_1^2 - 2x_1 x_2 + x_2^2 - 6x_1 + 2x_2 + 10',
      kind: 'numeric',
      expectedValue: 5,
      tolerance: 0.05,
      unit: '',
      inputHint: '∂f/∂x₁ = 4x₁ - 2x₂ - 6 = 0 と ∂f/∂x₂ = -2x₁ + 2x₂ + 2 = 0 を連立して解きます。',
      hint: '2式を足すと 2x₁ - 4 = 0 より x₁* = 2、これを第2式へ代入すると x₂* = 1 が得られます。',
      steps: [
        {
          label: '一階の必要条件 ∇f(x*) = 0 を立てて解く',
          math: '\\begin{cases} 4x_1 - 2x_2 - 6 = 0 \\\\ -2x_1 + 2x_2 + 2 = 0 \\end{cases} \\implies (x_1^*, x_2^*) = (2,\\ 1)',
        },
        {
          label: 'ヘッセ行列の正定値性を確認し、最小値を計算する',
          math: 'H = \\begin{pmatrix} 4 & -2 \\\\ -2 & 2 \\end{pmatrix}\\ (D_1=4>0,\\ D_2=4>0),\\quad f(2,1) = 8 - 4 + 1 - 12 + 2 + 10 = 5',
        },
      ],
      answerSummary: '最小値 f(2, 1) = 5',
      onApplyPreset: () => selectModel('quad-convex', [2, 1]),
    },
    {
      id: 'nlp-ch1-q2',
      title: '問2：非凸関数の停留点におけるヘッセ行列の定値性と鞍点判定',
      category: '二階条件と鞍点',
      statement:
        '関数 f(x₁, x₂) = x₁³ - 3x₁ + x₂² - 2x₂ + 5 について、勾配がゼロとなる停留点のうち x* = (-1, 1) におけるヘッセ行列 H(-1, 1) を調べたとき、この点の性質として正しいものはどれか。',
      mathContext:
        '\\nabla f(x_1, x_2) = \\begin{pmatrix} 3x_1^2 - 3 \\\\ 2x_2 - 2 \\end{pmatrix},\\quad H(x_1, x_2) = \\begin{pmatrix} 6x_1 & 0 \\\\ 0 & 2 \\end{pmatrix}',
      kind: 'choice',
      choices: [
        {
          id: 'a',
          label: '固有値が -6 と +2 となり不定値であるため、鞍点（最小点でも最大点でもない）である',
        },
        {
          id: 'b',
          label: '一階の最適性条件 ∇f = 0 を満たすため、必ず局所的最小点になる',
        },
        {
          id: 'c',
          label: '行列式が負であっても x₂ 方向に下に凸なので大域的最小点になる',
        },
        {
          id: 'd',
          label: '固有値がすべて負となるため、局所的最大点になる',
        },
      ],
      correctChoiceId: 'a',
      hint: 'x₁ = -1 をヘッセ行列へ代入すると diag(-6, 2) になります。x₁ 方向には上に凸（減少）、x₂ 方向には下に凸（増加）です。',
      steps: [
        {
          label: 'x* = (-1, 1) でのヘッセ行列を評価する',
          math: 'H(-1, 1) = \\begin{pmatrix} -6 & 0 \\\\ 0 & 2 \\end{pmatrix} \\implies \\text{固有値 } \\lambda_1 = 2 > 0,\\; \\lambda_2 = -6 < 0',
        },
        {
          label: '異符号の固有値を持つため不定値（鞍点）と判定される',
          math: 'x_1\\text{方向に動くと減少、}x_2\\text{方向に動くと増加} \\implies \\text{鞍点}',
        },
      ],
      answerSummary: '固有値 -6 と +2 の不定値であるため鞍点',
      onApplyPreset: () => selectModel('cubic-saddle', [-1, 1]),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. 理解パート */}
      <section className="app-surface rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <h2 className="text-base sm:text-lg font-bold">
            1. 理解：制約なし非線形計画の一階・二階最適性条件
          </h2>
          <span className="rounded-md bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
            第1章：最適性条件とヘッセ行列
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm leading-relaxed">
          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">一階の必要条件（停留点）</h3>
            <p className="text-xs sm:text-sm app-text-muted">
              滑らかな関数が極小となる点では、どの方向にも傾きがゼロでなければなりません。ただし、<strong>極大点や鞍点でも成り立つ</strong>ため「必要条件」にとどまります。
            </p>
            <MathFormula block math={`\\nabla f(\\mathbf{x}^*) = \\mathbf{0} \\iff \\frac{\\partial f}{\\partial x_1} = 0,\\; \\frac{\\partial f}{\\partial x_2} = 0`} />
          </div>

          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">二階の十分条件（ヘッセ行列の正定値性）</h3>
            <p className="text-xs sm:text-sm app-text-muted">
              2階導関数の行列である<strong>ヘッセ行列</strong> <MathFormula math="H(\mathbf{x}^*)" /> の主座小行列式 <MathFormula math="D_1 = H_{11} > 0,\ D_2 = \det H > 0" />（すなわち全固有値 <MathFormula math=">0" />）が成り立てば正定値となり、その停留点は<strong>孤立した局所的最小点</strong>と確定します。
            </p>
            <MathFormula block math={`H(\\mathbf{x}) = \\begin{pmatrix} \\partial^2 f/\\partial x_1^2 & \\partial^2 f/\\partial x_1\\partial x_2 \\\\ \\partial^2 f/\\partial x_2\\partial x_1 & \\partial^2 f/\\partial x_2^2 \\end{pmatrix}`} />
          </div>
        </div>
      </section>

      {/* 2. 想像パート */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-5 app-surface rounded-xl p-4 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold border-b border-[var(--border-subtle)] pb-2">
            2. 想像：等高線とヘッセ行列の定値性探索
          </h2>

          <div className="flex flex-col gap-1.5">
            {OPTIMALITY_MODEL_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => selectModel(id)}
                className={`text-left rounded-lg px-3 py-2 text-xs font-semibold border cursor-pointer transition-colors ${
                  modelId === id
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'app-surface-subtle border-[var(--border-control)]'
                }`}
              >
                {NLP_MODELS[id].name}
              </button>
            ))}
          </div>

          <div className="app-surface-subtle rounded-lg p-3 overflow-x-auto">
            <MathFormula block math={model.formulaLatex} />
          </div>

          <div className="space-y-3">
            <SliderInput
              label="座標 x₁"
              symbol="x₁"
              unit=""
              value={x1}
              min={model.domainMin[0]}
              max={model.domainMax[0]}
              step={0.1}
              onChange={setX1}
            />
            <SliderInput
              label="座標 x₂"
              symbol="x₂"
              unit=""
              value={x2}
              min={model.domainMin[1]}
              max={model.domainMax[1]}
              step={0.1}
              onChange={setX2}
            />
          </div>

          {model.stationaryPoints && (
            <div className="space-y-1.5 pt-1">
              <div className="text-xs font-bold">停留点へジャンプ</div>
              <div className="flex flex-wrap gap-1.5">
                {model.stationaryPoints.map((sp) => (
                  <button
                    key={sp.label}
                    type="button"
                    onClick={() => {
                      setX1(sp.x[0]);
                      setX2(sp.x[1]);
                    }}
                    className="interactive-btn app-surface-subtle rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer"
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <div className="lg:col-span-7 space-y-4">
          <div className="app-surface rounded-xl overflow-hidden shadow-sm">
            <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">
                等高線マップと勾配ベクトル（橙: +∇f / 緑: −∇f 降下方向）
              </span>
              <span className="text-xs font-mono-num font-bold">
                f({round2(x1)}, {round2(x2)}) = {round3(ev.value)}
              </span>
            </div>
            <div className="p-4">
              <NlpContourPlot
                modelId={modelId}
                theta={model.defaultTheta}
                currentPoint={[x1, x2]}
                showGradientArrow={true}
                ariaLabel="目的関数の等高線図と現在点における勾配および降下方向ベクトル"
              />
            </div>
          </div>

          {/* 勾配・ヘッセ行列詳細パネル */}
          <div className="app-surface rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold app-text-muted">
                現在点での1階勾配と2階ヘッセ行列の数値評価
              </h3>
              <span
                className={`rounded px-2 py-0.5 text-xs font-bold ${
                  ev.definiteness === 'positive-definite'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : ev.definiteness === 'indefinite'
                      ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                }`}
              >
                {defLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="app-surface-subtle rounded-lg p-3 overflow-x-auto">
                <MathFormula
                  block
                  math={`\\nabla f = \\begin{pmatrix} ${round3(ev.grad[0])} \\\\ ${round3(ev.grad[1])} \\end{pmatrix},\\quad \\|\\nabla f\\| = ${round3(ev.gradNorm)}`}
                />
              </div>
              <div className="app-surface-subtle rounded-lg p-3 overflow-x-auto">
                <MathFormula
                  block
                  math={`H = \\begin{pmatrix} ${round3(ev.hessian[0][0])} & ${round3(ev.hessian[0][1])} \\\\ ${round3(ev.hessian[1][0])} & ${round3(ev.hessian[1][1])} \\end{pmatrix}`}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-mono-num app-text-muted">
              <span>主座小行列式: D₁ = {round3(ev.d1)}, D₂ = det(H) = {round3(ev.d2)}</span>
              <span>固有値: λ₁ = {round3(ev.eigenvalues[0])}, λ₂ = {round3(ev.eigenvalues[1])}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 演習パート */}
      <ChapterExercisePanel
        chapterTitle="第1章：制約なし最適化の最適性条件とヘッセ行列"
        exercises={exercises}
        completedIds={completedIds}
        onToggleDone={onToggleDone}
        onMarkDone={onMarkDone}
      />
    </div>
  );
};
