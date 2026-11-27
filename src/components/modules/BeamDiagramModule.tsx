import React, { useEffect, useId, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronDown, RotateCcw } from 'lucide-react';
import { calculateSimplySupportedBeam, type BeamInputs } from '../../utils/civilPhysics';
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

const UNIT_PATH = buildRoutePath('beam-sfd-bmd');

const DEFAULT_BEAM: BeamInputs = {
  span: 6,
  pointLoad: 20,
  loadPos: 3,
  udl: 4,
};

const BEAM_PRESETS: { label: string; inputs: BeamInputs }[] = [
  { label: '中央集中荷重のみ', inputs: { span: 6, pointLoad: 20, loadPos: 3, udl: 0 } },
  { label: '等分布荷重のみ', inputs: { span: 6, pointLoad: 0, loadPos: 3, udl: 10 } },
  { label: '偏心載荷＋等分布', inputs: { span: 8, pointLoad: 30, loadPos: 2, udl: 5 } },
];

function parseInitialBeamInputs(): BeamInputs {
  try {
    const num = (key: string, fallback: number) => {
      const val = getSearchParamFromLocation(key);
      if (val === null) return fallback;
      const parsed = Number(val);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const span = Math.max(2, Math.min(12, num('L', DEFAULT_BEAM.span)));
    return {
      span,
      pointLoad: Math.max(0, Math.min(100, num('P', DEFAULT_BEAM.pointLoad))),
      loadPos: Math.max(0, Math.min(span, num('a', DEFAULT_BEAM.loadPos))),
      udl: Math.max(0, Math.min(30, num('w', DEFAULT_BEAM.udl))),
    };
  } catch {
    return DEFAULT_BEAM;
  }
}

interface BeamDiagramModuleProps {
  isCompleted: boolean;
  onToggleUnitComplete: () => void;
  completedExerciseIds: string[];
  onToggleExerciseDone: (id: string) => void;
  onMarkExerciseDone: (id: string) => void;
  onBackToPortal: () => void;
}

export const BeamDiagramModule: React.FC<BeamDiagramModuleProps> = ({
  isCompleted,
  onToggleUnitComplete,
  completedExerciseIds,
  onToggleExerciseDone,
  onMarkExerciseDone,
  onBackToPortal,
}) => {
  const [inputs, setInputs] = useState<BeamInputs>(() => parseInitialBeamInputs());
  const res = useMemo(() => calculateSimplySupportedBeam(inputs), [inputs]);
  const svgUid = useId();
  const arrowRedId = `${svgUid}-arrow-red`;
  const arrowAmberId = `${svgUid}-arrow-amber`;
  const arrowEmeraldId = `${svgUid}-arrow-emerald`;

  useEffect(() => {
    if (normalizePathname(window.location.pathname) !== UNIT_PATH) {
      return;
    }
    const isDefault =
      inputs.span === DEFAULT_BEAM.span &&
      inputs.pointLoad === DEFAULT_BEAM.pointLoad &&
      inputs.loadPos === DEFAULT_BEAM.loadPos &&
      inputs.udl === DEFAULT_BEAM.udl;
    if (isDefault) {
      if (window.location.pathname + window.location.search !== UNIT_PATH) {
        window.history.replaceState(null, '', UNIT_PATH);
      }
      return;
    }
    const params = new URLSearchParams({
      L: String(inputs.span),
      P: String(inputs.pointLoad),
      a: String(inputs.loadPos),
      w: String(inputs.udl),
    });
    const nextUrl = `${UNIT_PATH}?${params.toString()}`;
    if (window.location.pathname + window.location.search !== nextUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [inputs]);

  const applyPresetAndScroll = (preset: BeamInputs) => {
    setInputs(preset);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exercises = useMemo<ContinuumExercise[]>(
    () => [
      {
        id: 'beam-q1',
        category: '集中荷重の基本',
        title: '問1：中央集中荷重を受ける単純梁の最大曲げモーメント',
        statement:
          'スパン L = 6 m の単純梁の中央（a = 3 m）に集中荷重 P = 40 kN（等分布荷重 w = 0）が作用している。最大曲げモーメント M_max（kN·m）を求めよ。',
        kind: 'numeric',
        expectedValue: 60,
        tolerance: 0.5,
        unit: 'kN·m',
        inputHint: '例: 60',
        hint: '対称載荷なので支点反力は R_A = R_B = P/2 となり、中央断面での曲げモーメントは M_max = PL/4 です。',
        steps: [
          {
            label: '支点反力を求める',
            math: 'R_A = R_B = \\frac{P}{2} = \\frac{40}{2} = 20\\text{ kN}',
          },
          {
            label: '中央断面 x = 3 m の曲げモーメントを計算する',
            math: 'M_{\\max} = R_A \\cdot \\frac{L}{2} = \\frac{PL}{4} = \\frac{40 \\times 6}{4} = 60\\text{ kN}\\cdot\\text{m}',
          },
        ],
        answerSummary: 'M_max = 60 kN·m',
        onApplyPreset: () => applyPresetAndScroll({ span: 6, pointLoad: 40, loadPos: 3, udl: 0 }),
      },
      {
        id: 'beam-q2',
        category: '等分布荷重',
        title: '問2：全スパン等分布荷重を受ける単純梁の最大曲げモーメント',
        statement:
          'スパン L = 8 m の単純梁に全スパン等分布荷重 w = 6 kN/m（集中荷重 P = 0）が作用している。最大曲げモーメント M_max（kN·m）を求めよ。',
        kind: 'numeric',
        expectedValue: 48,
        tolerance: 0.5,
        unit: 'kN·m',
        inputHint: '例: 48',
        hint: '等分布荷重のみの単純梁では中央（x = L/2）で V = 0 となり、M_max = wL²/8 となります。',
        steps: [
          {
            label: '支点反力を求める',
            math: 'R_A = R_B = \\frac{wL}{2} = \\frac{6 \\times 8}{2} = 24\\text{ kN}',
          },
          {
            label: '中央断面 x = 4 m の曲げモーメントを求める',
            math: 'M_{\\max} = \\frac{wL^2}{8} = \\frac{6 \\times 8^2}{8} = 48\\text{ kN}\\cdot\\text{m}',
          },
        ],
        answerSummary: 'M_max = 48 kN·m',
        onApplyPreset: () => applyPresetAndScroll({ span: 8, pointLoad: 0, loadPos: 4, udl: 6 }),
      },
      {
        id: 'beam-q3',
        category: '複合荷重・支点反力',
        title: '問3：偏心集中荷重と等分布荷重が同時作用するときの左支点反力',
        statement:
          'スパン L = 6 m の単純梁において、左端から a = 2 m の位置に集中荷重 P = 30 kN、全スパンに等分布荷重 w = 4 kN/m が同時に作用している。左支点反力 R_A（kN）を求めよ。',
        kind: 'numeric',
        expectedValue: 32,
        tolerance: 0.2,
        unit: 'kN',
        inputHint: '例: 32',
        hint: '右支点 B まわりのモーメントのつり合い ΣM_B = 0 から R_A = P(L−a)/L + wL/2 を計算します。',
        steps: [
          {
            label: '支点 B まわりのモーメントのつり合い式を立てる',
            math: 'R_A \\cdot L - P(L - a) - wL \\cdot \\frac{L}{2} = 0',
          },
          {
            label: '数値を代入して R_A を求める',
            math: 'R_A = \\frac{30 \\times (6 - 2)}{6} + \\frac{4 \\times 6}{2} = 20 + 12 = 32\\text{ kN}',
          },
        ],
        answerSummary: 'R_A = 32 kN',
        onApplyPreset: () => applyPresetAndScroll({ span: 6, pointLoad: 30, loadPos: 2, udl: 4 }),
      },
    ],
    []
  );

  const svgW = 560;
  const xStart = 60;
  const xEnd = 500;
  const plotW = xEnd - xStart;

  const toX = (x: number) => xStart + (x / inputs.span) * plotW;

  const beamY = 82;
  const maxV = Math.max(res.maxShear, 1);
  const sfdZeroY = 196;
  const sfdScale = 44 / maxV;

  const maxM = Math.max(res.maxMoment, 1);
  const bmdZeroY = 286;
  const bmdScale = 64 / maxM;

  const sfdPoints = [
    `${xStart},${sfdZeroY}`,
    ...res.samples.map((s) => `${toX(s.x)},${sfdZeroY - s.v * sfdScale}`),
    `${xEnd},${sfdZeroY}`,
  ].join(' ');

  const bmdPoints = [
    `${xStart},${bmdZeroY}`,
    ...res.samples.map((s) => `${toX(s.x)},${bmdZeroY + s.m * bmdScale}`),
    `${xEnd},${bmdZeroY}`,
  ].join(' ');

  const udlArrowCount = 9;
  const udlArrows = Array.from({ length: udlArrowCount }, (_, i) =>
    xStart + (plotW * i) / (udlArrowCount - 1)
  );
  const loadX = toX(inputs.loadPos);
  const maxMomentX = toX(res.maxMomentPos);
  const maxMomentY = bmdZeroY + res.maxMoment * bmdScale;

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
            構造力学｜単純梁の SFD・BMD 解析
          </h1>
          <p className="text-xs sm:text-sm app-text-muted">
            集中荷重 P と等分布荷重 w が同時に作用する単純梁の支点反力、せん断力図 (SFD)、曲げモーメント図 (BMD) を描画します。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CopyShareButton getTextToCopy={() => window.location.href} />
          <button
            type="button"
            onClick={() => setInputs(DEFAULT_BEAM)}
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
            スパン・荷重条件
          </h2>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold app-text-muted">典型ケース（ワンクリック読込）</p>
            <div className="flex flex-wrap gap-1.5">
              {BEAM_PRESETS.map((preset) => (
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
            label="スパン長"
            symbol="L"
            unit="m"
            value={inputs.span}
            min={2}
            max={12}
            step={0.5}
            onChange={(v) =>
              setInputs((p) => ({
                ...p,
                span: v,
                loadPos: Math.min(p.loadPos, v),
              }))
            }
          />
          <SliderInput
            label="集中荷重"
            symbol="P"
            unit="kN"
            value={inputs.pointLoad}
            min={0}
            max={100}
            step={5}
            onChange={(v) => setInputs((p) => ({ ...p, pointLoad: v }))}
          />
          <SliderInput
            label="集中荷重位置"
            symbol="a"
            unit="m"
            value={inputs.loadPos}
            min={0}
            max={inputs.span}
            step={0.5}
            onChange={(v) => setInputs((p) => ({ ...p, loadPos: v }))}
          />
          <SliderInput
            label="等分布荷重"
            symbol="w"
            unit="kN/m"
            value={inputs.udl}
            min={0}
            max={30}
            step={1}
            onChange={(v) => setInputs((p) => ({ ...p, udl: v }))}
          />
        </aside>

        <div className="lg:col-span-8 space-y-6">
          <div className="app-surface rounded-xl overflow-hidden">
            <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">構造モデル・SFD・BMD（下側引張正）</h2>
              <span className="text-xs font-mono-num font-bold text-blue-700 dark:text-blue-300">
                M_max = {res.maxMoment} kN·m (x = {res.maxMomentPos} m)
              </span>
            </div>

            <svg
              viewBox={`0 0 ${svgW} 388`}
              className="w-full h-auto block select-none"
              role="img"
              aria-label={`スパン ${inputs.span} m の単純梁における構造モデル・SFD・BMD。RA=${res.ra} kN、RB=${res.rb} kN、最大曲げモーメント M_max=${res.maxMoment} kN·m（x=${res.maxMomentPos} m）。`}
            >
              <defs>
                <marker
                  id={arrowRedId}
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
                  id={arrowEmeraldId}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--diagram-emerald)" />
                </marker>
              </defs>

              {/* 鉛直補助線（集中荷重位置・最大モーメント位置） */}
              {inputs.pointLoad > 0 && (
                <line
                  x1={loadX}
                  y1={beamY + 4}
                  x2={loadX}
                  y2="365"
                  stroke="var(--diagram-red)"
                  strokeOpacity="0.28"
                  strokeDasharray="4 3"
                  strokeWidth="1"
                />
              )}
              {res.maxMoment > 0 && Math.abs(maxMomentX - loadX) > 2 && (
                <line
                  x1={maxMomentX}
                  y1={sfdZeroY - 40}
                  x2={maxMomentX}
                  y2="365"
                  stroke="var(--diagram-blue)"
                  strokeOpacity="0.35"
                  strokeDasharray="4 3"
                  strokeWidth="1"
                />
              )}

              {/* 等分布荷重 w */}
              {inputs.udl > 0 && (
                <g>
                  <rect
                    x={xStart}
                    y={beamY - 26}
                    width={plotW}
                    height="24"
                    fill="var(--diagram-amber)"
                    fillOpacity="0.1"
                  />
                  <line
                    x1={xStart}
                    y1={beamY - 26}
                    x2={xEnd}
                    y2={beamY - 26}
                    stroke="var(--diagram-amber)"
                    strokeWidth="1.5"
                  />
                  {udlArrows.map((ax) => (
                    <line
                      key={ax}
                      x1={ax}
                      y1={beamY - 26}
                      x2={ax}
                      y2={beamY - 5}
                      stroke="var(--diagram-amber)"
                      strokeWidth="1.4"
                      markerEnd={`url(#${arrowAmberId})`}
                    />
                  ))}
                  <text
                    x={xEnd - 4}
                    y={beamY - 31}
                    textAnchor="end"
                    className="text-[11px] font-bold fill-[var(--diagram-amber)] font-mono-num"
                  >
                    w = {inputs.udl} kN/m
                  </text>
                </g>
              )}

              {/* 集中荷重 P */}
              {inputs.pointLoad > 0 && (
                <g>
                  <line
                    x1={loadX}
                    y1="22"
                    x2={loadX}
                    y2={beamY - 5}
                    stroke="var(--diagram-red)"
                    strokeWidth="2.5"
                    markerEnd={`url(#${arrowRedId})`}
                  />
                  <text
                    x={Math.max(xStart + 36, Math.min(xEnd - 36, loadX))}
                    y="16"
                    textAnchor="middle"
                    className="text-xs font-bold fill-[var(--diagram-red)] font-mono-num"
                  >
                    P = {inputs.pointLoad} kN (a = {inputs.loadPos} m)
                  </text>
                </g>
              )}

              {/* 梁本体 */}
              <line x1={xStart} y1={beamY} x2={xEnd} y2={beamY} stroke="currentColor" strokeWidth="4" />

              {/* 左：ピン支点 A */}
              <polygon
                points={`${xStart},${beamY + 2} ${xStart - 10},${beamY + 18} ${xStart + 10},${beamY + 18}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <line
                x1={xStart - 14}
                y1={beamY + 18}
                x2={xStart + 14}
                y2={beamY + 18}
                stroke="currentColor"
                strokeWidth="2"
              />

              {/* 右：ローラー支点 B */}
              <polygon
                points={`${xEnd},${beamY + 2} ${xEnd - 10},${beamY + 15} ${xEnd + 10},${beamY + 15}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx={xEnd - 5} cy={beamY + 18.5} r="2.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx={xEnd + 5} cy={beamY + 18.5} r="2.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <line
                x1={xEnd - 14}
                y1={beamY + 22}
                x2={xEnd + 14}
                y2={beamY + 22}
                stroke="currentColor"
                strokeWidth="2"
              />

              {/* 支点反力ベクトル RA, RB */}
              <line
                x1={xStart}
                y1={beamY + 42}
                x2={xStart}
                y2={beamY + 23}
                stroke="var(--diagram-emerald)"
                strokeWidth="2"
                markerEnd={`url(#${arrowEmeraldId})`}
              />
              <text
                x={xStart}
                y={beamY + 54}
                textAnchor="middle"
                className="text-[11px] font-bold fill-[var(--diagram-emerald)] font-mono-num"
              >
                RA = {res.ra} kN
              </text>

              <line
                x1={xEnd}
                y1={beamY + 42}
                x2={xEnd}
                y2={beamY + 25}
                stroke="var(--diagram-emerald)"
                strokeWidth="2"
                markerEnd={`url(#${arrowEmeraldId})`}
              />
              <text
                x={xEnd}
                y={beamY + 54}
                textAnchor="middle"
                className="text-[11px] font-bold fill-[var(--diagram-emerald)] font-mono-num"
              >
                RB = {res.rb} kN
              </text>

              <text
                x={(xStart + xEnd) / 2}
                y={beamY + 20}
                textAnchor="middle"
                className="text-[11px] font-semibold fill-[var(--diagram-muted)] font-mono-num"
              >
                L = {inputs.span} m
              </text>

              {/* SFD */}
              <line
                x1={xStart}
                y1={sfdZeroY}
                x2={xEnd}
                y2={sfdZeroY}
                stroke="currentColor"
                strokeOpacity="0.6"
                strokeWidth="1"
              />
              <polygon
                points={sfdPoints}
                fill="var(--diagram-teal-fill)"
                stroke="var(--diagram-teal)"
                strokeWidth="2"
              />
              <text x="12" y={sfdZeroY + 4} className="text-xs font-bold fill-[var(--diagram-teal)]">
                SFD
              </text>
              {res.ra > 0 && (
                <text
                  x={xStart + 4}
                  y={sfdZeroY - res.ra * sfdScale - 5}
                  className="text-[11px] font-bold fill-[var(--diagram-teal)] font-mono-num"
                >
                  +{res.ra}
                </text>
              )}
              {res.rb > 0 && (
                <text
                  x={xEnd - 4}
                  y={sfdZeroY + res.rb * sfdScale + 13}
                  textAnchor="end"
                  className="text-[11px] font-bold fill-[var(--diagram-teal)] font-mono-num"
                >
                  −{res.rb}
                </text>
              )}

              {/* BMD */}
              <line
                x1={xStart}
                y1={bmdZeroY}
                x2={xEnd}
                y2={bmdZeroY}
                stroke="currentColor"
                strokeOpacity="0.6"
                strokeWidth="1"
              />
              <polygon
                points={bmdPoints}
                fill="var(--diagram-blue-fill)"
                stroke="var(--diagram-blue)"
                strokeWidth="2"
              />
              <text x="12" y={bmdZeroY + 4} className="text-xs font-bold fill-[var(--diagram-blue)]">
                BMD
              </text>
              {res.maxMoment > 0 && (
                <g>
                  <circle cx={maxMomentX} cy={maxMomentY} r="3.5" fill="var(--diagram-blue)" />
                  <text
                    x={Math.max(xStart + 58, Math.min(xEnd - 58, maxMomentX))}
                    y={maxMomentY + 15}
                    textAnchor="middle"
                    className="text-[11px] font-bold fill-[var(--diagram-blue)] font-mono-num"
                  >
                    M_max = {res.maxMoment} kN·m (x = {res.maxMomentPos} m)
                  </text>
                </g>
              )}
            </svg>

            <details className="border-t border-[var(--border-subtle)] px-4 py-2 text-xs group">
              <summary className="diagram-summary flex items-center justify-between cursor-pointer font-semibold app-text-muted py-1 list-none">
                <span>図解の数値サマリー（スクリーンリーダー・検算用）</span>
                <ChevronDown className="h-3.5 w-3.5 transition-transform duration-150 group-open:rotate-180" aria-hidden="true" />
              </summary>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 pb-1 font-mono-num">
                <div><dt className="app-text-muted">左支点反力 R_A</dt><dd className="font-bold">{res.ra} kN</dd></div>
                <div><dt className="app-text-muted">右支点反力 R_B</dt><dd className="font-bold">{res.rb} kN</dd></div>
                <div><dt className="app-text-muted">最大せん断力 |V|_max</dt><dd className="font-bold">{res.maxShear} kN</dd></div>
                <div><dt className="app-text-muted">載荷点直前 V(a⁻)</dt><dd className="font-bold">{res.shearAtLoadLeft} kN</dd></div>
                <div><dt className="app-text-muted">載荷点直後 V(a⁺)</dt><dd className="font-bold">{res.shearAtLoadRight} kN</dd></div>
                <div><dt className="app-text-muted">最大モーメント M_max</dt><dd className="font-bold">{res.maxMoment} kN·m (x={res.maxMomentPos}m)</dd></div>
              </dl>
            </details>
          </div>

          <section className="app-surface rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold">途中計算ステップ（リアルタイム検算）</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="app-surface-subtle rounded-lg p-3 space-y-1">
                <h3 className="text-xs font-semibold app-text-muted">1. モーメントのつり合いと支点反力</h3>
                <MathFormula
                  block
                  math={`R_A = \\frac{P(L-a)}{L} + \\frac{wL}{2} = \\frac{${inputs.pointLoad}(${inputs.span}-${inputs.loadPos})}{${inputs.span}} + \\frac{${inputs.udl}\\times${inputs.span}}{2} = ${res.ra}\\text{ kN}`}
                />
                <MathFormula
                  block
                  math={`R_B = \\frac{Pa}{L} + \\frac{wL}{2} = \\frac{${inputs.pointLoad}\\times${inputs.loadPos}}{${inputs.span}} + \\frac{${inputs.udl}\\times${inputs.span}}{2} = ${res.rb}\\text{ kN}`}
                />
              </div>
              <div className="app-surface-subtle rounded-lg p-3 space-y-1">
                <h3 className="text-xs font-semibold app-text-muted">2. せん断力段差と最大曲げモーメント</h3>
                <MathFormula
                  block
                  math={`V(a^-) = ${res.shearAtLoadLeft}\\text{ kN},\\quad V(a^+) = ${res.shearAtLoadRight}\\text{ kN}`}
                />
                <MathFormula
                  block
                  math={`M_{\\max} = ${res.maxMoment}\\text{ kN}\\cdot\\text{m}\\quad (x = ${res.maxMomentPos}\\text{ m}),\\quad |V|_{\\max} = ${res.maxShear}\\text{ kN}`}
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      <ChapterExercisePanel
        chapterTitle="単純梁の SFD・BMD 解析"
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

export default BeamDiagramModule;
