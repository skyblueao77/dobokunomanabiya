import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Circle,
  Printer,
  RotateCcw,
} from 'lucide-react';
import {
  calculateSpecificEnergyAndJump,
  type SpecificEnergyInputs,
} from '../../utils/civilPhysics';
import { SliderInput } from '../SliderInput';
import { MathFormula } from '../MathFormula';
import { CopyShareButton } from '../CopyShareButton';
import { ChapterExercisePanel, type ContinuumExercise } from '../continuum/ChapterExercisePanel';
import { getSearchParamFromLocation } from '../../utils/router';

interface SpecificEnergyModuleProps {
  isCompleted: boolean;
  onToggleUnitComplete: () => void;
  completedExerciseIds: string[];
  onToggleExerciseDone: (exerciseId: string) => void;
  onMarkExerciseDone: (exerciseId: string) => void;
  onBackToPortal: () => void;
}

const DEFAULT_ENERGY: SpecificEnergyInputs = {
  discharge: 6,
  width: 3,
  depth1: 0.4,
};

interface EnergyPreset {
  label: string;
  description: string;
  values: SpecificEnergyInputs;
}

const ENERGY_PRESETS: EnergyPreset[] = [
  {
    label: '振動跳水（標準）',
    description: 'Q=6 m³/s, B=3 m (q=2), h1=0.4 m → Fr1=2.52',
    values: { discharge: 6, width: 3, depth1: 0.4 },
  },
  {
    label: '定常跳水（ダム減勢工）',
    description: 'Q=12 m³/s, B=3 m (q=4), h1=0.35 m → 高フルード数',
    values: { discharge: 12, width: 3, depth1: 0.35 },
  },
  {
    label: '常流状態（交代水深確認）',
    description: 'Q=4 m³/s, B=2 m (q=2), h1=1.5 m → 跳水なし',
    values: { discharge: 4, width: 2, depth1: 1.5 },
  },
];

function buildEnergyExercises(applyPreset: (next: SpecificEnergyInputs) => void): ContinuumExercise[] {
  return [
    {
      id: 'energy-q1',
      title: '問1：長方形水路の限界水深 h_c と最小比エネルギー E_min',
      category: '限界水深',
      statement:
        '幅 B = 3 m の長方形水路に流量 Q = 6 m³/s（単位幅流量 q = 2 m²/s）が流れている。限界水深 h_c (m) を求めよ（g = 9.81 m/s²）。',
      mathContext: 'h_c = \\left(\\frac{q^2}{g}\\right)^{1/3}',
      kind: 'numeric',
      unit: 'm',
      inputHint: '例: 0.74',
      expectedValue: 0.74,
      tolerance: 0.02,
      answerSummary: 'h_c = (2² / 9.807)^(1/3) ≈ 0.74 m（E_min = 1.5 h_c ≈ 1.11 m）',
      hint: 'q = Q/B = 6/3 = 2 m²/s を求め、q²/g の立方根を取ります。',
      steps: [
        {
          label: '1. 単位幅流量 q',
          math: 'q = \\frac{Q}{B} = \\frac{6}{3} = 2.0\\text{ m}^2/\\text{s}',
        },
        {
          label: '2. 限界水深 h_c と最小比エネルギー',
          math: 'h_c = \\left(\\frac{2^2}{9.807}\\right)^{1/3} \\approx 0.74\\text{ m},\\quad E_{\\min} = \\frac{3}{2}h_c \\approx 1.11\\text{ m}',
        },
      ],
      onApplyPreset: () => applyPreset(ENERGY_PRESETS[0].values),
    },
    {
      id: 'energy-q2',
      title: '問2：ベランジェの跳水方程式による共役水深 h_2',
      category: '跳水方程式',
      statement:
        'Q = 6 m³/s, B = 3 m の長方形水路において、上流の射流水深が h_1 = 0.40 m（v_1 = 5.0 m/s, Fr_1 ≈ 2.52）である。跳水後の共役水深 h_2 (m) を求めよ。',
      mathContext: 'h_2 = \\frac{h_1}{2}\\left(\\sqrt{1 + 8 Fr_1^2} - 1\\right)',
      kind: 'numeric',
      unit: 'm',
      inputHint: '例: 1.24',
      expectedValue: 1.24,
      tolerance: 0.03,
      answerSummary: 'h_2 = 0.20 × (√(1 + 8 × 2.52²) − 1) ≈ 1.24 m',
      hint: 'Fr_1 = v_1 / √(g h_1) ≈ 2.52 をベランジェの式に代入します。',
      steps: [
        {
          label: '1. 上流フルード数 Fr_1',
          math: 'v_1 = \\frac{2}{0.4} = 5.0\\text{ m/s},\\quad Fr_1 = \\frac{5.0}{\\sqrt{9.807 \\times 0.4}} \\approx 2.52',
        },
        {
          label: '2. 跳水後の共役水深 h_2',
          math: 'h_2 = \\frac{0.40}{2}\\left(\\sqrt{1 + 8(2.52)^2} - 1\\right) \\approx 1.24\\text{ m}',
        },
      ],
      onApplyPreset: () => applyPreset(ENERGY_PRESETS[0].values),
    },
    {
      id: 'energy-q3',
      title: '問3：跳水に伴うエネルギー損失 ΔE',
      category: '減勢損失',
      statement:
        '問2の跳水（h_1 = 0.40 m → h_2 = 1.24 m）において失われる比エネルギー損失 ΔE = (h_2 − h_1)³ / (4 h_1 h_2) (m) を求めよ。',
      mathContext: '\\Delta E = E_1 - E_2 = \\frac{(h_2 - h_1)^3}{4 h_1 h_2}',
      kind: 'numeric',
      unit: 'm',
      inputHint: '例: 0.30',
      expectedValue: 0.3,
      tolerance: 0.03,
      answerSummary: 'ΔE ≈ (1.24 − 0.40)³ / (4 × 0.40 × 1.24) ≈ 0.30 m（約 18% 減勢）',
      hint: '分子 (h2 − h1)³ と分母 4 h1 h2 を計算するか、E1 − E2 から求めます。',
      steps: [
        {
          label: '1. 跳水前後の比エネルギー差',
          math: '\\Delta E = \\frac{(1.24 - 0.40)^3}{4 \\times 0.40 \\times 1.24} = \\frac{0.593}{1.984} \\approx 0.30\\text{ m}',
        },
      ],
      onApplyPreset: () => applyPreset(ENERGY_PRESETS[0].values),
    },
  ];
}

function clampNum(raw: string | null, fallback: number, min: number, max: number): number {
  if (raw === null) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function parseInitialEnergy(): SpecificEnergyInputs {
  if (typeof window === 'undefined') return DEFAULT_ENERGY;
  return {
    discharge: clampNum(getSearchParamFromLocation('Q'), DEFAULT_ENERGY.discharge, 1, 30),
    width: clampNum(getSearchParamFromLocation('B'), DEFAULT_ENERGY.width, 0.5, 10),
    depth1: clampNum(getSearchParamFromLocation('h1'), DEFAULT_ENERGY.depth1, 0.15, 2.5),
  };
}

export const SpecificEnergyModule: React.FC<SpecificEnergyModuleProps> = ({
  isCompleted,
  onToggleUnitComplete,
  completedExerciseIds,
  onToggleExerciseDone,
  onMarkExerciseDone,
  onBackToPortal,
}) => {
  const [inputs, setInputs] = useState<SpecificEnergyInputs>(() => parseInitialEnergy());

  useEffect(() => {
    try {
      const params = new URLSearchParams();
      params.set('Q', String(inputs.discharge));
      params.set('B', String(inputs.width));
      params.set('h1', String(inputs.depth1));
      const nextUrl = `${window.location.pathname}?${params.toString()}`;
      if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
        window.history.replaceState(null, '', nextUrl);
      }
    } catch {
      // ignore history errors
    }
  }, [inputs]);

  const res = useMemo(() => calculateSpecificEnergyAndJump(inputs), [inputs]);
  const exercises = useMemo(
    () =>
      buildEnergyExercises((next) => {
        setInputs(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }),
    []
  );
  const solvedCount = exercises.filter((ex) => completedExerciseIds.includes(ex.id)).length;

  // SVG 1: 比エネルギー曲線 (E-h 図)
  const ehW = 420;
  const ehH = 330;
  const padL = 54;
  const padR = 24;
  const padT = 26;
  const padB = 44;
  const plotW = ehW - padL - padR;
  const plotH = ehH - padT - padB;

  const maxAxisE = Math.max(
    res.specificEnergy1 * 1.25,
    res.minSpecificEnergy * 2.6,
    (res.specificEnergy2 ?? 0) * 1.3,
    3.0
  );
  const maxAxisH = Math.max(
    res.criticalDepth * 3.0,
    inputs.depth1 * 1.35,
    (res.sequentDepth ?? 0) * 1.3,
    res.alternateDepth * 1.2,
    2.2
  );
  const toEhX = (e: number) => padL + (Math.min(e, maxAxisE) / maxAxisE) * plotW;
  const toEhY = (h: number) => ehH - padB - (Math.min(h, maxAxisH) / maxAxisH) * plotH;

  const visibleCurve = res.curvePoints.filter((p) => p.e <= maxAxisE * 1.02 && p.h <= maxAxisH);
  const curvePolyline = visibleCurve
    .map((p) => `${toEhX(p.e).toFixed(1)},${toEhY(p.h).toFixed(1)}`)
    .join(' ');
  const diagMax = Math.min(maxAxisE, maxAxisH);

  // SVG 2: 跳水縦断図
  const jpW = 420;
  const jpH = 250;
  const bedY = 205;
  const topPad = 36;
  const maxProfileY = Math.max(
    res.specificEnergy1 * 1.15,
    (res.sequentDepth ?? inputs.depth1) * 1.4,
    1.5
  );
  const toProfY = (val: number) => bedY - (val / maxProfileY) * (bedY - topPad);

  const regimeBadgeClass =
    res.regime1 === '射流 (Supercritical)'
      ? 'bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/35'
      : res.regime1 === '限界流 (Critical)'
        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40'
        : 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30';

  return (
    <div className="space-y-6">
      <div className="app-surface rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs app-text-muted mb-1">
            <span>水理学</span>
            <span aria-hidden="true">/</span>
            <span>開水路急変流・エネルギー原理</span>
            <span className="rounded-full bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30 px-2 py-0.5 text-[11px] font-semibold">
              単体テスト検証済み・学習補助用
            </span>
          </div>
          <h1 id="main-content" tabIndex={-1} className="text-xl sm:text-2xl font-bold outline-none">
            比エネルギー曲線・限界水深・跳水（Hydraulic Jump）
          </h1>
          <p className="text-xs sm:text-sm app-text-muted mt-1">
            比エネルギー <MathFormula math="E = h + \frac{q^2}{2gh^2}" /> の曲線上で常流・限界流・射流と交代水深を視覚化し、射流からの跳水（ベランジェ式）による共役水深 <MathFormula math="h_2" /> と減勢損失 <MathFormula math="\Delta E" /> を確認できます。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
          <CopyShareButton getTextToCopy={() => window.location.href} label="条件リンクをコピー" />
          <button
            type="button"
            onClick={() => window.print()}
            className="interactive-btn app-surface inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            印刷 / PDF
          </button>
          <button
            type="button"
            onClick={onToggleUnitComplete}
            aria-pressed={isCompleted}
            className={`interactive-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border cursor-pointer ${
              isCompleted
                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/35'
                : 'app-surface'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Circle className="h-4 w-4" aria-hidden="true" />
            )}
            {isCompleted ? '学習済み' : '学習済みにする'}
          </button>
          <button
            type="button"
            onClick={onBackToPortal}
            className="interactive-btn app-surface inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            ポータルへ戻る
          </button>
        </div>
      </div>

      {/* プリセット */}
      <div className="app-surface rounded-xl p-3.5 shadow-sm flex flex-wrap items-center gap-2 no-print">
        <span className="text-xs font-semibold app-text-muted mr-1">典型プリセット:</span>
        {ENERGY_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => setInputs(preset.values)}
            title={preset.description}
            className="interactive-btn app-surface-subtle rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer"
          >
            {preset.label}
          </button>
        ))}
        <span className="ml-auto text-xs font-mono-num app-text-muted">
          演習達成: {solvedCount} / {exercises.length}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 左：入力＆サマリー */}
        <section
          aria-label="比エネルギー・跳水パラメータ設定"
          className="lg:col-span-4 app-surface rounded-xl p-4 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
            <h2 className="text-sm font-bold">長方形水路の流況条件</h2>
            <button
              type="button"
              onClick={() => setInputs(DEFAULT_ENERGY)}
              className="interactive-btn app-surface-subtle inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium cursor-pointer no-print"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              リセット
            </button>
          </div>

          <SliderInput
            label="流量"
            symbol="Q"
            value={inputs.discharge}
            min={1}
            max={30}
            step={0.5}
            unit="m³/s"
            onChange={(v) => setInputs((p) => ({ ...p, discharge: v }))}
          />
          <SliderInput
            label="水路幅"
            symbol="B"
            value={inputs.width}
            min={0.5}
            max={10}
            step={0.5}
            unit="m"
            onChange={(v) => setInputs((p) => ({ ...p, width: v }))}
          />
          <SliderInput
            label="上流（対象）水深"
            symbol="h₁"
            value={inputs.depth1}
            min={0.15}
            max={2.5}
            step={0.05}
            unit="m"
            onChange={(v) => setInputs((p) => ({ ...p, depth1: v }))}
          />

          <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs app-text-muted">上流の流況</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${regimeBadgeClass}`}>
              {res.regime1} (Fr₁ = {res.froude1})
            </span>
          </div>

          <div className="app-surface-subtle rounded-lg p-3 text-xs space-y-1.5 font-mono-num">
            <div className="flex justify-between">
              <span className="app-text-muted">単位幅流量 q = Q/B:</span>
              <span className="font-bold">{res.unitDischarge} m²/s</span>
            </div>
            <div className="flex justify-between">
              <span className="app-text-muted">限界水深 h_c / E_min:</span>
              <span className="font-bold text-amber-800 dark:text-amber-300">
                {res.criticalDepth} m / {res.minSpecificEnergy} m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="app-text-muted">上流流速 v₁ / 比エネルギー E₁:</span>
              <span className="font-bold">
                {res.velocity1} m/s / {res.specificEnergy1} m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="app-text-muted">交代水深 h_alt（同E₁）:</span>
              <span className="font-bold text-sky-700 dark:text-sky-300">
                {res.alternateDepth} m
              </span>
            </div>
            <div className="border-t border-[var(--border-subtle)] pt-1.5 space-y-1">
              <div className="flex justify-between">
                <span className="app-text-muted">跳水分類:</span>
                <span className="font-bold text-right">{res.jumpType}</span>
              </div>
              {res.canJump && res.sequentDepth !== null && (
                <>
                  <div className="flex justify-between">
                    <span className="app-text-muted">共役水深 h₂ (Fr₂):</span>
                    <span className="font-bold text-teal-800 dark:text-teal-300">
                      {res.sequentDepth} m ({res.froude2})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="app-text-muted">エネルギー損失 ΔE:</span>
                    <span className="font-bold text-red-800 dark:text-red-300">
                      {res.energyLoss} m ({res.energyLossRatioPercent}%)
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* 右：2枚の同期 SVG 図解 */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SVG 1: 比エネルギー曲線 */}
          <section className="app-surface rounded-xl shadow-sm overflow-hidden">
            <div className="app-surface-subtle border-x-0 border-t-0 px-3.5 py-2 flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-semibold">比エネルギー曲線 (E–h 図)</h2>
              <span className="text-xs app-text-muted font-mono-num">q = {res.unitDischarge} m²/s</span>
            </div>
            <div className="p-2.5">
              <svg
                viewBox={`0 0 ${ehW} ${ehH}`}
                className="w-full h-auto block select-none"
                role="img"
                aria-label={`単位幅流量${res.unitDischarge}m²/sの比エネルギー曲線。限界水深hc=${res.criticalDepth}m、E_min=${res.minSpecificEnergy}m、上流状態(E1=${res.specificEnergy1}m, h1=${inputs.depth1}m)`}
              >
                {/* 軸 */}
                <line
                  x1={padL}
                  y1={padT}
                  x2={padL}
                  y2={ehH - padB}
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <line
                  x1={padL}
                  y1={ehH - padB}
                  x2={ehW - padR}
                  y2={ehH - padB}
                  stroke="currentColor"
                  strokeWidth="1.5"
                />

                {/* 45度漸近線 E = h */}
                <line
                  x1={toEhX(0)}
                  y1={toEhY(0)}
                  x2={toEhX(diagMax)}
                  y2={toEhY(diagMax)}
                  stroke="currentColor"
                  strokeOpacity="0.35"
                  strokeDasharray="4 4"
                />
                <text
                  x={toEhX(diagMax) - 6}
                  y={toEhY(diagMax) + 14}
                  textAnchor="end"
                  className="text-[11px] fill-[var(--text-muted)]"
                >
                  E = h
                </text>

                {/* 限界水深水平線 h = hc */}
                <line
                  x1={padL}
                  y1={toEhY(res.criticalDepth)}
                  x2={ehW - padR}
                  y2={toEhY(res.criticalDepth)}
                  stroke="var(--diagram-amber)"
                  strokeWidth="1.3"
                  strokeDasharray="5 3"
                />
                <text
                  x={ehW - padR - 4}
                  y={toEhY(res.criticalDepth) - 5}
                  textAnchor="end"
                  className="text-[11px] font-semibold fill-[var(--diagram-amber)] font-mono-num"
                >
                  常流 (Fr&lt;1) ↑ / h_c={res.criticalDepth}m / 射流 ↓
                </text>

                {/* E(h) 曲線 */}
                <polyline
                  points={curvePolyline}
                  fill="none"
                  stroke="var(--diagram-blue)"
                  strokeWidth="2.8"
                />

                {/* 限界点 (E_min, h_c) */}
                <circle
                  cx={toEhX(res.minSpecificEnergy)}
                  cy={toEhY(res.criticalDepth)}
                  r="4.5"
                  fill="var(--diagram-amber)"
                />

                {/* 同一比エネルギーの交代水深縦線 */}
                <line
                  x1={toEhX(res.specificEnergy1)}
                  y1={toEhY(inputs.depth1)}
                  x2={toEhX(res.specificEnergy1)}
                  y2={toEhY(res.alternateDepth)}
                  stroke="var(--diagram-sky)"
                  strokeWidth="1.3"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={toEhX(res.specificEnergy1)}
                  cy={toEhY(res.alternateDepth)}
                  r="4"
                  fill="var(--diagram-sky)"
                />

                {/* 跳水遷移 (E1, h1) -> (E2, h2) */}
                {res.canJump && res.sequentDepth !== null && res.specificEnergy2 !== null && (
                  <g>
                    <line
                      x1={toEhX(res.specificEnergy1)}
                      y1={toEhY(inputs.depth1)}
                      x2={toEhX(res.specificEnergy2)}
                      y2={toEhY(res.sequentDepth)}
                      stroke="var(--diagram-teal)"
                      strokeWidth="2.2"
                      strokeDasharray="4 2"
                    />
                    <circle
                      cx={toEhX(res.specificEnergy2)}
                      cy={toEhY(res.sequentDepth)}
                      r="5"
                      fill="var(--diagram-teal)"
                    />
                    <text
                      x={toEhX(res.specificEnergy2) + 6}
                      y={toEhY(res.sequentDepth) - 6}
                      className="text-[11px] font-bold fill-[var(--diagram-teal)] font-mono-num"
                    >
                      跳水後 (h₂={res.sequentDepth})
                    </text>
                  </g>
                )}

                {/* 現在点 (E1, h1) */}
                <circle
                  cx={toEhX(res.specificEnergy1)}
                  cy={toEhY(inputs.depth1)}
                  r="5.5"
                  fill="var(--diagram-red)"
                  stroke="var(--diagram-halo)"
                  strokeWidth="1.5"
                />
                <text
                  x={Math.min(ehW - padR - 4, toEhX(res.specificEnergy1) + 7)}
                  y={Math.min(ehH - padB - 6, toEhY(inputs.depth1) + 4)}
                  textAnchor={toEhX(res.specificEnergy1) > ehW - 120 ? 'end' : 'start'}
                  className="text-[11px] font-bold fill-[var(--diagram-red)] font-mono-num"
                >
                  状態1 (h₁={inputs.depth1})
                </text>

                {/* 軸タイトル */}
                <text
                  x={padL + plotW / 2}
                  y={ehH - 10}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-current"
                >
                  比エネルギー E (m)
                </text>
                <text
                  x={16}
                  y={padT + plotH / 2}
                  textAnchor="middle"
                  transform={`rotate(-90 16 ${padT + plotH / 2})`}
                  className="text-xs font-semibold fill-current"
                >
                  水深 h (m)
                </text>
              </svg>
            </div>
          </section>

          {/* SVG 2: 跳水縦断プロファイル */}
          <section className="app-surface rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="app-surface-subtle border-x-0 border-t-0 px-3.5 py-2 flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-semibold">縦断プロファイル・エネルギー線 (EGL)</h2>
              <span className="text-xs app-text-muted font-mono-num">
                {res.canJump ? `ΔE = ${res.energyLoss} m` : '跳水なし'}
              </span>
            </div>
            <div className="p-2.5 flex-1 flex flex-col justify-between">
              <svg
                viewBox={`0 0 ${jpW} ${jpH}`}
                className="w-full h-auto block select-none"
                role="img"
                aria-label={
                  res.canJump && res.sequentDepth !== null
                    ? `上流射流水深${inputs.depth1}mから共役水深${res.sequentDepth}mへ跳水し、比エネルギー損失${res.energyLoss}mが発生する縦断図`
                    : `水深${inputs.depth1}mの常流・限界流の縦断図（跳水は発生しない）`
                }
              >
                {/* 水路底面 */}
                <rect x="20" y={bedY} width={jpW - 40} height="16" fill="currentColor" fillOpacity="0.12" />
                <line x1="20" y1={bedY} x2={jpW - 20} y2={bedY} stroke="currentColor" strokeWidth="2.5" />

                {res.canJump && res.sequentDepth !== null && res.specificEnergy2 !== null ? (
                  <>
                    {/* 水塊ポリゴン（上流 h1 → 跳水ローラー → 下流 h2） */}
                    <path
                      d={`M 24 ${bedY} L 24 ${toProfY(inputs.depth1)} L 155 ${toProfY(inputs.depth1)} C 185 ${toProfY(inputs.depth1)}, 205 ${toProfY(res.sequentDepth) - 6}, 235 ${toProfY(res.sequentDepth)} L ${jpW - 24} ${toProfY(res.sequentDepth)} L ${jpW - 24} ${bedY} Z`}
                      fill="var(--diagram-blue-fill)"
                      stroke="var(--diagram-blue)"
                      strokeWidth="2.2"
                    />
                    {/* 跳水渦ロールの表現 */}
                    <path
                      d={`M 168 ${toProfY((inputs.depth1 + res.sequentDepth) * 0.48)} Q 192 ${toProfY(res.sequentDepth) - 10} 218 ${toProfY(res.sequentDepth) + 4}`}
                      fill="none"
                      stroke="var(--diagram-teal)"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />

                    {/* EGL (エネルギー線 E1 -> E2) */}
                    <polyline
                      points={`24,${toProfY(res.specificEnergy1)} 165,${toProfY(res.specificEnergy1)} 230,${toProfY(res.specificEnergy2)} ${jpW - 24},${toProfY(res.specificEnergy2)}`}
                      fill="none"
                      stroke="var(--diagram-red)"
                      strokeWidth="2"
                      strokeDasharray="6 3"
                    />
                    <text
                      x="30"
                      y={toProfY(res.specificEnergy1) - 6}
                      className="text-[11px] font-bold fill-[var(--diagram-red)] font-mono-num"
                    >
                      E₁ = {res.specificEnergy1} m
                    </text>
                    <text
                      x={jpW - 28}
                      y={toProfY(res.specificEnergy2) - 6}
                      textAnchor="end"
                      className="text-[11px] font-bold fill-[var(--diagram-red)] font-mono-num"
                    >
                      E₂ = {res.specificEnergy2} m (ΔE={res.energyLoss}m)
                    </text>

                    {/* 水深ラベル */}
                    <text
                      x="88"
                      y={bedY - 8}
                      textAnchor="middle"
                      className="text-xs font-bold fill-[var(--diagram-blue)] font-mono-num"
                    >
                      h₁={inputs.depth1}m (射流)
                    </text>
                    <text
                      x="315"
                      y={bedY - 8}
                      textAnchor="middle"
                      className="text-xs font-bold fill-[var(--diagram-teal)] font-mono-num"
                    >
                      h₂={res.sequentDepth}m (常流)
                    </text>
                  </>
                ) : (
                  <>
                    <rect
                      x="24"
                      y={toProfY(inputs.depth1)}
                      width={jpW - 48}
                      height={bedY - toProfY(inputs.depth1)}
                      fill="var(--diagram-blue-fill)"
                      stroke="var(--diagram-blue)"
                      strokeWidth="2.2"
                    />
                    <line
                      x1="24"
                      y1={toProfY(res.specificEnergy1)}
                      x2={jpW - 24}
                      y2={toProfY(res.specificEnergy1)}
                      stroke="var(--diagram-red)"
                      strokeWidth="2"
                      strokeDasharray="6 3"
                    />
                    <text
                      x={jpW / 2}
                      y={toProfY(res.specificEnergy1) - 6}
                      textAnchor="middle"
                      className="text-xs font-bold fill-[var(--diagram-red)] font-mono-num"
                    >
                      EGL: E₁ = {res.specificEnergy1} m
                    </text>
                    <text
                      x={jpW / 2}
                      y={bedY - 12}
                      textAnchor="middle"
                      className="text-xs font-bold fill-[var(--diagram-blue)]"
                    >
                      h₁ = {inputs.depth1} m（{res.regime1}：跳水は射流 Fr₁ &gt; 1 のみ発生）
                    </text>
                  </>
                )}
              </svg>

              <details className="mt-2 app-surface-subtle rounded-lg px-3 py-2 text-xs">
                <summary className="diagram-summary flex items-center justify-between cursor-pointer font-semibold select-none">
                  <span>水理計算値一覧（支援技術・検算用）</span>
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </summary>
                <div className="mt-2 font-mono-num space-y-1">
                  <div>
                    q = {res.unitDischarge} m²/s, h_c = {res.criticalDepth} m, E_min = {res.minSpecificEnergy} m
                  </div>
                  <div>
                    h₁ = {inputs.depth1} m, v₁ = {res.velocity1} m/s, Fr₁ = {res.froude1}, E₁ = {res.specificEnergy1} m, h_alt = {res.alternateDepth} m
                  </div>
                  {res.canJump && res.sequentDepth !== null && (
                    <div>
                      h₂ = {res.sequentDepth} m, v₂ = {res.velocity2} m/s, Fr₂ = {res.froude2}, ΔE = {res.energyLoss} m ({res.energyLossRatioPercent}%)
                    </div>
                  )}
                </div>
              </details>
            </div>
          </section>
        </div>
      </div>

      {/* 途中式・検算パネル */}
      <section className="app-surface rounded-xl shadow-sm overflow-hidden">
        <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2.5 flex items-center justify-between">
          <h2 className="text-sm font-semibold">途中式・検算パネル（比エネルギーと運動量保存）</h2>
          <span className="text-xs app-text-muted">g = 9.80665 m/s²</span>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="app-surface-subtle rounded-lg p-3.5 min-w-0">
            <h3 className="text-xs font-semibold app-text-muted mb-1.5">
              1. 限界水深と最小比エネルギー
            </h3>
            <MathFormula
              block
              math={`q = \\frac{${inputs.discharge}}{${inputs.width}} = ${res.unitDischarge}\\text{ m}^2/\\text{s}`}
            />
            <MathFormula
              block
              math={`h_c = \\left(\\frac{q^2}{g}\\right)^{1/3} = ${res.criticalDepth}\\text{ m},\\quad E_{\\min} = \\frac{3}{2}h_c = ${res.minSpecificEnergy}\\text{ m}`}
            />
          </div>
          <div className="app-surface-subtle rounded-lg p-3.5 min-w-0">
            <h3 className="text-xs font-semibold app-text-muted mb-1.5">
              2. 上流比エネルギーと交代水深
            </h3>
            <MathFormula
              block
              math={`E_1 = h_1 + \\frac{v_1^2}{2g} = ${inputs.depth1} + \\frac{${res.velocity1}^2}{2g} = ${res.specificEnergy1}\\text{ m}`}
            />
            <MathFormula
              block
              math={`Fr_1 = \\frac{v_1}{\\sqrt{g h_1}} = ${res.froude1},\\quad h_{\\text{alt}} = ${res.alternateDepth}\\text{ m}`}
            />
          </div>
          <div className="app-surface-subtle rounded-lg p-3.5 min-w-0">
            <h3 className="text-xs font-semibold app-text-muted mb-1.5">
              3. ベランジェの跳水方程式と減勢損失
            </h3>
            {res.canJump && res.sequentDepth !== null ? (
              <>
                <MathFormula
                  block
                  math={`h_2 = \\frac{h_1}{2}\\left(\\sqrt{1 + 8 Fr_1^2} - 1\\right) = ${res.sequentDepth}\\text{ m}`}
                />
                <MathFormula
                  block
                  math={`\\Delta E = \\frac{(h_2 - h_1)^3}{4 h_1 h_2} = ${res.energyLoss}\\text{ m}\\ (${res.energyLossRatioPercent}\\%)`}
                />
              </>
            ) : (
              <p className="text-xs app-text-muted leading-relaxed">
                現在は <MathFormula math={`Fr_1 = ${res.froude1} \\le 1`} />（常流または限界流）のため跳水は発生しません。水深 <MathFormula math="h_1" /> を限界水深 <MathFormula math={`h_c = ${res.criticalDepth}\\text{ m}`} /> 未満へ下げると射流から常流への跳水が現れます。
              </p>
            )}
          </div>
        </div>
      </section>

      <ChapterExercisePanel
        chapterTitle="比エネルギー曲線・限界水深・跳水"
        heading="比エネルギー・跳水のオリジナル演習（自動採点・シミュレーター検算対応）"
        progressLabel="この単元の演習達成"
        exercises={exercises}
        completedIds={completedExerciseIds}
        onToggleDone={onToggleExerciseDone}
        onMarkDone={onMarkExerciseDone}
      />
    </div>
  );
};

export default SpecificEnergyModule;
