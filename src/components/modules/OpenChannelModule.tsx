import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';
import { calculateOpenChannelFlow, type ChannelInputs } from '../../utils/civilPhysics';
import { buildRoutePath, isPlainLeftClick } from '../../utils/router';
import { SliderInput } from '../SliderInput';
import { MathFormula } from '../MathFormula';

const DEFAULT_CHANNEL: ChannelInputs = {
  bottomWidth: 2.0,
  depth: 1.0,
  sideSlope: 1.0,
  slopeRatio: 0.001,
  roughness: 0.015,
};

interface OpenChannelModuleProps {
  isCompleted: boolean;
  onToggleUnitComplete: () => void;
  onBackToPortal: () => void;
}

export const OpenChannelModule: React.FC<OpenChannelModuleProps> = ({
  isCompleted,
  onToggleUnitComplete,
  onBackToPortal,
}) => {
  const [inputs, setInputs] = useState<ChannelInputs>(DEFAULT_CHANNEL);
  const res = useMemo(() => calculateOpenChannelFlow(inputs), [inputs]);

  const svgW = 480;
  const svgH = 250;
  const cx = svgW / 2;
  const bottomY = 200;
  const maxDrawW = svgW - 64; // 左右 32px 余白
  const maxDrawH = 148; // 上部ラベル用の余白を確保

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
              {/* 水深・断面積ラベル（浅水深時は底線との重なりを回避） */}
              <text
                x={cx}
                y={labelFitsInsideWater ? bottomY - hPx / 2 + 4 : bottomY + 40}
                textAnchor="middle"
                className="text-xs font-bold fill-[var(--diagram-blue)] font-mono-num"
              >
                h = {inputs.depth} m (A = {res.area} m²)
              </text>
            </svg>
          </div>

          <section className="app-surface rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold">マニングの公式と流況計算</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="app-surface-subtle rounded-lg p-3">
                <MathFormula
                  block
                  math={`R = \\frac{A}{P} = \\frac{${res.area}}{${res.wettedPerimeter}} = ${res.hydraulicRadius}\\text{ m}`}
                />
                <MathFormula
                  block
                  math={`v = \\frac{1}{n}R^{2/3}I^{1/2} = ${res.velocity}\\text{ m/s}`}
                />
              </div>
              <div className="app-surface-subtle rounded-lg p-3">
                <MathFormula
                  block
                  math={`Q = A \\cdot v = ${res.area} \\times ${res.velocity} = ${res.discharge}\\text{ m}^3/\\text{s}`}
                />
                <MathFormula
                  block
                  math={`Fr = \\frac{v}{\\sqrt{g(A/T)}} = ${res.froudeNumber}`}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default OpenChannelModule;
