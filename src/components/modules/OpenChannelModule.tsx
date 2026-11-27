import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronDown, RotateCcw } from 'lucide-react';
import { calculateOpenChannelFlow, type ChannelInputs } from '../../utils/civilPhysics';
import {
  buildRoutePath,
  getSearchParamFromLocation,
  isPlainLeftClick,
  normalizePathname,
} from '../../utils/router';
import { SliderInput } from '../SliderInput';
import { MathFormula } from '../MathFormula';
import { CopyShareButton } from '../CopyShareButton';
import {
  ChapterExercisePanel,
  type ContinuumExercise,
} from '../continuum/ChapterExercisePanel';

const UNIT_PATH = buildRoutePath('open-channel-flow');

const DEFAULT_CHANNEL: ChannelInputs = {
  bottomWidth: 2.0,
  depth: 1.0,
  sideSlope: 1.0,
  slopeRatio: 0.001,
  roughness: 0.015,
};

const CHANNEL_PRESETS: { label: string; inputs: ChannelInputs }[] = [
  {
    label: 'コンクリート長方形（常流）',
    inputs: { bottomWidth: 2.0, depth: 1.0, sideSlope: 0, slopeRatio: 0.001, roughness: 0.015 },
  },
  {
    label: '急勾配水路（射流）',
    inputs: { bottomWidth: 1.5, depth: 0.6, sideSlope: 0, slopeRatio: 0.015, roughness: 0.013 },
  },
  {
    label: '河川台形断面（1:2）',
    inputs: { bottomWidth: 3.0, depth: 1.5, sideSlope: 2.0, slopeRatio: 0.0005, roughness: 0.025 },
  },
];

function parseInitialChannelInputs(): ChannelInputs {
  try {
    const num = (key: string, fallback: number) => {
      const val = getSearchParamFromLocation(key);
      if (val === null) return fallback;
      const parsed = Number(val);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    return {
      bottomWidth: Math.max(0.5, Math.min(6, num('B', DEFAULT_CHANNEL.bottomWidth))),
      depth: Math.max(0.2, Math.min(3, num('h', DEFAULT_CHANNEL.depth))),
      sideSlope: Math.max(0, Math.min(2.5, num('m', DEFAULT_CHANNEL.sideSlope))),
      slopeRatio: Math.max(0.0005, Math.min(0.02, num('I', DEFAULT_CHANNEL.slopeRatio))),
      roughness: Math.max(0.01, Math.min(0.04, num('n', DEFAULT_CHANNEL.roughness))),
    };
  } catch {
    return DEFAULT_CHANNEL;
  }
}

interface OpenChannelModuleProps {
  isCompleted: boolean;
  onToggleUnitComplete: () => void;
  completedExerciseIds: string[];
  onToggleExerciseDone: (id: string) => void;
  onMarkExerciseDone: (id: string) => void;
  onBackToPortal: () => void;
}

export const OpenChannelModule: React.FC<OpenChannelModuleProps> = ({
  isCompleted,
  onToggleUnitComplete,
  completedExerciseIds,
  onToggleExerciseDone,
  onMarkExerciseDone,
  onBackToPortal,
}) => {
  const [inputs, setInputs] = useState<ChannelInputs>(() => parseInitialChannelInputs());
  const res = useMemo(() => calculateOpenChannelFlow(inputs), [inputs]);

  useEffect(() => {
    if (normalizePathname(window.location.pathname) !== UNIT_PATH) {
      return;
    }
    const isDefault =
      inputs.bottomWidth === DEFAULT_CHANNEL.bottomWidth &&
      inputs.depth === DEFAULT_CHANNEL.depth &&
      inputs.sideSlope === DEFAULT_CHANNEL.sideSlope &&
      inputs.slopeRatio === DEFAULT_CHANNEL.slopeRatio &&
      inputs.roughness === DEFAULT_CHANNEL.roughness;
    if (isDefault) {
      if (window.location.pathname + window.location.search !== UNIT_PATH) {
        window.history.replaceState(null, '', UNIT_PATH);
      }
      return;
    }
    const params = new URLSearchParams({
      B: String(inputs.bottomWidth),
      h: String(inputs.depth),
      m: String(inputs.sideSlope),
      I: String(inputs.slopeRatio),
      n: String(inputs.roughness),
    });
    const nextUrl = `${UNIT_PATH}?${params.toString()}`;
    if (window.location.pathname + window.location.search !== nextUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [inputs]);

  const applyPresetAndScroll = (preset: ChannelInputs) => {
    setInputs(preset);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exercises = useMemo<ContinuumExercise[]>(
    () => [
      {
        id: 'channel-q1',
        category: '長方形断面の径深',
        title: '問1：長方形開水路の径深 R を求める',
        statement:
          '底幅 B = 2.0 m、水深 h = 1.0 m の長方形開水路（法面勾配 m = 0）において、径深 R = A / P（m）を求めよ。',
        kind: 'numeric',
        expectedValue: 0.5,
        tolerance: 0.02,
        unit: 'm',
        inputHint: '例: 0.5',
        hint: '長方形断面では通水断面積 A = B·h、潤辺 P = B + 2h です。',
        steps: [
          {
            label: '通水断面積 A と潤辺 P を求める',
            math: 'A = B \\cdot h = 2.0 \\times 1.0 = 2.0\\text{ m}^2,\\quad P = B + 2h = 2.0 + 2(1.0) = 4.0\\text{ m}',
          },
          {
            label: '径深 R = A / P を計算する',
            math: 'R = \\frac{A}{P} = \\frac{2.0}{4.0} = 0.50\\text{ m}',
          },
        ],
        answerSummary: 'R = 0.50 m',
        onApplyPreset: () =>
          applyPresetAndScroll({
            bottomWidth: 2.0,
            depth: 1.0,
            sideSlope: 0,
            slopeRatio: 0.001,
            roughness: 0.015,
          }),
      },
      {
        id: 'channel-q2',
        category: '台形断面の通水断面積',
        title: '問2：台形開水路の通水断面積 A を求める',
        statement:
          '底幅 B = 2.0 m、水深 h = 1.0 m、法面勾配 1:m（m = 1.0）の台形開水路において、通水断面積 A（m²）を求めよ。',
        kind: 'numeric',
        expectedValue: 3.0,
        tolerance: 0.05,
        unit: 'm²',
        inputHint: '例: 3.0',
        hint: '台形断面の上底（水面幅）は T = B + 2mh なので、A = (B + mh)h で求められます。',
        steps: [
          {
            label: '台形断面の面積公式に代入する',
            math: 'A = (B + mh)h = (2.0 + 1.0 \\times 1.0) \\times 1.0 = 3.0\\text{ m}^2',
          },
        ],
        answerSummary: 'A = 3.0 m²',
        onApplyPreset: () =>
          applyPresetAndScroll({
            bottomWidth: 2.0,
            depth: 1.0,
            sideSlope: 1.0,
            slopeRatio: 0.001,
            roughness: 0.015,
          }),
      },
      {
        id: 'channel-q3',
        category: 'フルード数と流況判定',
        title: '問3：急勾配水路における流況（常流／限界流／射流）の判定',
        statement:
          '底幅 B = 1.5 m、水深 h = 0.6 m の長方形水路（m = 0）で、水路勾配 I = 0.015、粗度係数 n = 0.013 の等流が生じている。フルード数 Fr に基づく流況として正しいものを選べ。',
        kind: 'choice',
        choices: [
          { id: 'sub', label: '常流（Fr < 1）：流速が波速より遅く、下流の影響が上流へ伝わる' },
          { id: 'crit', label: '限界流（Fr ≈ 1）：比エネルギーが最小となる遷移状態' },
          { id: 'super', label: '射流（Fr > 1）：流速が波速より速く、上流側が流れを支配する' },
        ],
        correctChoiceId: 'super',
        hint: 'R = 0.9 / 2.7 = 1/3 m より v ≈ 4.53 m/s、波速 √(gh) ≈ 2.43 m/s なので Fr を比較してみましょう。',
        steps: [
          {
            label: 'マニングの公式から平均流速 v を求める',
            math: 'R = \\frac{1.5 \\times 0.6}{1.5 + 1.2} = 0.33\\text{ m},\\quad v = \\frac{1}{0.013}R^{2/3}(0.015)^{1/2} \\approx 4.53\\text{ m/s}',
          },
          {
            label: 'フルード数 Fr を算出して判定する',
            math: 'Fr = \\frac{4.53}{\\sqrt{9.81 \\times 0.6}} \\approx 1.87 > 1 \\implies \\text{射流 (Supercritical)}',
          },
        ],
        answerSummary: '射流（Fr ≈ 1.87 > 1）',
        onApplyPreset: () =>
          applyPresetAndScroll({
            bottomWidth: 1.5,
            depth: 0.6,
            sideSlope: 0,
            slopeRatio: 0.015,
            roughness: 0.013,
          }),
      },
    ],
    []
  );

  const svgW = 480;
  const svgH = 250;
  const cx = svgW / 2;
  const bottomY = 200;
  const maxDrawW = svgW - 64;
  const maxDrawH = 148;

  const wallHeightM = Math.max(inputs.depth * 1.25, inputs.depth + 0.35, 1.2);
  const totalTopWallM = inputs.bottomWidth + 2 * inputs.sideSlope * wallHeightM;
  const scale = Math.min(maxDrawW / Math.max(totalTopWallM, 1), maxDrawH / wallHeightM);

  const bPx = inputs.bottomWidth * scale;
  const hPx = inputs.depth * scale;
  const sidePx = inputs.sideSlope * inputs.depth * scale;
  const wallH = wallHeightM * scale;
  const wallSide = inputs.sideSlope * wallHeightM * scale;
  const waterSurfaceY = bottomY - hPx;
  const labelFitsInsideWater = hPx >= 28;

  const regimeBadgeClass =
    res.regime === '射流 (Supercritical)'
      ? 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/35'
      : res.regime === '限界流 (Critical)'
        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40'
        : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
  const regimeDotColor =
    res.regime === '射流 (Supercritical)'
      ? 'var(--diagram-red)'
      : res.regime === '限界流 (Critical)'
        ? 'var(--diagram-amber)'
        : 'var(--diagram-blue)';

  return (
    <div className="space-y-6">
      <div className="app-surface rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <a
            href={buildRoutePath('home', 'all')}
            onClick={(e) => {
              if (isPlainLeftClick(e)) {
                e.preventDefault();
                onBackToPortal();
              }
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            ポータル一覧に戻る
          </a>
          <h1 id="main-content" tabIndex={-1} className="portal-h1 font-bold">
            水理学｜開水路等流・マニングの公式
          </h1>
          <p className="text-xs sm:text-sm app-text-muted">
            台形・長方形断面の通水断面積 A、潤辺 P、径深 R、平均流速 v、流量 Q、フルード数 Fr をリアルタイム計算します。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CopyShareButton getTextToCopy={() => window.location.href} />
          <button
            type="button"
            onClick={() => setInputs(DEFAULT_CHANNEL)}
            className="interactive-btn app-surface inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            初期値
          </button>
          <button
            type="button"
            aria-pressed={isCompleted}
            onClick={onToggleUnitComplete}
            className={`interactive-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border cursor-pointer ${
              isCompleted
                ? 'bg-emerald-700 text-white border-emerald-800 dark:border-emerald-500'
                : 'app-surface'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {isCompleted ? '単元完了済み' : 'この単元を完了にする'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-4 app-surface rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-bold border-b border-[var(--border-subtle)] pb-2">
            水路断面・水理定数
          </h2>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold app-text-muted">典型ケース（ワンクリック読込）</p>
            <div className="flex flex-wrap gap-1.5">
              {CHANNEL_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setInputs(preset.inputs)}
                  className="interactive-btn app-surface-subtle rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <SliderInput
            label="底幅"
            symbol="B"
            unit="m"
            value={inputs.bottomWidth}
            min={0.5}
            max={6}
            step={0.1}
            onChange={(v) => setInputs((p) => ({ ...p, bottomWidth: v }))}
          />
          <SliderInput
            label="水深"
            symbol="h"
            unit="m"
            value={inputs.depth}
            min={0.2}
            max={3}
            step={0.05}
            onChange={(v) => setInputs((p) => ({ ...p, depth: v }))}
          />
          <SliderInput
            label="法面勾配 (1:m)"
            symbol="m"
            unit="-"
            value={inputs.sideSlope}
            min={0}
            max={2.5}
            step={0.25}
            onChange={(v) => setInputs((p) => ({ ...p, sideSlope: v }))}
          />
          <SliderInput
            label="水路勾配"
            symbol="I"
            unit="-"
            value={inputs.slopeRatio}
            min={0.0005}
            max={0.02}
            step={0.0005}
            onChange={(v) => setInputs((p) => ({ ...p, slopeRatio: v }))}
          />
          <SliderInput
            label="粗度係数"
            symbol="n"
            unit="-"
            value={inputs.roughness}
            min={0.01}
            max={0.04}
            step={0.001}
            onChange={(v) => setInputs((p) => ({ ...p, roughness: v }))}
          />
        </aside>

        <div className="lg:col-span-8 space-y-6">
          <div className="app-surface rounded-xl overflow-hidden">
            <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">水路横断面図（自動縮尺）</h2>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${regimeBadgeClass}`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: regimeDotColor }}
                  aria-hidden="true"
                />
                {res.regime} (Fr = {res.froudeNumber})
              </span>
            </div>

            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-auto block select-none"
              role="img"
              aria-label={`底幅 ${inputs.bottomWidth} m、水深 ${inputs.depth} m、法面勾配 1:${inputs.sideSlope} の開水路断面。通水断面積 A=${res.area} m²、平均流速 v=${res.velocity} m/s、流量 Q=${res.discharge} m³/s、${res.regime}（Fr=${res.froudeNumber}）。`}
            >
              {/* 水域 */}
              <polygon
                points={`${cx - bPx / 2 - sidePx},${waterSurfaceY} ${cx + bPx / 2 + sidePx},${waterSurfaceY} ${cx + bPx / 2},${bottomY} ${cx - bPx / 2},${bottomY}`}
                fill="var(--diagram-blue-fill)"
                stroke="var(--diagram-blue)"
                strokeWidth="2"
              />
              {/* 水面マーク（▽） */}
              <polygon
                points={`${cx},${waterSurfaceY} ${cx - 5},${waterSurfaceY - 7} ${cx + 5},${waterSurfaceY - 7}`}
                fill="none"
                stroke="var(--diagram-blue)"
                strokeWidth="1.5"
              />
              {/* 水路枠 */}
              <polyline
                points={`${cx - bPx / 2 - wallSide},${bottomY - wallH} ${cx - bPx / 2},${bottomY} ${
                  cx + bPx / 2
                },${bottomY} ${cx + bPx / 2 + wallSide},${bottomY - wallH}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              {/* 水面幅 T 寸法線 */}
              <line
                x1={cx - bPx / 2 - sidePx}
                y1={Math.max(24, waterSurfaceY - 16)}
                x2={cx + bPx / 2 + sidePx}
                y2={Math.max(24, waterSurfaceY - 16)}
                stroke="var(--diagram-muted)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={cx}
                y={Math.max(18, waterSurfaceY - 21)}
                textAnchor="middle"
                className="text-xs font-semibold fill-[var(--diagram-muted)] font-mono-num"
              >
                水面幅 T = {res.topWidth} m{inputs.sideSlope > 0 ? `（法面 1:${inputs.sideSlope}）` : '（長方形）'}
              </text>
              {/* 底幅 B ラベル */}
              <text
                x={cx}
                y={bottomY + 22}
                textAnchor="middle"
                className="text-xs font-bold fill-current font-mono-num"
              >
                底幅 B = {inputs.bottomWidth} m ／ 潤辺 P = {res.wettedPerimeter} m
              </text>
              {/* 水深・断面積ラベル */}
              <text
                x={cx}
                y={labelFitsInsideWater ? bottomY - hPx / 2 + 4 : bottomY + 40}
                textAnchor="middle"
                className="text-xs font-bold fill-[var(--diagram-blue)] font-mono-num"
              >
                h = {inputs.depth} m (A = {res.area} m²)
              </text>
            </svg>

            <details className="border-t border-[var(--border-subtle)] px-4 py-2 text-xs group">
              <summary className="diagram-summary flex items-center justify-between cursor-pointer font-semibold app-text-muted py-1 list-none">
                <span>図解の数値サマリー（スクリーンリーダー・検算用）</span>
                <ChevronDown className="h-3.5 w-3.5 transition-transform duration-150 group-open:rotate-180" aria-hidden="true" />
              </summary>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 pb-1 font-mono-num">
                <div><dt className="app-text-muted">通水断面積 A</dt><dd className="font-bold">{res.area} m²</dd></div>
                <div><dt className="app-text-muted">潤辺 P</dt><dd className="font-bold">{res.wettedPerimeter} m</dd></div>
                <div><dt className="app-text-muted">径深 R = A/P</dt><dd className="font-bold">{res.hydraulicRadius} m</dd></div>
                <div><dt className="app-text-muted">水面幅 T</dt><dd className="font-bold">{res.topWidth} m</dd></div>
                <div><dt className="app-text-muted">平均流速 v / 流量 Q</dt><dd className="font-bold">{res.velocity} m/s / {res.discharge} m³/s</dd></div>
                <div><dt className="app-text-muted">フルード数 Fr</dt><dd className="font-bold">{res.froudeNumber}（{res.regime}）</dd></div>
              </dl>
            </details>
          </div>

          <section className="app-surface rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold">途中計算ステップ（マニングの公式と流況）</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="app-surface-subtle rounded-lg p-3 space-y-1">
                <h3 className="text-xs font-semibold app-text-muted">1. 断面諸量（A, P, R）</h3>
                <MathFormula
                  block
                  math={`A = (B + mh)h = (${inputs.bottomWidth} + ${inputs.sideSlope}\\times${inputs.depth})\\times${inputs.depth} = ${res.area}\\text{ m}^2`}
                />
                <MathFormula
                  block
                  math={`P = B + 2h\\sqrt{1+m^2} = ${res.wettedPerimeter}\\text{ m},\\quad R = \\frac{A}{P} = ${res.hydraulicRadius}\\text{ m}`}
                />
              </div>
              <div className="app-surface-subtle rounded-lg p-3 space-y-1">
                <h3 className="text-xs font-semibold app-text-muted">2. 平均流速・流量・フルード数</h3>
                <MathFormula
                  block
                  math={`v = \\frac{1}{${inputs.roughness}}(${res.hydraulicRadius})^{2/3}(${inputs.slopeRatio})^{1/2} = ${res.velocity}\\text{ m/s}`}
                />
                <MathFormula
                  block
                  math={`Q = A \\cdot v = ${res.discharge}\\text{ m}^3/\\text{s},\\quad Fr = \\frac{v}{\\sqrt{g(A/T)}} = ${res.froudeNumber}`}
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      <ChapterExercisePanel
        chapterTitle="開水路等流・マニングの公式"
        heading="テスト対策・オリジナル演習問題（全3問）"
        progressLabel="演習達成"
        exercises={exercises}
        completedIds={completedExerciseIds}
        onToggleDone={onToggleExerciseDone}
        onMarkDone={onMarkExerciseDone}
      />
    </div>
  );
};

export default OpenChannelModule;
