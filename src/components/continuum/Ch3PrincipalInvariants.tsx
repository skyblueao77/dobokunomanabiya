import React, { useMemo, useState } from 'react';
import {
  calculatePrincipalAndInvariants,
  rotateTensor3D,
  round2,
  round4,
  type StressTensor3D,
} from '../../utils/continuumPhysics';
import { SliderInput } from '../SliderInput';
import { MathFormula } from '../MathFormula';
import { ChapterExercisePanel, type ContinuumExercise } from './ChapterExercisePanel';

interface Ch3Props {
  completedIds: string[];
  onToggleDone: (id: string) => void;
  onMarkDone: (id: string) => void;
}

export const Ch3PrincipalInvariants: React.FC<Ch3Props> = ({
  completedIds,
  onToggleDone,
  onMarkDone,
}) => {
  const [tensor, setTensor] = useState<StressTensor3D>({
    sxx: 180,
    syy: 110,
    szz: 140,
    txy: 45,
    tyz: -20,
    tzx: 25,
  });
  const [yaw, setYaw] = useState(35);
  const [pitch, setPitch] = useState(20);

  const orig = useMemo(() => calculatePrincipalAndInvariants(tensor), [tensor]);
  const rotatedTensor = useMemo(
    () => rotateTensor3D(tensor, yaw, pitch, 0),
    [tensor, yaw, pitch]
  );
  const rotatedRes = useMemo(
    () => calculatePrincipalAndInvariants(rotatedTensor),
    [rotatedTensor]
  );

  const update = (k: keyof StressTensor3D, v: number) =>
    setTensor((p) => ({ ...p, [k]: v }));

  const exercises: ContinuumExercise[] = [
    {
      id: 'ch3-q1',
      title: '問1：固有値計算なしで応力の第1不変量 I₁ を求める',
      category: '応力の不変量',
      statement:
        'ある地盤内の応力テンソル（圧縮正）が σ_x = 150 kPa, σ_y = 90 kPa, σ_z = 90 kPa, τ_xy = 40 kPa, τ_yz = τ_zx = 0 であるとき、第1不変量 I₁ = σ₁ + σ₂ + σ₃ を求めよ。',
      kind: 'numeric',
      expectedValue: 330,
      tolerance: 0.5,
      unit: 'kPa',
      inputHint: 'I₁ は座標系によらず対角成分の和と一致することを利用します。',
      hint: '固有値 σ₁, σ₂, σ₃ をわざわざ求める必要はありません。I₁ = tr(σ) = σ_x + σ_y + σ_z です。',
      steps: [
        {
          label: '第1不変量 I₁ の定義（テンソルのトレース）を用いる',
          math: 'I_1 = \\sigma_1 + \\sigma_2 + \\sigma_3 = \\sigma_x + \\sigma_y + \\sigma_z',
        },
        {
          label: '成分を代入する',
          math: 'I_1 = 150 + 90 + 90 = 330\\text{ kPa}',
        },
      ],
      answerSummary: '330 kPa',
      onApplyPreset: () => {
        setTensor({ sxx: 150, syy: 90, szz: 90, txy: 40, tyz: 0, tzx: 0 });
      },
    },
    {
      id: 'ch3-q2',
      title: '問2：三軸圧縮状態における偏差応力 q = √(3J₂)',
      category: '等方成分と偏差成分',
      statement:
        '三軸圧縮試験（軸対称状態）において、主応力が σ₁ = 240 kPa, σ₂ = σ₃ = 120 kPa である。平均主応力 p と偏差応力 q = √(3J₂) のうち、q の値を求めよ。',
      kind: 'numeric',
      expectedValue: 120,
      tolerance: 0.5,
      unit: 'kPa',
      inputHint: '三軸条件 (σ₂ = σ₃) における J₂ または q の式を計算してください。',
      hint: 'J₂ = [(σ₁-σ₂)² + (σ₂-σ₃)² + (σ₃-σ₁)²] / 6 です。σ₂ = σ₃ のときは q = σ₁ - σ₃ に一致します。',
      steps: [
        {
          label: '第2偏差応力不変量 J₂ を求める',
          math: 'J_2 = \\frac{1}{6}\\left[(240-120)^2 + (120-120)^2 + (120-240)^2\\right] = \\frac{2\\times 120^2}{6} = 4800\\text{ kPa}^2',
        },
        {
          label: '偏差応力 q = √(3J₂) を計算する',
          math: 'q = \\sqrt{3 \\times 4800} = \\sqrt{14400} = 120\\text{ kPa}\\quad (= \\sigma_1 - \\sigma_3)',
        },
      ],
      answerSummary: '120 kPa (平均主応力 p = 160 kPa)',
      onApplyPreset: () => {
        setTensor({ sxx: 120, syy: 120, szz: 240, txy: 0, tyz: 0, tzx: 0 });
      },
    },
  ];

  // 主応力バーの正規化
  const maxAbsP = Math.max(
    100,
    Math.abs(orig.principalStresses[0]),
    Math.abs(orig.principalStresses[2])
  );

  return (
    <div className="space-y-6">
      {/* 1. 理解 */}
      <section className="app-surface rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <h2 className="text-base sm:text-lg font-bold">
            1. 理解：主応力（固有値問題）と応力の不変量
          </h2>
          <span className="rounded-md bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
            第3章：主応力と応力の不変量
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm leading-relaxed">
          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">せん断応力がゼロになる面＝主応力面</h3>
            <p className="text-xs sm:text-sm app-text-muted">
              ある特別な法線方向 <MathFormula math="\mathbf{v}" /> では、応力ベクトル <MathFormula math="\mathbf{t}=\boldsymbol{\sigma}\mathbf{v}" /> が法線と平行（<MathFormula math="\sigma\mathbf{v}" />）になり、<strong>せん断応力が消滅</strong>します。これが固有値方程式であり、3つの実固有値が主応力 <MathFormula math="\sigma_1 \ge \sigma_2 \ge \sigma_3" /> です。
            </p>
            <MathFormula
              block
              math={`\\det(\\boldsymbol{\\sigma} - \\sigma\\mathbf{I}) = 0 \\iff \\sigma^3 - I_1\\sigma^2 + I_2\\sigma - I_3 = 0`}
            />
          </div>

          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">体積変化（p）とせん断変形・破壊（J₂, q）</h3>
            <p className="text-xs sm:text-sm app-text-muted">
              3次方程式の係数 <MathFormula math="I_1, I_2, I_3" /> は座標軸をどう回転しても変わらない「<strong>不変量</strong>」です。地盤工学では特に平均応力 <MathFormula math="p = I_1/3" />（体積圧縮を支配）と偏差応力不変量 <MathFormula math="J_2" />・軸差応力 <MathFormula math="q = \sqrt{3J_2}" />（せん断破壊・降伏を支配）へ分解して用います。
            </p>
            <MathFormula
              block
              math={`\\boldsymbol{\\sigma} = p\\mathbf{I} + \\mathbf{s},\\quad p = \\frac{I_1}{3},\\quad J_2 = \\frac{1}{2}\\mathbf{s}:\\mathbf{s},\\quad q = \\sqrt{3J_2}`}
            />
          </div>
        </div>
      </section>

      {/* 2. 想像 */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-5 app-surface rounded-xl p-4 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold border-b border-[var(--border-subtle)] pb-2">
            2. 想像：応力成分と「座標回転不変性」実験
          </h3>

          <div className="space-y-2.5">
            <SliderInput label="σ_x" symbol="σ_x" unit="kPa" value={tensor.sxx} min={-100} max={300} step={5} onChange={(v) => update('sxx', v)} />
            <SliderInput label="σ_y" symbol="σ_y" unit="kPa" value={tensor.syy} min={-100} max={300} step={5} onChange={(v) => update('syy', v)} />
            <SliderInput label="σ_z" symbol="σ_z" unit="kPa" value={tensor.szz} min={-100} max={300} step={5} onChange={(v) => update('szz', v)} />
            <SliderInput label="τ_xy" symbol="τ_xy" unit="kPa" value={tensor.txy} min={-100} max={100} step={5} onChange={(v) => update('txy', v)} />
            <SliderInput label="τ_yz" symbol="τ_yz" unit="kPa" value={tensor.tyz} min={-100} max={100} step={5} onChange={(v) => update('tyz', v)} />
            <SliderInput label="τ_zx" symbol="τ_zx" unit="kPa" value={tensor.tzx} min={-100} max={100} step={5} onChange={(v) => update('tzx', v)} />
          </div>

          <div className="border-t border-[var(--border-subtle)] pt-3 space-y-3">
            <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
              座標軸を 3D 回転させて不変性を確かめる
            </div>
            <SliderInput label="z軸まわり回転 (Yaw)" symbol="α" unit="°" value={yaw} min={0} max={180} step={1} onChange={setYaw} />
            <SliderInput label="y軸まわり回転 (Pitch)" symbol="β" unit="°" value={pitch} min={-90} max={90} step={1} onChange={setPitch} />
          </div>
        </aside>

        <div className="lg:col-span-7 space-y-4">
          {/* 主応力・八面体応力カード */}
          <div className="app-surface rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2">
              <h3 className="text-sm font-bold">算出された主応力 (σ₁ ≥ σ₂ ≥ σ₃) と主方向</h3>
              <span className="text-xs font-mono-num app-text-muted">
                最大せん断応力 τ_max = {round2(orig.tauMax)} kPa
              </span>
            </div>

            <div className="space-y-2.5">
              {(['σ₁ (最大)', 'σ₂ (中間)', 'σ₃ (最小)'] as const).map((label, idx) => {
                const val = orig.principalStresses[idx];
                const dir = orig.principalDirections[idx];
                const pct = Math.min(100, Math.max(4, (Math.abs(val) / maxAbsP) * 100));
                const colors = [
                  'bg-[var(--diagram-blue)]',
                  'bg-[var(--diagram-indigo)]',
                  'bg-[var(--diagram-teal)]',
                ];
                return (
                  <div key={label} className="space-y-1 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold">{label} = <span className="font-mono-num">{round2(val)} kPa</span></span>
                      <span className="font-mono-num app-text-muted">
                        主方向 v_{idx + 1} = ({round4(dir[0])}, {round4(dir[1])}, {round4(dir[2])})
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] overflow-hidden">
                      <div className={`h-full rounded-full ${colors[idx]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
              <div className="app-surface-subtle rounded-lg p-2.5">
                <div className="app-text-muted">平均応力 p = σ_oct</div>
                <div className="font-bold font-mono-num text-sm">{round2(orig.meanStressP)} kPa</div>
              </div>
              <div className="app-surface-subtle rounded-lg p-2.5">
                <div className="app-text-muted">偏差応力 q = √(3J₂)</div>
                <div className="font-bold font-mono-num text-sm">{round2(orig.vonMisesQ)} kPa</div>
              </div>
              <div className="app-surface-subtle rounded-lg p-2.5">
                <div className="app-text-muted">八面体せん断 τ_oct</div>
                <div className="font-bold font-mono-num text-sm">{round2(orig.tauOct)} kPa</div>
              </div>
              <div className="app-surface-subtle rounded-lg p-2.5">
                <div className="app-text-muted">第2偏差不変量 J₂</div>
                <div className="font-bold font-mono-num text-sm">{round2(orig.j2)} kPa²</div>
              </div>
            </div>
          </div>

          {/* 回転前後での行列変化 vs 不変量の一致比較 */}
          <div className="app-surface rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold">
                回転座標変換（α={yaw}°, β={pitch}°）前後での比較
              </h3>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                全成分が変化しても I₁, I₂, I₃, J₂ は不変！
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="app-surface-subtle rounded-lg p-3 overflow-x-auto">
                <div className="font-semibold mb-1">回転後の成分 σ' = QσQᵀ (kPa)</div>
                <MathFormula
                  block
                  math={`\\begin{pmatrix} ${round2(rotatedTensor.sxx)} & ${round2(rotatedTensor.txy)} & ${round2(rotatedTensor.tzx)} \\\\ ${round2(rotatedTensor.txy)} & ${round2(rotatedTensor.syy)} & ${round2(rotatedTensor.tyz)} \\\\ ${round2(rotatedTensor.tzx)} & ${round2(rotatedTensor.tyz)} & ${round2(rotatedTensor.szz)} \\end{pmatrix}`}
                />
              </div>

              <div className="app-surface-subtle rounded-lg p-3 space-y-1.5 font-mono-num">
                <div className="font-semibold font-sans mb-1">不変量の照合（回転前 vs 回転後）</div>
                <div className="flex justify-between">
                  <span>I₁:</span>
                  <span>{round2(orig.i1)} ＝ {round2(rotatedRes.i1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>I₂:</span>
                  <span>{round2(orig.i2)} ＝ {round2(rotatedRes.i2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>I₃:</span>
                  <span>{round2(orig.i3)} ＝ {round2(rotatedRes.i3)}</span>
                </div>
                <div className="flex justify-between text-indigo-700 dark:text-indigo-300 font-bold">
                  <span>J₂:</span>
                  <span>{round2(orig.j2)} ＝ {round2(rotatedRes.j2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 演習 */}
      <ChapterExercisePanel
        chapterTitle="第3章：主応力と応力の不変量"
        exercises={exercises}
        completedIds={completedIds}
        onToggleDone={onToggleDone}
        onMarkDone={onMarkDone}
      />
    </div>
  );
};
