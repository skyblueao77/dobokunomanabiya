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
  calculateCantileverBeam,
  type CantileverInputs,
} from '../../utils/civilPhysics';
import { SliderInput } from '../SliderInput';
import { MathFormula } from '../MathFormula';
import { CopyShareButton } from '../CopyShareButton';
import { ChapterExercisePanel, type ContinuumExercise } from '../continuum/ChapterExercisePanel';
import { getSearchParamFromLocation } from '../../utils/router';

interface CantileverBeamModuleProps {
  isCompleted: boolean;
  onToggleUnitComplete: () => void;
  completedExerciseIds: string[];
  onToggleExerciseDone: (exerciseId: string) => void;
  onMarkExerciseDone: (exerciseId: string) => void;
  onBackToPortal: () => void;
}

const DEFAULT_CANTILEVER: CantileverInputs = {
  span: 4,
  pointLoad: 20,
  loadPos: 4,
  udl: 0,
  endMoment: 0,
  elasticModulusGPa: 25,
  sectionWidth: 0.3,
  sectionHeight: 0.5,
};

interface CantileverPreset {
  label: string;
  description: string;
  values: CantileverInputs;
}

const CANTILEVER_PRESETS: CantileverPreset[] = [
  {
    label: '自由端集中荷重（基本）',
    description: 'L=4m, P=20kN (先端), RC断面 300×500mm',
    values: {
      span: 4,
      pointLoad: 20,
      loadPos: 4,
      udl: 0,
      endMoment: 0,
      elasticModulusGPa: 25,
      sectionWidth: 0.3,
      sectionHeight: 0.5,
    },
  },
  {
    label: '全スパン等分布荷重',
    description: 'L=4m, w=10kN/m, M_A = -wL²/2, δ = wL⁴/(8EI)',
    values: {
      span: 4,
      pointLoad: 0,
      loadPos: 2,
      udl: 10,
      endMoment: 0,
      elasticModulusGPa: 25,
      sectionWidth: 0.3,
      sectionHeight: 0.5,
    },
  },
  {
    label: '複合載荷（中間P＋等分布＋M0）',
    description: 'L=5m, P=15kN (a=3m), w=6kN/m, M0=10kN·m',
    values: {
      span: 5,
      pointLoad: 15,
      loadPos: 3,
      udl: 6,
      endMoment: 10,
      elasticModulusGPa: 25,
      sectionWidth: 0.3,
      sectionHeight: 0.5,
    },
  },
];

function buildCantileverExercises(
  applyPreset: (next: CantileverInputs) => void
): ContinuumExercise[] {
  return [
    {
      id: 'cantilever-q1',
      title: '問1：自由端集中荷重による固定端曲げモーメント |M_A|',
      category: '固定端反力',
      statement:
        'スパン L = 4 m の片持ち梁の自由端（a = 4 m）に集中荷重 P = 20 kN が作用する（w = 0, M0 = 0）。固定端 A の曲げモーメントの大きさ |M_A| (kN·m) を求めよ。',
      mathContext: '|M_A| = P L',
      kind: 'numeric',
      unit: 'kN·m',
      inputHint: '例: 80',
      expectedValue: 80,
      tolerance: 0.2,
      answerSummary: '|M_A| = 20 × 4 = 80 kN·m（下側引張正では M_A = -80 kN·m）',
      hint: '固定端回りのモーメントのつり合いより、腕の長さ a = L = 4 m を掛けます。',
      steps: [
        {
          label: '1. 固定端反力とモーメントのつり合い',
          math: 'R_A = P = 20\\text{ kN},\\quad M_A = -P\\cdot a = -20 \\times 4 = -80\\text{ kN}\\cdot\\text{m}',
        },
        {
          label: '2. 大きさの読み取り',
          math: '|M_A| = 80\\text{ kN}\\cdot\\text{m}',
        },
      ],
      onApplyPreset: () => applyPreset(CANTILEVER_PRESETS[0].values),
    },
    {
      id: 'cantilever-q2',
      title: '問2：等分布荷重を受ける片持ち梁の自由端たわみ δ_max',
      category: '弾性曲線・たわみ',
      statement:
        'スパン L = 4 m、RC矩形断面 b = 0.30 m, h = 0.50 m, E = 25 GPa（EI = 78,125 kN·m²）の片持ち梁に、等分布荷重 w = 10 kN/m のみが作用する。自由端たわみ δ_max (mm) を求めよ。',
      mathContext: '\\delta_{\\max} = \\frac{w L^4}{8 E I}',
      kind: 'numeric',
      unit: 'mm',
      inputHint: '例: 4.1',
      expectedValue: 4.1,
      tolerance: 0.1,
      answerSummary: 'δ_max = 10 × 4⁴ / (8 × 78125) = 0.004096 m ≈ 4.10 mm',
      hint: 'I = bh³/12 = 0.003125 m⁴、1 GPa = 10⁶ kN/m² より EI = 78,125 kN·m²。m を mm に換算（×1000）します。',
      steps: [
        {
          label: '1. 断面二次モーメントと曲げ剛性',
          math: 'I = \\frac{0.30 \\times 0.50^3}{12} = 0.003125\\text{ m}^4,\\quad EI = 25\\times 10^6 \\times 0.003125 = 78125\\text{ kN}\\cdot\\text{m}^2',
        },
        {
          label: '2. 自由端たわみ（wL⁴ / 8EI）',
          math: '\\delta_{\\max} = \\frac{10 \\times 4^4}{8 \\times 78125} = 0.004096\\text{ m} \\approx 4.10\\text{ mm}',
        },
      ],
      onApplyPreset: () => applyPreset(CANTILEVER_PRESETS[1].values),
    },
    {
      id: 'cantilever-q3',
      title: '問3：中間集中荷重＋先端モーメントの固定端モーメント |M_A|',
      category: '重ね合わせ',
      statement:
        'スパン L = 4 m の片持ち梁において、x = 2 m に集中荷重 P = 30 kN、自由端 x = 4 m に時計回りモーメント M0 = 15 kN·m が作用する（w = 0）。固定端曲げモーメントの大きさ |M_A| (kN·m) を求めよ。',
      mathContext: '|M_A| = P a + M_0',
      kind: 'numeric',
      unit: 'kN·m',
      inputHint: '例: 75',
      expectedValue: 75,
      tolerance: 0.2,
      answerSummary: '|M_A| = 30 × 2 + 15 = 75 kN·m',
      hint: '集中モーメント M0 は作用位置によらず梁全体（0 ≤ x ≤ L）に一定の曲げモーメント −M0 を加えます。',
      steps: [
        {
          label: '1. 集中荷重による寄与',
          math: 'M_{A,P} = -P a = -30 \\times 2 = -60\\text{ kN}\\cdot\\text{m}',
        },
        {
          label: '2. 先端モーメントとの重ね合わせ',
          math: 'M_A = -60 - 15 = -75\\text{ kN}\\cdot\\text{m} \\implies |M_A| = 75\\text{ kN}\\cdot\\text{m}',
        },
      ],
      onApplyPreset: () =>
        applyPreset({
          span: 4,
          pointLoad: 30,
          loadPos: 2,
          udl: 0,
          endMoment: 15,
          elasticModulusGPa: 25,
          sectionWidth: 0.3,
          sectionHeight: 0.5,
        }),
    },
  ];
}

function clampNum(raw: string | null, fallback: number, min: number, max: number): number {
  if (raw === null) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function parseInitialCantilever(): CantileverInputs {
  if (typeof window === 'undefined') return DEFAULT_CANTILEVER;
  const span = clampNum(getSearchParamFromLocation('L'), DEFAULT_CANTILEVER.span, 1, 8);
  const loadPos = clampNum(getSearchParamFromLocation('a'), Math.min(span, DEFAULT_CANTILEVER.loadPos), 0.5, span);
  return {
    span,
    pointLoad: clampNum(getSearchParamFromLocation('P'), DEFAULT_CANTILEVER.pointLoad, 0, 80),
    loadPos,
    udl: clampNum(getSearchParamFromLocation('w'), DEFAULT_CANTILEVER.udl, 0, 30),
    endMoment: clampNum(getSearchParamFromLocation('M0'), DEFAULT_CANTILEVER.endMoment, 0, 60),
    elasticModulusGPa: clampNum(getSearchParamFromLocation('E'), DEFAULT_CANTILEVER.elasticModulusGPa, 5, 210),
    sectionWidth: clampNum(getSearchParamFromLocation('b'), DEFAULT_CANTILEVER.sectionWidth, 0.1, 0.8),
    sectionHeight: clampNum(getSearchParamFromLocation('h'), DEFAULT_CANTILEVER.sectionHeight, 0.15, 1.0),
  };
}

export const CantileverBeamModule: React.FC<CantileverBeamModuleProps> = ({
  isCompleted,
  onToggleUnitComplete,
  completedExerciseIds,
  onToggleExerciseDone,
  onMarkExerciseDone,
  onBackToPortal,
}) => {
  const [inputs, setInputs] = useState<CantileverInputs>(() => parseInitialCantilever());

  useEffect(() => {
    try {
      const params = new URLSearchParams();
      params.set('L', String(inputs.span));
      params.set('P', String(inputs.pointLoad));
      params.set('a', String(inputs.loadPos));
      params.set('w', String(inputs.udl));
      params.set('M0', String(inputs.endMoment));
      params.set('E', String(inputs.elasticModulusGPa));
      params.set('b', String(inputs.sectionWidth));
      params.set('h', String(inputs.sectionHeight));
      const nextUrl = `${window.location.pathname}?${params.toString()}`;
      if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
        window.history.replaceState(null, '', nextUrl);
      }
    } catch {
      // ignore history errors
    }
  }, [inputs]);

  const res = useMemo(() => calculateCantileverBeam(inputs), [inputs]);
  const exercises = useMemo(
    () =>
      buildCantileverExercises((next) => {
        setInputs(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }),
    []
  );
  const solvedCount = exercises.filter((ex) => completedExerciseIds.includes(ex.id)).length;

  // SVG 座標変換
  const svgW = 640;
  const svgH = 445;
  const leftX = 78;
  const rightX = 590;
  const plotW = rightX - leftX;
  const toX = (x: number) => leftX + (x / inputs.span) * plotW;

  const modelY = 66;
  const sfdZeroY = 172;
  const sfdHalfH = 42;
  const bmdZeroY = 286;
  const bmdHalfH = 46;
  const deflZeroY = 368;
  const deflMaxH = 46;

  const vScale = sfdHalfH / Math.max(res.maxShear, 1);
  const mScale = bmdHalfH / Math.max(res.maxAbsMoment, 1);
  const dScale = deflMaxH / Math.max(res.tipDeflectionMm, 0.5);

  const sfdPoints = res.samples
    .map((s) => `${toX(s.x).toFixed(1)},${(sfdZeroY - s.v * vScale).toFixed(1)}`)
    .join(' ');
  const sfdArea = `${leftX},${sfdZeroY} ${sfdPoints} ${rightX},${sfdZeroY}`;

  // 土木構造力学の慣例：下側引張正（M>0を下、M<0の片持ち梁ホギングを上へ描画）
  const bmdPoints = res.samples
    .map((s) => `${toX(s.x).toFixed(1)},${(bmdZeroY + s.m * mScale).toFixed(1)}`)
    .join(' ');
  const bmdArea = `${leftX},${bmdZeroY} ${bmdPoints} ${rightX},${bmdZeroY}`;

  const deflPoints = res.samples
    .map((s) => `${toX(s.x).toFixed(1)},${(deflZeroY + s.deflectionMm * dScale).toFixed(1)}`)
    .join(' ');

  const udlArrowCount = Math.max(5, Math.min(11, Math.round(inputs.span * 2)));
  const udlXs = Array.from(
    { length: udlArrowCount },
    (_, i) => leftX + (plotW * i) / (udlArrowCount - 1)
  );

  return (
    <div className="space-y-6">
      <div className="app-surface rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs app-text-muted mb-1">
            <span>構造力学</span>
            <span aria-hidden="true">/</span>
            <span>静定ばり・弾性曲線</span>
            <span className="rounded-full bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30 px-2 py-0.5 text-[11px] font-semibold">
              単体テスト検証済み・学習補助用
            </span>
          </div>
          <h1 id="main-content" tabIndex={-1} className="text-xl sm:text-2xl font-bold outline-none">
            片持ち梁の SFD・BMD とたわみ解析
          </h1>
          <p className="text-xs sm:text-sm app-text-muted mt-1">
            固定端反力 <MathFormula math="R_A, M_A" />、せん断力図 (SFD)・曲げモーメント図 (BMD) に加え、弾性曲線方程式 <MathFormula math="EI\,y'' = -M(x)" /> によるたわみ曲線と断面二次モーメント <MathFormula math="I = bh^3/12" /> の影響をリアルタイムに確認できます。
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
        {CANTILEVER_PRESETS.map((preset) => (
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
        {/* 左：荷重＆断面入力 */}
        <section
          aria-label="片持ち梁の荷重・断面条件設定"
          className="lg:col-span-4 app-surface rounded-xl p-4 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
            <h2 className="text-sm font-bold">荷重・断面・材料条件</h2>
            <button
              type="button"
              onClick={() => setInputs(DEFAULT_CANTILEVER)}
              className="interactive-btn app-surface-subtle inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium cursor-pointer no-print"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              リセット
            </button>
          </div>

          <SliderInput
            label="スパン長"
            symbol="L"
            value={inputs.span}
            min={1}
            max={8}
            step={0.5}
            unit="m"
            onChange={(v) =>
              setInputs((p) => ({ ...p, span: v, loadPos: Math.min(p.loadPos, v) }))
            }
          />
          <SliderInput
            label="集中荷重"
            symbol="P"
            value={inputs.pointLoad}
            min={0}
            max={80}
            step={5}
            unit="kN"
            onChange={(v) => setInputs((p) => ({ ...p, pointLoad: v }))}
          />
          <SliderInput
            label="集中荷重の作用位置"
            symbol="a"
            value={inputs.loadPos}
            min={0.5}
            max={inputs.span}
            step={0.5}
            unit="m"
            onChange={(v) => setInputs((p) => ({ ...p, loadPos: v }))}
          />
          <SliderInput
            label="等分布荷重"
            symbol="w"
            value={inputs.udl}
            min={0}
            max={30}
            step={1}
            unit="kN/m"
            onChange={(v) => setInputs((p) => ({ ...p, udl: v }))}
          />
          <SliderInput
            label="自由端モーメント（時計回り）"
            symbol="M₀"
            value={inputs.endMoment}
            min={0}
            max={60}
            step={5}
            unit="kN·m"
            onChange={(v) => setInputs((p) => ({ ...p, endMoment: v }))}
          />

          <div className="border-t border-[var(--border-subtle)] pt-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold">曲げ剛性 EI（矩形断面）</span>
              <div className="flex gap-1 no-print">
                {[
                  { label: 'RC 25GPa', e: 25 },
                  { label: '鋼 200GPa', e: 200 },
                  { label: '木 10GPa', e: 10 },
                ].map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setInputs((p) => ({ ...p, elasticModulusGPa: m.e }))}
                    className={`rounded px-2 py-0.5 text-[11px] font-medium border cursor-pointer ${
                      inputs.elasticModulusGPa === m.e
                        ? 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/35'
                        : 'app-surface-subtle'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <SliderInput
              label="ヤング率"
              symbol="E"
              value={inputs.elasticModulusGPa}
              min={5}
              max={210}
              step={5}
              unit="GPa"
              onChange={(v) => setInputs((p) => ({ ...p, elasticModulusGPa: v }))}
            />
            <SliderInput
              label="断面幅"
              symbol="b"
              value={inputs.sectionWidth}
              min={0.1}
              max={0.8}
              step={0.05}
              unit="m"
              onChange={(v) => setInputs((p) => ({ ...p, sectionWidth: v }))}
            />
            <SliderInput
              label="断面高さ"
              symbol="h"
              value={inputs.sectionHeight}
              min={0.15}
              max={1.0}
              step={0.05}
              unit="m"
              onChange={(v) => setInputs((p) => ({ ...p, sectionHeight: v }))}
            />
          </div>

          <div className="app-surface-subtle rounded-lg p-3 text-xs space-y-1.5 font-mono-num">
            <div className="flex justify-between">
              <span className="app-text-muted">固定端反力 R_A:</span>
              <span className="font-bold text-blue-700 dark:text-blue-300">
                {res.reactionForce} kN
              </span>
            </div>
            <div className="flex justify-between">
              <span className="app-text-muted">固定端モーメント M_A:</span>
              <span className="font-bold text-teal-800 dark:text-teal-300">
                {res.reactionMoment} kN·m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="app-text-muted">断面二次モーメント I:</span>
              <span className="font-bold">{res.momentOfInertia.toFixed(6)} m⁴</span>
            </div>
            <div className="flex justify-between">
              <span className="app-text-muted">曲げ剛性 EI:</span>
              <span className="font-bold">{res.flexuralRigidity.toLocaleString()} kN·m²</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border-subtle)] pt-1.5">
              <span className="app-text-muted">自由端たわみ δ_max:</span>
              <span className="font-bold text-violet-700 dark:text-violet-300">
                {res.tipDeflectionMm} mm
                {res.deflectionRatio ? ` (L/${res.deflectionRatio})` : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="app-text-muted">自由端たわみ角 θ_max:</span>
              <span className="font-bold">{res.tipSlopeMrad} mrad</span>
            </div>
          </div>
        </section>

        {/* 右：構造図・SFD・BMD・たわみ曲線 SVG */}
        <section
          aria-label="片持ち梁 SFD・BMD・たわみ曲線図"
          className="lg:col-span-8 app-surface rounded-xl shadow-sm overflow-hidden"
        >
          <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">
              構造モデル・SFD・BMD（下側引張正）・弾性たわみ曲線
            </h2>
            <span className="text-xs app-text-muted font-mono-num">
              M_A = {res.reactionMoment} kN·m / δ_max = {res.tipDeflectionMm} mm
            </span>
          </div>
          <div className="p-3">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-auto block select-none"
              role="img"
              aria-label={`スパン${inputs.span}mの片持ち梁の構造モデル、SFD（最大${res.maxShear}kN）、BMD（固定端${res.reactionMoment}kN·m）、および自由端たわみ${res.tipDeflectionMm}mmの弾性曲線`}
            >
              <defs>
                <marker
                  id="canti-arrow-red"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--diagram-red)" />
                </marker>
                <marker
                  id="canti-arrow-amber"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="5.5"
                  markerHeight="5.5"
                  orient="auto"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--diagram-amber)" />
                </marker>
                <marker
                  id="canti-arrow-blue"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--diagram-blue)" />
                </marker>
                <marker
                  id="canti-arrow-violet"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--diagram-violet)" />
                </marker>
              </defs>

              {/* 固定壁ハッチング */}
              <rect
                x={leftX - 18}
                y={modelY - 26}
                width="18"
                height="52"
                fill="currentColor"
                fillOpacity="0.1"
              />
              <line
                x1={leftX}
                y1={modelY - 28}
                x2={leftX}
                y2={modelY + 28}
                stroke="currentColor"
                strokeWidth="3"
              />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <line
                  key={`hatch-${i}`}
                  x1={leftX - 16}
                  y1={modelY - 20 + i * 9}
                  x2={leftX - 2}
                  y2={modelY - 28 + i * 9}
                  stroke="currentColor"
                  strokeOpacity="0.6"
                  strokeWidth="1.2"
                />
              ))}

              {/* 梁本体 */}
              <line
                x1={leftX}
                y1={modelY}
                x2={rightX}
                y2={modelY}
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
              />

              {/* 等分布荷重 w */}
              {inputs.udl > 0 && (
                <g>
                  <line
                    x1={leftX}
                    y1={modelY - 28}
                    x2={rightX}
                    y2={modelY - 28}
                    stroke="var(--diagram-amber)"
                    strokeWidth="2"
                  />
                  {udlXs.map((ux, idx) => (
                    <line
                      key={`udl-${idx}`}
                      x1={ux}
                      y1={modelY - 28}
                      x2={ux}
                      y2={modelY - 6}
                      stroke="var(--diagram-amber)"
                      strokeWidth="1.4"
                      markerEnd="url(#canti-arrow-amber)"
                    />
                  ))}
                  <text
                    x={leftX + plotW * 0.5}
                    y={modelY - 34}
                    textAnchor="middle"
                    className="text-xs font-bold fill-[var(--diagram-amber)] font-mono-num"
                  >
                    w = {inputs.udl} kN/m
                  </text>
                </g>
              )}

              {/* 集中荷重 P */}
              {inputs.pointLoad > 0 && (
                <g>
                  <line
                    x1={toX(inputs.loadPos)}
                    y1={modelY - 48}
                    x2={toX(inputs.loadPos)}
                    y2={modelY - 6}
                    stroke="var(--diagram-red)"
                    strokeWidth="2.8"
                    markerEnd="url(#canti-arrow-red)"
                  />
                  <text
                    x={Math.min(svgW - 45, toX(inputs.loadPos))}
                    y={modelY - 52}
                    textAnchor="middle"
                    className="text-xs font-bold fill-[var(--diagram-red)] font-mono-num"
                  >
                    P = {inputs.pointLoad} kN (a={inputs.loadPos}m)
                  </text>
                </g>
              )}

              {/* 自由端時計回りモーメント M0 */}
              {inputs.endMoment > 0 && (
                <g>
                  <path
                    d={`M ${rightX - 10} ${modelY - 18} A 18 18 0 1 1 ${rightX - 10} ${modelY + 18}`}
                    fill="none"
                    stroke="var(--diagram-violet)"
                    strokeWidth="2.2"
                    markerEnd="url(#canti-arrow-violet)"
                  />
                  <text
                    x={rightX + 6}
                    y={modelY - 22}
                    textAnchor="end"
                    className="text-xs font-bold fill-[var(--diagram-violet)] font-mono-num"
                  >
                    M₀={inputs.endMoment}
                  </text>
                </g>
              )}

              {/* 固定端反力 RA & MA */}
              <line
                x1={leftX + 10}
                y1={modelY + 34}
                x2={leftX + 10}
                y2={modelY + 8}
                stroke="var(--diagram-blue)"
                strokeWidth="2.2"
                markerEnd="url(#canti-arrow-blue)"
              />
              <text
                x={leftX + 20}
                y={modelY + 34}
                className="text-xs font-bold fill-[var(--diagram-blue)] font-mono-num"
              >
                R_A={res.reactionForce}kN, M_A={res.reactionMoment}kN·m
              </text>

              {/* SFD */}
              <text x="12" y={sfdZeroY - 26} className="text-xs font-bold fill-[var(--diagram-blue)]">
                SFD
              </text>
              <text x="12" y={sfdZeroY - 12} className="text-[11px] fill-[var(--text-muted)]">
                (kN)
              </text>
              <line
                x1={leftX}
                y1={sfdZeroY}
                x2={rightX}
                y2={sfdZeroY}
                stroke="currentColor"
                strokeOpacity="0.45"
                strokeDasharray="4 3"
              />
              <polygon points={sfdArea} fill="var(--diagram-blue-fill)" />
              <polyline
                points={sfdPoints}
                fill="none"
                stroke="var(--diagram-blue)"
                strokeWidth="2.5"
              />
              <text
                x={leftX + 6}
                y={sfdZeroY - res.maxShear * vScale - 6}
                className="text-xs font-bold fill-[var(--diagram-blue)] font-mono-num"
              >
                +{res.reactionForce} kN
              </text>

              {/* BMD（下側引張正 → 片持ち梁は負値・上側描画） */}
              <text x="12" y={bmdZeroY - 26} className="text-xs font-bold fill-[var(--diagram-teal)]">
                BMD
              </text>
              <text x="12" y={bmdZeroY - 12} className="text-[11px] fill-[var(--text-muted)]">
                (kN·m)
              </text>
              <line
                x1={leftX}
                y1={bmdZeroY}
                x2={rightX}
                y2={bmdZeroY}
                stroke="currentColor"
                strokeOpacity="0.45"
                strokeDasharray="4 3"
              />
              <polygon points={bmdArea} fill="var(--diagram-teal-fill)" />
              <polyline
                points={bmdPoints}
                fill="none"
                stroke="var(--diagram-teal)"
                strokeWidth="2.5"
              />
              <text
                x={leftX + 6}
                y={bmdZeroY + res.reactionMoment * mScale - 6}
                className="text-xs font-bold fill-[var(--diagram-teal)] font-mono-num"
              >
                M_A = {res.reactionMoment} kN·m（上側引張）
              </text>

              {/* たわみ曲線 δ(x) */}
              <text x="12" y={deflZeroY + 4} className="text-xs font-bold fill-[var(--diagram-violet)]">
                たわみ δ
              </text>
              <text x="12" y={deflZeroY + 18} className="text-[11px] fill-[var(--text-muted)]">
                (mm)
              </text>
              <line
                x1={leftX}
                y1={deflZeroY}
                x2={rightX}
                y2={deflZeroY}
                stroke="currentColor"
                strokeOpacity="0.45"
                strokeDasharray="4 3"
              />
              <polyline
                points={deflPoints}
                fill="none"
                stroke="var(--diagram-violet)"
                strokeWidth="2.8"
              />
              <circle
                cx={rightX}
                cy={deflZeroY + res.tipDeflectionMm * dScale}
                r="4.5"
                fill="var(--diagram-violet)"
              />
              <text
                x={rightX - 6}
                y={deflZeroY + res.tipDeflectionMm * dScale + 16}
                textAnchor="end"
                className="text-xs font-bold fill-[var(--diagram-violet)] font-mono-num"
              >
                δ_max = {res.tipDeflectionMm} mm
              </text>
            </svg>

            <details className="mt-2 app-surface-subtle rounded-lg px-3 py-2 text-xs">
              <summary className="diagram-summary flex items-center justify-between cursor-pointer font-semibold select-none">
                <span>断面力・たわみ計算値一覧（支援技術・検算用）</span>
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </summary>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono-num">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] app-text-muted">
                      <th className="py-1 pr-3">項目</th>
                      <th className="py-1">値</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[var(--border-subtle)]">
                      <td className="py-1 pr-3">固定端鉛直反力 R_A / 曲げモーメント M_A</td>
                      <td className="py-1">
                        {res.reactionForce} kN / {res.reactionMoment} kN·m
                      </td>
                    </tr>
                    <tr className="border-b border-[var(--border-subtle)]">
                      <td className="py-1 pr-3">断面二次モーメント I / 曲げ剛性 EI</td>
                      <td className="py-1">
                        {res.momentOfInertia.toFixed(6)} m⁴ / {res.flexuralRigidity.toLocaleString()} kN·m²
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-3">自由端たわみ δ_max / たわみ角 θ_max</td>
                      <td className="py-1">
                        {res.tipDeflectionMm} mm / {res.tipSlopeMrad} mrad
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        </section>
      </div>

      {/* 途中式・検算パネル */}
      <section className="app-surface rounded-xl shadow-sm overflow-hidden">
        <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2.5 flex items-center justify-between">
          <h2 className="text-sm font-semibold">途中式・検算パネル（重ね合わせの原理）</h2>
          <span className="text-xs app-text-muted">下側引張正 / たわみ下向き正</span>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="app-surface-subtle rounded-lg p-3.5 min-w-0">
            <h3 className="text-xs font-semibold app-text-muted mb-1.5">
              1. 固定端反力（つり合い式）
            </h3>
            <MathFormula
              block
              math={`R_A = P + wL = ${inputs.pointLoad} + ${inputs.udl}\\times ${inputs.span} = ${res.reactionForce}\\text{ kN}`}
            />
            <MathFormula
              block
              math={`M_A = -\\left(Pa + \\frac{wL^2}{2} + M_0\\right) = ${res.reactionMoment}\\text{ kN}\\cdot\\text{m}`}
            />
          </div>
          <div className="app-surface-subtle rounded-lg p-3.5 min-w-0">
            <h3 className="text-xs font-semibold app-text-muted mb-1.5">
              2. 断面二次モーメントと曲げ剛性
            </h3>
            <MathFormula
              block
              math={`I = \\frac{bh^3}{12} = \\frac{${inputs.sectionWidth}\\times ${inputs.sectionHeight}^3}{12} = ${res.momentOfInertia.toFixed(6)}\\text{ m}^4`}
            />
            <MathFormula
              block
              math={`EI = ${inputs.elasticModulusGPa}\\times 10^6 \\times I = ${res.flexuralRigidity.toLocaleString()}\\text{ kN}\\cdot\\text{m}^2`}
            />
          </div>
          <div className="app-surface-subtle rounded-lg p-3.5 min-w-0">
            <h3 className="text-xs font-semibold app-text-muted mb-1.5">
              3. 自由端たわみの重ね合わせ
            </h3>
            <MathFormula
              block
              math={`\\delta_{\\max} = \\frac{Pa^2(3L-a)}{6EI} + \\frac{wL^4}{8EI} + \\frac{M_0 L^2}{2EI}`}
            />
            <MathFormula
              block
              math={`\\delta_{\\max} = ${res.tipDeflectionMm}\\text{ mm},\\quad \\theta_{\\max} = ${res.tipSlopeMrad}\\text{ mrad}`}
            />
          </div>
        </div>
      </section>

      <ChapterExercisePanel
        chapterTitle="片持ち梁の SFD・BMD・たわみ"
        heading="片持ち梁のオリジナル演習（自動採点・シミュレーター検算対応）"
        progressLabel="この単元の演習達成"
        exercises={exercises}
        completedIds={completedExerciseIds}
        onToggleDone={onToggleExerciseDone}
        onMarkDone={onMarkExerciseDone}
      />
    </div>
  );
};

export default CantileverBeamModule;
