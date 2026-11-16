import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Circle, Play } from 'lucide-react';
import { type MohrInputs } from '../utils/mohrPhysics';
import { MathFormula } from './MathFormula';

interface Problem {
  id: number;
  category: string;
  title: string;
  statement: string;
  preset: Partial<MohrInputs>;
  steps: { label: string; math: string }[];
  answer: string;
}

const PROBLEMS: Problem[] = [
  {
    id: 1,
    category: '基本の応力計算',
    title: '問1：主応力から任意面の垂直応力・せん断応力を求める',
    statement:
      'ある土要素に最大主応力 σ₁ = 220 kPa、最小主応力 σ₃ = 100 kPa が作用している。最大主応力面（水平面）から反時計回りに θ = 30° 傾いた面における垂直応力 σ_θ とせん断応力 τ_θ を求めよ。',
    preset: {
      sigma1: 220,
      sigma3: 100,
      theta: 30,
      u: 0,
      useEffectiveStress: false,
    },
    steps: [
      {
        label: 'モール円の中心 C と半径 R を求める',
        math: 'C = \\frac{220 + 100}{2} = 160\\text{ kPa},\\quad R = \\frac{220 - 100}{2} = 60\\text{ kPa}',
      },
      {
        label: '円上の回転角 2θ = 60° を用いて σ_θ, τ_θ を計算する',
        math: '\\sigma_{30^\\circ} = 160 + 60\\cos(60^\\circ) = 160 + 30 = 190\\text{ kPa}',
      },
      {
        label: 'せん断応力 τ_θ',
        math: '\\tau_{30^\\circ} = 60\\sin(60^\\circ) = 60 \\times \\frac{\\sqrt{3}}{2} \\approx 51.96\\text{ kPa}',
      },
    ],
    answer: 'σ_θ = 190 kPa, τ_θ = 51.96 kPa',
  },
  {
    id: 2,
    category: '有効応力と間隙水圧',
    title: '問2：間隙水圧が作用するときの有効応力円',
    statement:
      "飽和粘土地盤において、全応力で σ₁ = 260 kPa、σ₃ = 120 kPa が作用しており、間隙水圧が u = 50 kPa 測定された。有効主応力 σ'₁, σ'₃ および有効応力円の中心 C' と半径 R' を求めよ。",
    preset: {
      sigma1: 260,
      sigma3: 120,
      theta: 45,
      u: 50,
      useEffectiveStress: true,
    },
    steps: [
      {
        label: "テルツァーギの有効応力の原理 σ' = σ - u を適用する",
        math: "\\sigma'_1 = 260 - 50 = 210\\text{ kPa},\\quad \\sigma'_3 = 120 - 50 = 70\\text{ kPa}",
      },
      {
        label: "有効応力円の中心 C' と半径 R' を求める",
        math: "C' = \\frac{210 + 70}{2} = 140\\text{ kPa},\\quad R' = \\frac{210 - 70}{2} = 70\\text{ kPa}",
      },
      {
        label: 'ポイント：間隙水圧 u により円は左へ平行移動するが、半径 R は変化しない',
        math: "C' = C - u = 190 - 50 = 140\\text{ kPa},\\quad R' = R = 70\\text{ kPa}",
      },
    ],
    answer: "σ'₁ = 210 kPa, σ'₃ = 70 kPa, C' = 140 kPa, R' = 70 kPa",
  },
  {
    id: 3,
    category: '三軸圧縮試験の破壊判定',
    title: '問3：モール・クーロンの破壊規準とせん断面角度',
    statement:
      "粘着力 c = 15 kPa、内部摩擦角 φ = 30° の土に対して、有効拘束圧 σ'₃ = 100 kPa で三軸圧縮試験を行った。破壊時の有効最大主応力 σ'₁ と、理論上のせん断面角度 θ_f を求めよ。",
    preset: {
      sigma1: 352,
      sigma3: 100,
      theta: 60,
      c: 15,
      phi: 30,
      u: 0,
      useEffectiveStress: false,
    },
    steps: [
      {
        label: '破壊時の主応力関係式（Rankine / Mohr-Coulomb 式）を用いる',
        math: "\\sigma'_1 = \\sigma'_3 \\tan^2\\left(45^\\circ + \\frac{\\phi}{2}\\right) + 2c\\tan\\left(45^\\circ + \\frac{\\phi}{2}\\right)",
      },
      {
        label: 'φ = 30° より tan(45° + 15°) = tan(60°) = √3 ≈ 1.732 を代入する',
        math: "\\sigma'_1 = 100 \\times (\\sqrt{3})^2 + 2 \\times 15 \\times \\sqrt{3} = 300 + 30\\sqrt{3} \\approx 351.96\\text{ kPa}",
      },
      {
        label: '理論上のせん断面角度 θ_f',
        math: '\\theta_f = 45^\\circ + \\frac{30^\\circ}{2} = 60^\\circ',
      },
    ],
    answer: "σ'₁ ≈ 351.96 kPa, θ_f = 60°",
  },
];

interface PracticeProblemsProps {
  onLoadPreset: (preset: Partial<MohrInputs>) => void;
  completedIds: number[];
  onToggleProblemDone: (id: number) => void;
}

export const PracticeProblems: React.FC<PracticeProblemsProps> = ({
  onLoadPreset,
  completedIds,
  onToggleProblemDone,
}) => {
  const [openIds, setOpenIds] = useState<number[]>([]);

  const toggle = (id: number) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section className="app-surface rounded-xl shadow-sm overflow-hidden">
      <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold">テスト対策・オリジナル演習問題（全3問）</h2>
          <p className="text-xs app-text-muted mt-0.5">
            各問題のステップ解説を確認し、条件をシミュレーターに読み込んで視覚的に検算できます。
          </p>
        </div>
        <span className="text-xs font-semibold font-mono-num app-surface rounded-md px-2.5 py-1">
          演習達成: {completedIds.length} / {PROBLEMS.length}
        </span>
      </div>

      <div className="divide-y divide-[var(--border-subtle)]">
        {PROBLEMS.map((prob) => {
          const isOpen = openIds.includes(prob.id);
          const isDone = completedIds.includes(prob.id);
          const panelId = `problem-steps-${prob.id}`;

          return (
            <div key={prob.id} className="p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-block rounded-md bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  {prob.category}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={isDone}
                    onClick={() => onToggleProblemDone(prob.id)}
                    className={`interactive-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border cursor-pointer ${
                      isDone
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35'
                        : 'app-surface'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <Circle className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    {isDone ? '演習完了' : '完了にする'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onLoadPreset(prob.preset)}
                    className="interactive-btn app-surface-subtle inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    シミュレーターに読み込む
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-bold">{prob.title}</h3>
              <p className="text-sm app-text-muted leading-relaxed">{prob.statement}</p>

              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(prob.id)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {isOpen ? (
                  <>
                    <ChevronUp className="w-4 h-4" aria-hidden="true" />
                    解説を閉じる
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" aria-hidden="true" />
                    ステップ解説を見る
                  </>
                )}
              </button>

              {isOpen && (
                <div
                  id={panelId}
                  className="app-surface-subtle rounded-lg p-4 space-y-2.5"
                >
                  {prob.steps.map((step, idx) => (
                    <div key={idx}>
                      <div className="text-xs font-semibold app-text-muted">
                        Step {idx + 1}: {step.label}
                      </div>
                      <MathFormula block math={step.math} />
                    </div>
                  ))}
                  <div className="pt-2 border-t border-[var(--border-subtle)] text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    解答: {prob.answer}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
