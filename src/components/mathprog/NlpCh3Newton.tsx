import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, SkipForward } from 'lucide-react';
import {
  NLP_MODELS,
  round2,
  round3,
  round4,
  runGradientDescent,
  runNewtonMethod,
} from '../../utils/mathProgramming';
import { SliderInput } from '../SliderInput';
import { MathFormula } from '../MathFormula';
import { NlpContourPlot } from './NlpContourPlot';
import { ChapterExercisePanel, type ContinuumExercise } from '../continuum/ChapterExercisePanel';

interface NlpCh3Props {
  completedIds: string[];
  onToggleDone: (id: string) => void;
  onMarkDone: (id: string) => void;
}

type NewtonModelId = 'infra-cost' | 'log-quad' | 'quad-convex';
const NEWTON_MODELS: NewtonModelId[] = ['infra-cost', 'log-quad', 'quad-convex'];

export const NlpCh3Newton: React.FC<NlpCh3Props> = ({
  completedIds,
  onToggleDone,
  onMarkDone,
}) => {
  const [modelId, setModelId] = useState<NewtonModelId>('infra-cost');
  const [x0_1, setX0_1] = useState<number>(NLP_MODELS['infra-cost'].defaultX0[0]);
  const [x0_2, setX0_2] = useState<number>(NLP_MODELS['infra-cost'].defaultX0[1]);
  const [stepIdx, setStepIdx] = useState(0);
  const [showGd, setShowGd] = useState(true);

  const model = NLP_MODELS[modelId];
  const newtonRecords = useMemo(
    () => runNewtonMethod(modelId, [x0_1, x0_2], 7, model.defaultTheta),
    [modelId, x0_1, x0_2, model.defaultTheta]
  );
  const gdTrail = useMemo(
    () =>
      showGd ? runGradientDescent(modelId, [x0_1, x0_2], 0.08, 18, model.defaultTheta) : undefined,
    [showGd, modelId, x0_1, x0_2, model.defaultTheta]
  );

  const safeIdx = Math.min(stepIdx, Math.max(0, newtonRecords.length - 1));
  const curRec = newtonRecords[safeIdx];
  const visibleTrajectory = newtonRecords.slice(0, safeIdx + 1).map((r) => r.x);

  const selectModel = (id: NewtonModelId, init?: [number, number], targetStep = 0) => {
    const m = NLP_MODELS[id];
    const [ix1, ix2] = init ?? m.defaultX0;
    setModelId(id);
    setX0_1(ix1);
    setX0_2(ix2);
    setStepIdx(targetStep);
  };

  const exercises: ContinuumExercise[] = [
    {
      id: 'nlp-ch3-q1',
      title: '問1：多変数ニュートン法の1回目反復計算',
      category: 'ニュートン法の手計算',
      statement:
        '制約なし非線形計画問題 min f(x₁, x₂) = 2x₁ + 2x₂ + 8/x₁ + 8/x₂ + (x₁ - x₂)² に対し、初期値 x⁽⁰⁾ = (1, 1) として直線探索を行わないニュートン法を適用する。1回目の反復が終了した直後の x₁⁽¹⁾ の値を求めよ。',
      mathContext:
        '\\mathbf{x}^{(1)} = \\mathbf{x}^{(0)} - H(\\mathbf{x}^{(0)})^{-1}\\nabla f(\\mathbf{x}^{(0)}),\\quad \\mathbf{x}^{(0)} = (1, 1)',
      kind: 'numeric',
      expectedValue: 1.375,
      tolerance: 0.005,
      unit: '',
      inputHint: 'x⁽⁰⁾=(1,1) における勾配 ∇f(1,1)=(-6,-6)ᵀ とヘッセ行列 H(1,1) を計算して連立方程式を解きます。',
      hint: 'H(1,1) = [[18, -2], [-2, 18]] より 18Δx₁ - 2Δx₂ = 6, -2Δx₁ + 18Δx₂ = 6。対称性より Δx₁ = Δx₂ = 6/16 = 0.375 となります。',
      steps: [
        {
          label: 'x⁽⁰⁾ = (1, 1) で勾配とヘッセ行列を求める',
          math: '\\nabla f(1,1) = \\begin{pmatrix} 2 - 8 + 0 \\\\ 2 - 8 - 0 \\end{pmatrix} = \\begin{pmatrix} -6 \\\\ -6 \\end{pmatrix},\\quad H(1,1) = \\begin{pmatrix} 18 & -2 \\\\ -2 & 18 \\end{pmatrix}',
        },
        {
          label: '更新ベクトル Δx = -H⁻¹∇f を計算し、x⁽¹⁾ を求める',
          math: '\\Delta x_1 = \\Delta x_2 = \\frac{6}{16} = 0.375 \\implies \\mathbf{x}^{(1)} = (1.375,\\; 1.375)',
        },
      ],
      answerSummary: 'x₁⁽¹⁾ = 1.375（= 11/8、x⁽¹⁾ = (1.375, 1.375)）',
      onApplyPreset: () => selectModel('infra-cost', [1, 1], 0),
    },
    {
      id: 'nlp-ch3-q2',
      title: '問2：多変数ニュートン法の収束特性と2次関数での振る舞い',
      category: 'ニュートン法の理論特性',
      statement:
        '直線探索なしの多変数ニュートン法 x⁽ᵏ⁺¹⁾ = x⁽ᵏ⁾ - H(x⁽ᵏ⁾)⁻¹∇f(x⁽ᵏ⁾) の性質として、最も適切な記述を選べ。',
      kind: 'choice',
      choices: [
        {
          id: 'a',
          label:
            '正定値な2次関数では任意の初期点から1回で厳密解に到達し、一般の狭義凸関数でも解の近傍で2次収束する',
        },
        {
          id: 'b',
          label:
            '2次導関数を使わずに勾配の逆向きだけへ進むため、2次関数であっても最適解へ到達するには数十回の反復が必要になる',
        },
        {
          id: 'c',
          label:
            'ヘッセ行列が非正定値であっても、ニュートン法を使えば必ず鞍点を避けて大域的最小点にのみ収束する',
        },
        {
          id: 'd',
          label:
            '定義域が x₁ > 0 の問題でも、直線探索なしでは常に領域の内部に留まり境界を越えることはない',
        },
      ],
      correctChoiceId: 'a',
      hint: 'ニュートン法は現在点で関数を2次テイラー近似して最小化するため、元の関数自体が正定値2次関数なら1歩で最適解に一致します。',
      steps: [
        {
          label: '2次テイラー近似の性質を確認する',
          math: 'q(\\mathbf{x}) = f(\\mathbf{x}^{(k)}) + \\nabla f^T(\\mathbf{x}-\\mathbf{x}^{(k)}) + \\frac{1}{2}(\\mathbf{x}-\\mathbf{x}^{(k)})^T H (\\mathbf{x}-\\mathbf{x}^{(k)})',
        },
        {
          label: '正定値2次関数では近似が厳密一致するため1回で収束（一般には局所2次収束）',
          math: '\\|\\mathbf{x}^{(k+1)} - \\mathbf{x}^*\\| \\le C \\|\\mathbf{x}^{(k)} - \\mathbf{x}^*\\|^2',
        },
      ],
      answerSummary: '正定値2次関数では1回で厳密解に到達し、一般には解近傍で2次収束する',
      onApplyPreset: () => selectModel('quad-convex', [0, 0], 0),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. 理解パート */}
      <section className="app-surface rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <h2 className="text-base sm:text-lg font-bold">
            1. 理解：多変数ニュートン法（2次近似による高速収束）
          </h2>
          <span className="rounded-md bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
            第3章：ニュートン法と収束
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm leading-relaxed">
          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">更新式と最急降下法との違い</h3>
            <p className="text-xs sm:text-sm app-text-muted">
              1階の勾配のみを使う最急降下法（ジグザグになりやすい）と異なり、ニュートン法は<strong>ヘッセ行列 <MathFormula math="H" />（曲率情報）の逆行列</strong>を掛けることで、楕円の細長い谷でも最小点方向を直接向いて一気に収束します。
            </p>
            <MathFormula block math={`\\mathbf{x}^{(k+1)} = \\mathbf{x}^{(k)} - H(\\mathbf{x}^{(k)})^{-1}\\nabla f(\\mathbf{x}^{(k)})`} />
          </div>

          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">2次収束と非凸・定義域外への注意</h3>
            <p className="text-xs sm:text-sm app-text-muted">
              解の近傍では誤差が反復ごとに「2乗」で縮む<strong>2次収束</strong>を示します。一方、直線探索（ステップ幅調整）を入れない場合、遠い初期点では定義域（<MathFormula math="x_1 > 0" /> 等）の外へ飛び出す危険があり、非凸関数ではヘッセ行列が非正定値になって鞍点や極大点へ引き寄せられることもあるため、実務では直線探索や修正ヘッセ行列と併用します。
            </p>
          </div>
        </div>
      </section>

      {/* 2. 想像パート */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-5 app-surface rounded-xl p-4 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold border-b border-[var(--border-subtle)] pb-2">
            2. 想像：ニュートン反復と最急降下法の軌跡比較
          </h2>

          <div className="flex flex-col gap-1.5">
            {NEWTON_MODELS.map((id) => (
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
              label="初期点 x₁⁽⁰⁾"
              symbol="x₁⁽⁰⁾"
              unit=""
              value={x0_1}
              min={model.positiveDomainOnly ? 0.5 : model.domainMin[0]}
              max={model.domainMax[0]}
              step={0.1}
              onChange={(v) => {
                setX0_1(v);
                setStepIdx(0);
              }}
            />
            <SliderInput
              label="初期点 x₂⁽⁰⁾"
              symbol="x₂⁽⁰⁾"
              unit=""
              value={x0_2}
              min={model.positiveDomainOnly ? 0.5 : model.domainMin[1]}
              max={model.domainMax[1]}
              step={0.1}
              onChange={(v) => {
                setX0_2(v);
                setStepIdx(0);
              }}
            />
          </div>

          <label className="flex items-center justify-between gap-2 text-xs font-semibold cursor-pointer">
            <span>最急降下法の軌跡（青緑破線）を比較表示</span>
            <input
              type="checkbox"
              checked={showGd}
              onChange={(e) => setShowGd(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent-color)]"
            />
          </label>

          {/* ステップ制御ボタン */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setStepIdx(0)}
              disabled={safeIdx === 0}
              className="interactive-btn app-surface-subtle inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold disabled:opacity-45 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              k=0
            </button>
            <button
              type="button"
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
              disabled={safeIdx === 0}
              className="interactive-btn app-surface-subtle inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold disabled:opacity-45 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              戻る
            </button>
            <button
              type="button"
              onClick={() => setStepIdx((i) => Math.min(newtonRecords.length - 1, i + 1))}
              disabled={safeIdx >= newtonRecords.length - 1}
              className="interactive-btn inline-flex items-center gap-1 rounded-md bg-blue-700 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-45 cursor-pointer"
            >
              1ステップ進める
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setStepIdx(newtonRecords.length - 1)}
              disabled={safeIdx >= newtonRecords.length - 1}
              className="interactive-btn app-surface-subtle inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold disabled:opacity-45 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
              収束点へ
            </button>
          </div>
        </aside>

        <div className="lg:col-span-7 space-y-4">
          <div className="app-surface rounded-xl overflow-hidden shadow-sm">
            <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">
                等高線上の探索軌跡（橙: ニュートン法 ／ 青緑破線: 最急降下法）
              </span>
              <span className="text-xs font-mono-num font-bold">
                表示ステップ k = {safeIdx} / {newtonRecords.length - 1}
              </span>
            </div>
            <div className="p-4">
              <NlpContourPlot
                modelId={modelId}
                theta={model.defaultTheta}
                trajectory={visibleTrajectory}
                activeStepIndex={safeIdx}
                secondaryTrajectory={gdTrail}
                secondaryIsDashed={true}
                ariaLabel="ニュートン法と最急降下法の反復軌跡の比較図"
              />
            </div>
          </div>

          {/* ステップkの詳細数式 */}
          {curRec && (
            <div className="app-surface rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold app-text-muted">
                  反復ステップ k = {curRec.k} の計算詳細
                </h3>
                {curRec.domainWarning && (
                  <span className="rounded bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-700 dark:text-red-300">
                    直線探索なしで次ステップが定義域外 (x ≤ 0) に到達
                  </span>
                )}
              </div>

              <div className="app-surface-subtle rounded-lg p-3 overflow-x-auto text-xs">
                <MathFormula
                  block
                  math={`\\mathbf{x}^{(${curRec.k})} = \\begin{pmatrix} ${round4(curRec.x[0])} \\\\ ${round4(curRec.x[1])} \\end{pmatrix},\\quad \\nabla f = \\begin{pmatrix} ${round4(curRec.grad[0])} \\\\ ${round4(curRec.grad[1])} \\end{pmatrix},\\quad H = \\begin{pmatrix} ${round3(curRec.hessian[0][0])} & ${round3(curRec.hessian[0][1])} \\\\ ${round3(curRec.hessian[1][0])} & ${round3(curRec.hessian[1][1])} \\end{pmatrix}`}
                />
                {curRec.nextX && curRec.deltaX && (
                  <MathFormula
                    block
                    math={`\\Delta\\mathbf{x}^{(${curRec.k})} = -H^{-1}\\nabla f = \\begin{pmatrix} ${round4(curRec.deltaX[0])} \\\\ ${round4(curRec.deltaX[1])} \\end{pmatrix} \\implies \\mathbf{x}^{(${curRec.k + 1})} = \\begin{pmatrix} ${round4(curRec.nextX[0])} \\\\ ${round4(curRec.nextX[1])} \\end{pmatrix}`}
                  />
                )}
              </div>

              {/* 反復履歴テーブル */}
              <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
                <table className="w-full border-collapse text-xs font-mono-num">
                  <thead>
                    <tr className="app-surface-subtle border-b border-[var(--border-subtle)]">
                      <th scope="col" className="px-2.5 py-1.5 text-left">k</th>
                      <th scope="col" className="px-2.5 py-1.5 text-right">x₁⁽ᵏ⁾</th>
                      <th scope="col" className="px-2.5 py-1.5 text-right">x₂⁽ᵏ⁾</th>
                      <th scope="col" className="px-2.5 py-1.5 text-right">f(x⁽ᵏ⁾)</th>
                      <th scope="col" className="px-2.5 py-1.5 text-right">‖∇f(x⁽ᵏ⁾)‖</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {newtonRecords.map((r) => (
                      <tr
                        key={`nr-${r.k}`}
                        className={r.k === safeIdx ? 'bg-blue-500/15 font-bold' : ''}
                      >
                        <td className="px-2 py-1">
                          <button
                            type="button"
                            aria-pressed={r.k === safeIdx}
                            aria-label={`反復ステップ ${r.k} を表示`}
                            onClick={() => setStepIdx(r.k)}
                            className={`rounded px-2.5 py-1 text-xs font-semibold cursor-pointer border ${
                              r.k === safeIdx
                                ? 'bg-blue-700 text-white border-blue-700'
                                : 'app-surface-subtle border-[var(--border-control)] hover:opacity-90'
                            }`}
                          >
                            {r.k}
                          </button>
                        </td>
                        <td className="px-2.5 py-1.5 text-right">{round4(r.x[0])}</td>
                        <td className="px-2.5 py-1.5 text-right">{round4(r.x[1])}</td>
                        <td className="px-2.5 py-1.5 text-right">{round4(r.f)}</td>
                        <td className="px-2.5 py-1.5 text-right">
                          {r.gradNorm < 1e-4 ? r.gradNorm.toExponential(2) : round4(r.gradNorm)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs app-text-muted">
                現在選択: x⁽⁰⁾ = ({round2(x0_1)}, {round2(x0_2)})。ステップ番号ボタンを押して反復を切り替えられます。
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 3. 演習パート */}
      <ChapterExercisePanel
        chapterTitle="第3章：多変数ニュートン法と反復収束"
        exercises={exercises}
        completedIds={completedIds}
        onToggleDone={onToggleDone}
        onMarkDone={onMarkDone}
      />
    </div>
  );
};
