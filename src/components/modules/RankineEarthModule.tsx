import React, { useEffect, useId, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronDown, RotateCcw } from 'lucide-react';
import {
  calculateRankineEarthPressure,
  type RankineInputs,
} from '../../utils/civilPhysics';
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

const UNIT_PATH = buildRoutePath('rankine-earth-pressure');

const DEFAULT_RANKINE: RankineInputs = {
  height: 5,
  gamma: 18,
  phi: 30,
  c: 0,
  q: 10,
};

const RANKINE_PRESETS: { label: string; inputs: RankineInputs; mode?: 'active' | 'passive' }[] = [
  {
    label: '砂質土（c=0・標準）',
    inputs: { height: 5, gamma: 18, phi: 30, c: 0, q: 0 },
    mode: 'active',
  },
  {
    label: '粘性土・引張亀裂あり',
    inputs: { height: 6, gamma: 17, phi: 15, c: 15, q: 0 },
    mode: 'active',
  },
  {
    label: '上載荷重あり擁壁',
    inputs: { height: 5, gamma: 19, phi: 35, c: 0, q: 20 },
    mode: 'active',
  },
];

function parseInitialRankineState(): { inputs: RankineInputs; mode: 'active' | 'passive' } {
  try {
    const num = (key: string, fallback: number) => {
      const val = getSearchParamFromLocation(key);
      if (val === null) return fallback;
      const parsed = Number(val);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const rawMode = getSearchParamFromLocation('mode');
    return {
      inputs: {
        height: Math.max(1, Math.min(12, num('H', DEFAULT_RANKINE.height))),
        gamma: Math.max(14, Math.min(22, num('g', DEFAULT_RANKINE.gamma))),
        phi: Math.max(0, Math.min(45, num('phi', DEFAULT_RANKINE.phi))),
        c: Math.max(0, Math.min(40, num('c', DEFAULT_RANKINE.c))),
        q: Math.max(0, Math.min(50, num('q', DEFAULT_RANKINE.q))),
      },
      mode: rawMode === 'passive' ? 'passive' : 'active',
    };
  } catch {
    return { inputs: DEFAULT_RANKINE, mode: 'active' };
  }
}

interface RankineEarthModuleProps {
  isCompleted: boolean;
  onToggleUnitComplete: () => void;
  completedExerciseIds: string[];
  onToggleExerciseDone: (id: string) => void;
  onMarkExerciseDone: (id: string) => void;
  onBackToPortal: () => void;
}

export const RankineEarthModule: React.FC<RankineEarthModuleProps> = ({
  isCompleted,
  onToggleUnitComplete,
  completedExerciseIds,
  onToggleExerciseDone,
  onMarkExerciseDone,
  onBackToPortal,
}) => {
  const [initialState] = useState(() => parseInitialRankineState());
  const [inputs, setInputs] = useState<RankineInputs>(initialState.inputs);
  const [mode, setMode] = useState<'active' | 'passive'>(initialState.mode);
  const res = useMemo(() => calculateRankineEarthPressure(inputs), [inputs]);
  const svgUid = useId();
  const arrowAmberId = `${svgUid}-rankine-amber`;
  const arrowResultId = `${svgUid}-rankine-result`;

  useEffect(() => {
    if (normalizePathname(window.location.pathname) !== UNIT_PATH) {
      return;
    }
    const isDefault =
      mode === 'active' &&
      inputs.height === DEFAULT_RANKINE.height &&
      inputs.gamma === DEFAULT_RANKINE.gamma &&
      inputs.phi === DEFAULT_RANKINE.phi &&
      inputs.c === DEFAULT_RANKINE.c &&
      inputs.q === DEFAULT_RANKINE.q;
    if (isDefault) {
      if (window.location.pathname + window.location.search !== UNIT_PATH) {
        window.history.replaceState(null, '', UNIT_PATH);
      }
      return;
    }
    const params = new URLSearchParams({
      H: String(inputs.height),
      g: String(inputs.gamma),
      phi: String(inputs.phi),
      c: String(inputs.c),
      q: String(inputs.q),
      mode,
    });
    const nextUrl = `${UNIT_PATH}?${params.toString()}`;
    if (window.location.pathname + window.location.search !== nextUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [inputs, mode]);

  const applyPresetAndScroll = (preset: RankineInputs, nextMode: 'active' | 'passive' = 'active') => {
    setInputs(preset);
    setMode(nextMode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exercises = useMemo<ContinuumExercise[]>(
    () => [
      {
        id: 'rankine-q1',
        category: '砂質土の主働土圧合力',
        title: '問1：砂質土（c = 0, q = 0）における主働土圧合力 P_a',
        statement:
          '擁壁高さ H = 4 m、背面土の単位体積重量 γ = 18 kN/m³、内部摩擦角 φ = 30°、粘着力 c = 0、上載荷重 q = 0 のとき、ランキン主働土圧合力 P_a（kN/m）を求めよ。',
        kind: 'numeric',
        expectedValue: 48,
        tolerance: 0.5,
        unit: 'kN/m',
        inputHint: '例: 48',
        hint: 'φ = 30° のとき Ka = tan²(45° − 15°) = tan²(30°) = 1/3、合力 Pa = (1/2)γH²Ka です。',
        steps: [
          {
            label: '主働土圧係数 K_a を求める',
            math: 'K_a = \\tan^2\\left(45^\\circ - \\frac{30^\\circ}{2}\\right) = \\tan^2(30^\\circ) = \\frac{1}{3} \\approx 0.333',
          },
          {
            label: '三角形土圧分布の面積から合力 P_a を求める',
            math: 'P_a = \\frac{1}{2}\\gamma H^2 K_a = \\frac{1}{2} \\times 18 \\times 4^2 \\times \\frac{1}{3} = 48\\text{ kN/m}',
          },
        ],
        answerSummary: 'P_a = 48 kN/m（作用高さ y_a = H/3 ≈ 1.33 m）',
        onApplyPreset: () =>
          applyPresetAndScroll({ height: 4, gamma: 18, phi: 30, c: 0, q: 0 }, 'active'),
      },
      {
        id: 'rankine-q2',
        category: '上載荷重と合力作用位置',
        title: '問2：上載荷重があるときの主働土圧合力の作用高さ y_a',
        statement:
          '擁壁高さ H = 6 m、γ = 20 kN/m³、φ = 30°、c = 0 の砂質土地盤に地表面上載荷重 q = 40 kPa が作用している（台形土圧分布）。主働土圧合力の壁底からの作用高さ y_a（m）を求めよ。',
        kind: 'numeric',
        expectedValue: 2.4,
        tolerance: 0.05,
        unit: 'm',
        inputHint: '例: 2.4',
        hint: '台形分布の図心高さは y_a = (H/3)·(2p_top + p_bot)/(p_top + p_bot) です。q=40, γH=120 より p_top : p_bot = 1 : 4 となります。',
        steps: [
          {
            label: '壁頂と壁底の主働土圧強度の比を求める',
            math: 'p_a(0) = 40 K_a,\\quad p_a(6) = (40 + 20 \\times 6)K_a = 160 K_a \\implies p_a(0):p_a(6) = 1:4',
          },
          {
            label: '台形の図心公式から壁底からの高さ y_a を算出する',
            math: 'y_a = \\frac{H}{3}\\cdot\\frac{2p_a(0) + p_a(6)}{p_a(0) + p_a(6)} = \\frac{6}{3}\\cdot\\frac{2(1) + 4}{1 + 4} = 2 \\times \\frac{6}{5} = 2.40\\text{ m}',
          },
        ],
        answerSummary: 'y_a = 2.40 m',
        onApplyPreset: () =>
          applyPresetAndScroll({ height: 6, gamma: 20, phi: 30, c: 0, q: 40 }, 'active'),
      },
      {
        id: 'rankine-q3',
        category: '粘性土の引張亀裂深さ',
        title: '問3：非排水粘土（φ = 0°）の引張亀裂深さ z_0',
        statement:
          '擁壁高さ H = 5 m、γ = 18 kN/m³、φ = 0°、粘着力 c = 18 kPa、上載荷重 q = 0 の粘性土地盤における引張亀裂深さ z_0（m）を求めよ。',
        kind: 'numeric',
        expectedValue: 2.0,
        tolerance: 0.05,
        unit: 'm',
        inputHint: '例: 2.0',
        hint: 'φ = 0° のとき Ka = tan²(45°) = 1 なので、p_a(z) = γz − 2c = 0 を解くと z_0 = 2c/γ です。',
        steps: [
          {
            label: 'φ = 0° より主働土圧係数 K_a = 1 を得る',
            math: 'K_a = \\tan^2(45^\\circ) = 1',
          },
          {
            label: 'p_a(z_0) = 0 より引張亀裂深さ z_0 を求める',
            math: 'z_0 = \\frac{2c}{\\gamma\\sqrt{K_a}} = \\frac{2 \\times 18}{18 \\times 1} = 2.0\\text{ m}',
          },
        ],
        answerSummary: 'z_0 = 2.0 m',
        onApplyPreset: () =>
          applyPresetAndScroll({ height: 5, gamma: 18, phi: 0, c: 18, q: 0 }, 'active'),
      },
    ],
    []
  );

  const isActive = mode === 'active';
  const wallTopY = 56;
  const wallBotY = 236;
  const wallHpx = wallBotY - wallTopY;

  const currentTop = isActive ? Math.max(0, res.paTop) : res.ppTop;
  const currentBot = isActive ? Math.max(0, res.paBottom) : res.ppBottom;
  const maxP = Math.max(currentBot, currentTop, 20);
  const scaleW = 155 / maxP;

  const z0Px = isActive ? (res.tensionCrackDepth / inputs.height) * wallHpx : 0;
  const topWidth = currentTop * scaleW;
  const botWidth = currentBot * scaleW;

  const resultantForce = isActive ? res.totalActiveForce : res.totalPassiveForce;
  const resultantHeight = isActive ? res.activeForceHeight : res.passiveForceHeight;
  const resultantY =
    resultantHeight !== null ? wallBotY - (resultantHeight / inputs.height) * wallHpx : null;

  const diagramStroke = isActive ? 'var(--diagram-blue)' : 'var(--diagram-teal)';
  const diagramFill = isActive ? 'var(--diagram-blue-fill)' : 'var(--diagram-teal-fill)';

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
            土質力学｜ランキン土圧（主働・受働土圧）
          </h1>
          <p className="text-xs sm:text-sm app-text-muted">
            擁壁背面に作用する主働土圧係数 Ka・受働土圧係数 Kp・引張亀裂深さ・合力および作用位置をリアルタイム計算します。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CopyShareButton getTextToCopy={() => window.location.href} />
          <button
            type="button"
            onClick={() => {
              setInputs(DEFAULT_RANKINE);
              setMode('active');
            }}
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
            擁壁・背面土パラメータ
          </h2>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold app-text-muted">典型ケース（ワンクリック読込）</p>
            <div className="flex flex-wrap gap-1.5">
              {RANKINE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setInputs(preset.inputs);
                    if (preset.mode) setMode(preset.mode);
                  }}
                  className="interactive-btn app-surface-subtle rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <SliderInput
            label="擁壁高さ"
            symbol="H"
            unit="m"
            value={inputs.height}
            min={1}
            max={12}
            step={0.5}
            onChange={(v) => setInputs((p) => ({ ...p, height: v }))}
          />
          <SliderInput
            label="単位体積重量"
            symbol="γ"
            unit="kN/m³"
            value={inputs.gamma}
            min={14}
            max={22}
            step={0.5}
            onChange={(v) => setInputs((p) => ({ ...p, gamma: v }))}
          />
          <SliderInput
            label="内部摩擦角"
            symbol="φ"
            unit="°"
            value={inputs.phi}
            min={0}
            max={45}
            step={1}
            onChange={(v) => setInputs((p) => ({ ...p, phi: v }))}
          />
          <SliderInput
            label="粘着力"
            symbol="c"
            unit="kPa"
            value={inputs.c}
            min={0}
            max={40}
            step={1}
            onChange={(v) => setInputs((p) => ({ ...p, c: v }))}
          />
          <SliderInput
            label="地表面上載荷重"
            symbol="q"
            unit="kPa"
            value={inputs.q}
            min={0}
            max={50}
            step={2}
            onChange={(v) => setInputs((p) => ({ ...p, q: v }))}
          />
        </aside>

        <div className="lg:col-span-8 space-y-6">
          <div className="app-surface rounded-xl overflow-hidden">
            <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold">
                  {isActive ? '主働土圧分布図' : '受働土圧分布図'}（鉛直背面壁）
                </h2>
                <div role="group" aria-label="表示する土圧モード" className="inline-flex rounded-lg border border-[var(--border-control)] overflow-hidden text-xs">
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setMode('active')}
                    className={`px-2.5 py-1 font-semibold cursor-pointer ${
                      isActive ? 'bg-blue-700 text-white' : 'app-surface border-0'
                    }`}
                  >
                    主働土圧 Pₐ
                  </button>
                  <button
                    type="button"
                    aria-pressed={!isActive}
                    onClick={() => setMode('passive')}
                    className={`px-2.5 py-1 font-semibold cursor-pointer border-l border-[var(--border-control)] ${
                      !isActive ? 'bg-teal-700 text-white' : 'app-surface border-y-0 border-r-0'
                    }`}
                  >
                    受働土圧 Pₚ
                  </button>
                </div>
              </div>
              <span className="text-xs font-mono-num font-bold text-blue-700 dark:text-blue-300">
                合力 {isActive ? 'Pₐ' : 'Pₚ'} = {resultantForce} kN/m
                {resultantHeight !== null ? ` (壁底より y = ${resultantHeight} m)` : ''}
              </span>
            </div>

            <svg
              viewBox="0 0 560 288"
              className="w-full h-auto block select-none"
              role="img"
              aria-label={`高さ ${inputs.height} m の擁壁背面のランキン${isActive ? '主働' : '受働'}土圧分布図。合力 ${resultantForce} kN/m${resultantHeight !== null ? `、壁底からの作用高さ ${resultantHeight} m` : '（全高引張域）'}。`}
            >
              <defs>
                <marker
                  id={arrowAmberId}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--diagram-amber)" />
                </marker>
                <marker
                  id={arrowResultId}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--diagram-red)" />
                </marker>
              </defs>

              {/* 地盤面 */}
              <line
                x1="150"
                y1={wallTopY}
                x2="520"
                y2={wallTopY}
                stroke="currentColor"
                strokeOpacity="0.6"
                strokeWidth="2"
              />
              {/* 上載荷重矢印 */}
              {inputs.q > 0 &&
                [200, 250, 300, 350, 400].map((x) => (
                  <line
                    key={x}
                    x1={x}
                    y1="26"
                    x2={x}
                    y2={wallTopY - 5}
                    stroke="var(--diagram-amber)"
                    strokeWidth="1.8"
                    markerEnd={`url(#${arrowAmberId})`}
                  />
                ))}
              {inputs.q > 0 && (
                <text
                  x="300"
                  y="19"
                  textAnchor="middle"
                  className="text-xs font-semibold fill-[var(--diagram-amber)] font-mono-num"
                >
                  上載荷重 q = {inputs.q} kPa
                </text>
              )}

              {/* 擁壁本体 */}
              <polygon
                points={`120,${wallTopY} 150,${wallTopY} 150,${wallBotY} 95,${wallBotY}`}
                fill="currentColor"
                fillOpacity="0.16"
                stroke="currentColor"
                strokeOpacity="0.7"
                strokeWidth="2"
              />

              {/* 引張亀裂深さ z0（主働モードのみ） */}
              {isActive && res.tensionCrackDepth > 0 && (
                <>
                  <line
                    x1="150"
                    y1={wallTopY + z0Px}
                    x2="350"
                    y2={wallTopY + z0Px}
                    stroke="var(--diagram-red)"
                    strokeDasharray="4 3"
                    strokeWidth="1.5"
                  />
                  <text
                    x="356"
                    y={Math.min(wallBotY - 6, wallTopY + z0Px + 4)}
                    className="text-xs font-semibold fill-[var(--diagram-red)] font-mono-num"
                  >
                    {res.isFullHeightTension
                      ? `全高引張域 (理論 z₀ = ${res.theoreticalTensionCrackDepth} m ≥ H)`
                      : `引張亀裂 z₀ = ${res.tensionCrackDepth} m`}
                  </text>
                </>
              )}

              {/* 土圧分布（正圧領域） */}
              {!(isActive && res.isFullHeightTension) ? (
                <g>
                  <polygon
                    points={`150,${wallTopY + z0Px} ${150 + topWidth},${wallTopY + z0Px} ${
                      150 + botWidth
                    },${wallBotY} 150,${wallBotY}`}
                    fill={diagramFill}
                    stroke={diagramStroke}
                    strokeWidth="2"
                  />
                  {topWidth > 0 && (
                    <text
                      x={158 + topWidth}
                      y={wallTopY + z0Px + 14}
                      className="text-xs font-semibold font-mono-num"
                      style={{ fill: diagramStroke }}
                    >
                      {isActive ? 'pₐ(0)' : 'pₚ(0)'} = {isActive ? res.paTop : res.ppTop} kPa
                    </text>
                  )}
                  <text
                    x={158 + botWidth}
                    y={wallBotY - 4}
                    className="text-xs font-bold font-mono-num"
                    style={{ fill: diagramStroke }}
                  >
                    {isActive ? 'pₐ(H)' : 'pₚ(H)'} = {isActive ? res.paBottom : res.ppBottom} kPa
                  </text>
                </g>
              ) : (
                <text
                  x="275"
                  y={(wallTopY + wallBotY) / 2}
                  textAnchor="middle"
                  className="text-xs font-bold fill-[var(--diagram-red)]"
                >
                  粘着力により全高で pₐ(z) ≤ 0（自立可能域・Pₐ = 0 kN/m）
                </text>
              )}

              {/* 合力ベクトルと作用位置高さ y_a / y_p */}
              {resultantY !== null && resultantHeight !== null && (
                <g>
                  <line
                    x1={Math.max(245, 150 + botWidth + 40)}
                    y1={resultantY}
                    x2="155"
                    y2={resultantY}
                    stroke="var(--diagram-red)"
                    strokeWidth="2.5"
                    markerEnd={`url(#${arrowResultId})`}
                  />
                  <text
                    x={Math.max(250, 150 + botWidth + 46)}
                    y={resultantY + 4}
                    className="text-xs font-bold fill-[var(--diagram-red)] font-mono-num"
                  >
                    {isActive ? 'Pₐ' : 'Pₚ'} = {resultantForce} kN/m
                  </text>
                  <line
                    x1="150"
                    y1={wallBotY}
                    x2="64"
                    y2={wallBotY}
                    stroke="var(--diagram-muted)"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                  />
                  <line
                    x1="150"
                    y1={resultantY}
                    x2="64"
                    y2={resultantY}
                    stroke="var(--diagram-red)"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                  />
                  <line
                    x1="72"
                    y1={resultantY}
                    x2="72"
                    y2={wallBotY}
                    stroke="var(--diagram-red)"
                    strokeWidth="1.5"
                  />
                  <text
                    x="66"
                    y={(resultantY + wallBotY) / 2 + 4}
                    textAnchor="end"
                    className="text-[11px] font-bold fill-[var(--diagram-red)] font-mono-num"
                  >
                    {isActive ? 'yₐ' : 'yₚ'}={resultantHeight}m
                  </text>
                </g>
              )}

              {/* 擁壁高さラベル */}
              <text
                x="56"
                y={wallTopY + 26}
                textAnchor="middle"
                className="text-xs font-semibold fill-current font-mono-num"
              >
                H = {inputs.height} m
              </text>
            </svg>

            <details className="border-t border-[var(--border-subtle)] px-4 py-2 text-xs group">
              <summary className="diagram-summary flex items-center justify-between cursor-pointer font-semibold app-text-muted py-1 list-none">
                <span>図解の数値サマリー（スクリーンリーダー・検算用）</span>
                <ChevronDown className="h-3.5 w-3.5 transition-transform duration-150 group-open:rotate-180" aria-hidden="true" />
              </summary>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 pb-1 font-mono-num">
                <div><dt className="app-text-muted">土圧係数 K_a / K_p</dt><dd className="font-bold">{res.ka} / {res.kp}</dd></div>
                <div><dt className="app-text-muted">主働土圧強度 p_a(0) / p_a(H)</dt><dd className="font-bold">{res.paTop} / {res.paBottom} kPa</dd></div>
                <div><dt className="app-text-muted">引張亀裂深さ z_0</dt><dd className="font-bold">{res.tensionCrackDepth} m (理論 {res.theoreticalTensionCrackDepth} m)</dd></div>
                <div><dt className="app-text-muted">主働合力 P_a / y_a</dt><dd className="font-bold">{res.totalActiveForce} kN/m / {res.activeForceHeight !== null ? `${res.activeForceHeight} m` : '—'}</dd></div>
                <div><dt className="app-text-muted">受働土圧強度 p_p(0) / p_p(H)</dt><dd className="font-bold">{res.ppTop} / {res.ppBottom} kPa</dd></div>
                <div><dt className="app-text-muted">受働合力 P_p / y_p</dt><dd className="font-bold">{res.totalPassiveForce} kN/m / {res.passiveForceHeight} m</dd></div>
              </dl>
            </details>
          </div>

          <section className="app-surface rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold">途中計算ステップ（ランキン土圧の算定）</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="app-surface-subtle rounded-lg p-3 space-y-1">
                <h3 className="text-xs font-semibold app-text-muted">1. 主働・受働土圧係数</h3>
                <MathFormula
                  block
                  math={`K_a = \\tan^2\\left(45^\\circ - \\frac{${inputs.phi}^\\circ}{2}\\right) = ${res.ka}`}
                />
                <MathFormula
                  block
                  math={`K_p = \\tan^2\\left(45^\\circ + \\frac{${inputs.phi}^\\circ}{2}\\right) = ${res.kp}`}
                />
              </div>
              <div className="app-surface-subtle rounded-lg p-3 space-y-1">
                <h3 className="text-xs font-semibold app-text-muted">2. 土圧強度・合力・作用高さ</h3>
                <MathFormula
                  block
                  math={`p_a(H) = (${inputs.q} + ${inputs.gamma}\\times${inputs.height})K_a - 2(${inputs.c})\\sqrt{K_a} = ${res.paBottom}\\text{ kPa}`}
                />
                <MathFormula
                  block
                  math={
                    res.activeForceHeight !== null
                      ? `P_a = ${res.totalActiveForce}\\text{ kN/m}\\ (y_a = ${res.activeForceHeight}\\text{ m})`
                      : `P_a = 0\\text{ kN/m}\\ (z_{0,\\text{th}} = ${res.theoreticalTensionCrackDepth}\\text{ m} \\ge H)`
                  }
                />
                <MathFormula
                  block
                  math={`P_p = ${res.totalPassiveForce}\\text{ kN/m}\\ (y_p = ${res.passiveForceHeight}\\text{ m})`}
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      <ChapterExercisePanel
        chapterTitle="ランキン土圧（主働・受働土圧）"
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

export default RankineEarthModule;
