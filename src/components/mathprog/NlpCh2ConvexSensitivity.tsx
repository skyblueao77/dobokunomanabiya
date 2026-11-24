import React, { useMemo, useState } from 'react';
import {
  NLP_MODELS,
  round2,
  round3,
  round4,
  solveParametricOptimum,
} from '../../utils/mathProgramming';
import { SliderInput } from '../SliderInput';
import { MathFormula } from '../MathFormula';
import { NlpContourPlot } from './NlpContourPlot';
import { ChapterExercisePanel, type ContinuumExercise } from '../continuum/ChapterExercisePanel';

interface NlpCh2Props {
  completedIds: string[];
  onToggleDone: (id: string) => void;
  onMarkDone: (id: string) => void;
}

type ParamModelId = 'infra-cost' | 'log-quad';

const CONVEX_PROOF_LATEX: Record<ParamModelId, string> = {
  'infra-cost':
    'D_1 = \\frac{16}{x_1^3} + 2 > 0,\\quad D_2 = \\frac{256}{x_1^3 x_2^3} + \\frac{32}{x_1^3} + \\frac{32}{x_2^3} > 0\\quad (\\forall x_1, x_2 > 0)',
  'log-quad':
    'D_1 = 2\\theta + \\frac{6}{x_1^2} > 0,\\quad D_2 = \\left(2\\theta + \\frac{6}{x_1^2}\\right)\\left(4 + \\frac{2}{x_2^2}\\right) - 1 > 8\\theta - 1 > 0\\quad (\\theta > 0.25,\\; x_1,x_2 > 0)',
};

export const NlpCh2ConvexSensitivity: React.FC<NlpCh2Props> = ({
  completedIds,
  onToggleDone,
  onMarkDone,
}) => {
  const [modelId, setModelId] = useState<ParamModelId>('infra-cost');
  const [theta, setTheta] = useState<number>(NLP_MODELS['infra-cost'].defaultTheta);

  const model = NLP_MODELS[modelId];
  const optRes = useMemo(() => solveParametricOptimum(modelId, theta), [modelId, theta]);

  // θ スイープによる最適解軌跡と最適値曲線 F*(θ)
  const sweepData = useMemo(() => {
    const pts: { th: number; xStar: [number, number]; fStar: number }[] = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const th = model.thetaMin + ((model.thetaMax - model.thetaMin) * i) / steps;
      const res = solveParametricOptimum(modelId, th);
      pts.push({ th, xStar: res.xStar, fStar: res.fStar });
    }
    return pts;
  }, [modelId, model.thetaMin, model.thetaMax]);

  const selectModel = (id: ParamModelId, customTheta?: number) => {
    setModelId(id);
    setTheta(customTheta ?? NLP_MODELS[id].defaultTheta);
  };

  const exercises: ContinuumExercise[] = [
    {
      id: 'nlp-ch2-q1',
      title: '問1：包絡線定理による最適値関数 F*(θ) の微分値',
      category: '包絡線定理 (Envelope Theorem)',
      statement:
        '対数障壁・2次配分モデル f(x₁, x₂; θ) = θx₁² + 2x₂² - 6 ln x₁ - 2 ln x₂ - x₁x₂（x₁, x₂ > 0, θ > 0.25）において、θ = 1 のときの最適解は x*(1) = (2, 1) である。最適値関数 F*(θ) = f(x*(θ); θ) について、包絡線定理を用いて θ = 1 における微分係数 dF*/dθ|_(θ=1) を求めよ。',
      mathContext:
        '\\frac{dF^*}{d\\theta}(\\theta) = \\left.\\frac{\\partial f(x_1, x_2; \\theta)}{\\partial\\theta}\\right|_{\\mathbf{x}=\\mathbf{x}^*(\\theta)}',
      kind: 'numeric',
      expectedValue: 4,
      tolerance: 0.05,
      unit: '',
      inputHint: '一階の最適性条件 ∇f = 0 により、dx*/dθ を経由する項が消えて ∂f/∂θ のみが残ります。',
      hint: 'f を θ で偏微分すると ∂f/∂θ = x₁² になります。これに x₁*(1) = 2 を代入してください。',
      steps: [
        {
          label: '包絡線定理を適用し、連鎖律の項 ∇f · (dx*/dθ) = 0 を消去する',
          math: '\\frac{dF^*}{d\\theta} = \\nabla_{\\mathbf{x}} f(\\mathbf{x}^*)\\cdot\\frac{d\\mathbf{x}^*}{d\\theta} + \\frac{\\partial f}{\\partial\\theta}(\\mathbf{x}^*;\\theta) = \\left(x_1^*(\\theta)\\right)^2',
        },
        {
          label: 'θ = 1 における x₁*(1) = 2 を代入する',
          math: '\\left.\\frac{dF^*}{d\\theta}\\right|_{\\theta=1} = 2^2 = 4',
        },
      ],
      answerSummary: 'dF*/dθ|_(θ=1) = 4',
      onApplyPreset: () => selectModel('log-quad', 1),
    },
    {
      id: 'nlp-ch2-q2',
      title: '問2：陰関数定理による最適解の感度 dx₁*/dθ の計算',
      category: '陰関数定理と感度分析',
      statement:
        '問1と同じモデル f(x₁, x₂; θ) = θx₁² + 2x₂² - 6 ln x₁ - 2 ln x₂ - x₁x₂ の一階の最適性条件 ∇f(x*(θ); θ) = 0 の両辺を θ で微分して線形連立方程式を立て、θ = 1（x* = (2, 1)）における最適解の感度 dx₁*/dθ|_(θ=1) を求めよ（小数で回答可）。',
      mathContext:
        'H(\\mathbf{x}^*; 1)\\begin{pmatrix} dx_1^*/d\\theta \\\\ dx_2^*/d\\theta \\end{pmatrix} = -\\frac{\\partial \\nabla f}{\\partial\\theta}(\\mathbf{x}^*; 1)',
      kind: 'numeric',
      expectedValue: -1.2,
      tolerance: 0.02,
      unit: '',
      inputHint: 'H(2,1) = [[3.5, -1], [-1, 6]]、右辺ベクトルは (-2x₁*, 0)ᵀ = (-4, 0)ᵀ となります。',
      hint: '3.5 (dx₁*/dθ) - (dx₂*/dθ) = -4 と -(dx₁*/dθ) + 6 (dx₂*/dθ) = 0 を連立します。det(H) = 21 - 1 = 20 です。',
      steps: [
        {
          label: '一階条件の両辺を θ で微分して連立方程式を作る',
          math: '\\begin{pmatrix} 2\\theta + 6/x_1^2 & -1 \\\\ -1 & 4 + 2/x_2^2 \\end{pmatrix}\\begin{pmatrix} dx_1^*/d\\theta \\\\ dx_2^*/d\\theta \\end{pmatrix} = \\begin{pmatrix} -2x_1^* \\\\ 0 \\end{pmatrix}',
        },
        {
          label: 'θ = 1, (x₁*, x₂*) = (2, 1) を代入して解く',
          math: '\\begin{pmatrix} 7/2 & -1 \\\\ -1 & 6 \\end{pmatrix}\\begin{pmatrix} dx_1^*/d\\theta \\\\ dx_2^*/d\\theta \\end{pmatrix} = \\begin{pmatrix} -4 \\\\ 0 \\end{pmatrix} \\implies \\frac{dx_1^*}{d\\theta} = -\\frac{24}{20} = -1.2\\quad \\left(\\frac{dx_2^*}{d\\theta} = -0.2\\right)',
        },
      ],
      answerSummary: 'dx₁*/dθ|_(θ=1) = -1.2（= -6/5）',
      onApplyPreset: () => selectModel('log-quad', 1),
    },
  ];

  // F*(θ) + 包絡線接線 SVG 座標
  const cw = 460;
  const ch = 200;
  const padL = 48;
  const padR = 20;
  const padT = 16;
  const padB = 32;
  const pW = cw - padL - padR;
  const pH = ch - padT - padB;
  const thMin = model.thetaMin;
  const thMax = model.thetaMax;
  const fVals = sweepData.map((p) => p.fStar);
  const fMin = Math.min(...fVals) - 1;
  const fMax = Math.max(...fVals) + 1;
  const toCx = (t: number) => padL + ((t - thMin) / Math.max(1e-6, thMax - thMin)) * pW;
  const toCy = (f: number) => padT + pH - ((f - fMin) / Math.max(1e-6, fMax - fMin)) * pH;

  const curvePath = sweepData
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toCx(p.th).toFixed(1)} ${toCy(p.fStar).toFixed(1)}`)
    .join(' ');
  const tanSpan = (thMax - thMin) * 0.28;
  const t1 = Math.max(thMin, theta - tanSpan);
  const t2 = Math.min(thMax, theta + tanSpan);
  const tanY1 = optRes.fStar + optRes.dFDtheta * (t1 - theta);
  const tanY2 = optRes.fStar + optRes.dFDtheta * (t2 - theta);

  return (
    <div className="space-y-6">
      {/* 1. 理解パート */}
      <section className="app-surface rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <h2 className="text-base sm:text-lg font-bold">
            1. 理解：狭義凸関数の一意大域最適性・陰関数定理と包絡線定理
          </h2>
          <span className="rounded-md bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
            第2章：狭義凸性と感度分析
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm leading-relaxed">
          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">① 狭義凸性と大域的最小点の一意性</h3>
            <p className="text-xs app-text-muted">
              定義域全域でヘッセ行列 <MathFormula math="H(\mathbf{x})" /> が正定値（<MathFormula math="D_1 > 0, D_2 > 0" />）ならば関数は<strong>狭義凸</strong>であり、<MathFormula math="\nabla f(\mathbf{x}^*) = \mathbf{0}" /> を満たす点は<strong>ただ1つの大域的最小点</strong>になります。
            </p>
          </div>

          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">② 陰関数定理による解の感度 dx*/dθ</h3>
            <p className="text-xs app-text-muted">
              パラメータ <MathFormula math="\theta" /> を含む一階条件 <MathFormula math="\nabla f(\mathbf{x}^*(\theta); \theta) = \mathbf{0}" /> の両辺を <MathFormula math="\theta" /> で全微分すると、感度ベクトルに関する線形連立方程式が得られます。
            </p>
            <MathFormula block math={`H(\\mathbf{x}^*;\\theta)\\frac{d\\mathbf{x}^*}{d\\theta} = -\\frac{\\partial \\nabla f}{\\partial\\theta}`} />
          </div>

          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">③ 包絡線定理（Envelope Theorem）</h3>
            <p className="text-xs app-text-muted">
              最適値関数 <MathFormula math="F^*(\theta) = f(\mathbf{x}^*(\theta);\theta)" /> の微分では、<MathFormula math="\nabla f(\mathbf{x}^*)=\mathbf{0}" /> のおかげで <MathFormula math="d\mathbf{x}^*/d\theta" /> を求めなくても直接偏微分だけで傾きが求まります！
            </p>
            <MathFormula block math={`\\frac{dF^*}{d\\theta} = \\frac{\\partial f}{\\partial\\theta}(\\mathbf{x}^*(\\theta);\\theta)`} />
          </div>
        </div>

        <p className="text-xs app-text-muted border-t border-[var(--border-subtle)] pt-3">
          ※ 注意：陰関数定理・包絡線定理が与える感度は現在点まわりの<strong>局所的な1次近似</strong>であり、パラメータの大幅変化時や実務の土木計画に存在する<strong>不等式制約・非凸性・不確実性</strong>がある場合には成立条件や大域挙動を別途検証する必要があります。
        </p>
      </section>

      {/* 2. 想像パート */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-5 app-surface rounded-xl p-4 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold border-b border-[var(--border-subtle)] pb-2">
            2. 想像：パラメータ θ の変化と感度・包絡線定理
          </h2>

          <div className="flex flex-col gap-1.5">
            {(['infra-cost', 'log-quad'] as ParamModelId[]).map((id) => (
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

          <div className="app-surface-subtle rounded-lg p-3 overflow-x-auto space-y-1.5">
            <MathFormula block math={model.formulaLatex} />
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              定義域全域で狭義凸となる根拠（シルベスター判定）：
            </div>
            <MathFormula block math={CONVEX_PROOF_LATEX[modelId]} />
          </div>

          <SliderInput
            label="コスト・重みパラメータ"
            symbol="θ"
            unit=""
            value={theta}
            min={model.thetaMin}
            max={model.thetaMax}
            step={model.thetaStep}
            onChange={setTheta}
          />

          {/* 陰関数定理と包絡線定理の数値パネル */}
          <div className="app-surface-subtle rounded-lg p-3.5 space-y-2 text-xs font-mono-num">
            <div>
              最適解 x*(θ) = (<strong>{round4(optRes.xStar[0])}</strong>,{' '}
              <strong>{round4(optRes.xStar[1])}</strong>) ／ F*(θ) ={' '}
              <strong>{round4(optRes.fStar)}</strong>
            </div>
            <div className="border-t border-[var(--border-subtle)] pt-2">
              <div className="font-bold text-blue-700 dark:text-blue-300 mb-1">
                陰関数定理の連立方程式と解（感度）：
              </div>
              <MathFormula
                block
                math={`\\begin{pmatrix} ${round3(optRes.hessianAtOpt[0][0])} & ${round3(optRes.hessianAtOpt[0][1])} \\\\ ${round3(optRes.hessianAtOpt[1][0])} & ${round3(optRes.hessianAtOpt[1][1])} \\end{pmatrix}\\begin{pmatrix} dx_1^*/d\\theta \\\\ dx_2^*/d\\theta \\end{pmatrix} = \\begin{pmatrix} ${round3(-optRes.dGradDtheta[0])} \\\\ ${round3(-optRes.dGradDtheta[1])} \\end{pmatrix} \\implies \\begin{pmatrix} ${round4(optRes.dxDtheta[0])} \\\\ ${round4(optRes.dxDtheta[1])} \\end{pmatrix}`}
              />
            </div>
            <div className="border-t border-[var(--border-subtle)] pt-2">
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                包絡線定理 dF*/dθ = ∂f/∂θ = {round4(optRes.dFDtheta)}
              </span>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-7 space-y-4">
          {/* 1. 等高線＋最適解軌跡 */}
          <div className="app-surface rounded-xl overflow-hidden shadow-sm">
            <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">
                θ による等高線の変化と最適解軌跡 x*(θ)（青緑の線）
              </span>
            </div>
            <div className="p-4">
              <NlpContourPlot
                modelId={modelId}
                theta={theta}
                highlightOptimum={optRes.xStar}
                secondaryTrajectory={sweepData.map((p) => p.xStar)}
                secondaryIsDashed={false}
                ariaLabel="パラメータθに対する等高線と最適解軌跡"
              />
            </div>
          </div>

          {/* 2. F*(θ) と接線（包絡線定理） */}
          <div className="app-surface rounded-xl overflow-hidden shadow-sm">
            <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">
                最適値関数 F*(θ) と包絡線定理の接線（傾き = {round3(optRes.dFDtheta)}）
              </span>
            </div>
            <div className="p-4 flex flex-col items-center">
              <svg
                viewBox={`0 0 ${cw} ${ch}`}
                className="w-full max-w-[460px] h-auto select-none"
                role="img"
                aria-label="最適値関数F*(θ)と現在θにおける接線"
              >
                <line x1={padL} y1={padT + pH} x2={padL + pW} y2={padT + pH} stroke="currentColor" strokeOpacity="0.6" />
                <line x1={padL} y1={padT} x2={padL} y2={padT + pH} stroke="currentColor" strokeOpacity="0.6" />
                <path d={curvePath} fill="none" stroke="var(--diagram-blue)" strokeWidth="2.4" />
                <line
                  x1={toCx(t1)}
                  y1={toCy(tanY1)}
                  x2={toCx(t2)}
                  y2={toCy(tanY2)}
                  stroke="var(--diagram-amber)"
                  strokeWidth="2.2"
                  strokeDasharray="5 3"
                />
                <circle
                  cx={toCx(theta)}
                  cy={toCy(optRes.fStar)}
                  r="5.5"
                  fill="var(--diagram-emerald)"
                  stroke="var(--diagram-halo)"
                  strokeWidth="2"
                />
                <text x={padL + pW} y={padT + pH + 22} textAnchor="end" className="text-xs font-bold fill-current font-mono-num">
                  θ = {round2(theta)}
                </text>
                <text x={padL + 6} y={padT + 12} className="text-xs font-bold fill-current">
                  F*(θ)
                </text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 演習パート */}
      <ChapterExercisePanel
        chapterTitle="第2章：狭義凸性とパラメータ感度分析・包絡線定理"
        exercises={exercises}
        completedIds={completedIds}
        onToggleDone={onToggleDone}
        onMarkDone={onMarkDone}
      />
    </div>
  );
};
