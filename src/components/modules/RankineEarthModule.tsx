import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';
import {
  calculateRankineEarthPressure,
  type RankineInputs,
} from '../../utils/civilPhysics';
import { SliderInput } from '../SliderInput';
import { MathFormula } from '../MathFormula';

const DEFAULT_RANKINE: RankineInputs = {
  height: 5,
  gamma: 18,
  phi: 30,
  c: 0,
  q: 10,
};

interface RankineEarthModuleProps {
  isCompleted: boolean;
  onToggleUnitComplete: () => void;
  onBackToPortal: () => void;
}

export const RankineEarthModule: React.FC<RankineEarthModuleProps> = ({
  isCompleted,
  onToggleUnitComplete,
  onBackToPortal,
}) => {
  const [inputs, setInputs] = useState<RankineInputs>(DEFAULT_RANKINE);
  const res = useMemo(() => calculateRankineEarthPressure(inputs), [inputs]);

  const maxP = Math.max(res.paBottom, 20);
  const scaleW = 140 / maxP;
  const wallTopY = 55;
  const wallBotY = 235;
  const wallHpx = wallBotY - wallTopY;
  const z0Px = (res.tensionCrackDepth / inputs.height) * wallHpx;
  const topWidth = Math.max(0, res.paTop) * scaleW;
  const botWidth = Math.max(0, res.paBottom) * scaleW;

  return (
    <div className="space-y-6">
      <div className="app-surface rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBackToPortal}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            ポータル一覧に戻る
          </button>
          <h1 id="main-content" tabIndex={-1} className="portal-h1 font-bold">
            土質力学｜ランキン土圧（主働・受働土圧）
          </h1>
          <p className="text-xs sm:text-sm app-text-muted">
            擁壁背面に作用する主働土圧係数 Ka・受働土圧係数 Kp・引張亀裂深さ・合力をリアルタイム計算します。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setInputs(DEFAULT_RANKINE)}
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
                ? 'bg-emerald-600 text-white border-emerald-700'
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
            <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2.5 flex items-center justify-between">
              <h2 className="text-sm font-semibold">主働土圧分布図（鉛直背面壁）</h2>
              <span className="text-xs font-mono-num font-bold text-blue-700 dark:text-blue-300">
                合力 Pa = {res.totalActiveForce} kN/m
              </span>
            </div>

            <svg
              viewBox="0 0 540 280"
              className="w-full h-auto block select-none"
              role="img"
              aria-label="擁壁背面のランキン主働土圧分布図"
            >
              {/* 地盤面 */}
              <line
                x1="150"
                y1={wallTopY}
                x2="480"
                y2={wallTopY}
                stroke="currentColor"
                strokeOpacity="0.6"
                strokeWidth="2"
              />
              {/* 上載荷重矢印 */}
              {inputs.q > 0 &&
                [210, 260, 310, 360].map((x) => (
                  <line
                    key={x}
                    x1={x}
                    y1="26"
                    x2={x}
                    y2={wallTopY - 4}
                    stroke="#d97706"
                    strokeWidth="2"
                  />
                ))}
              {inputs.q > 0 && (
                <text
                  x="285"
                  y="20"
                  textAnchor="middle"
                  className="text-xs font-semibold fill-amber-700 dark:fill-amber-300 font-mono-num"
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

              {/* 引張亀裂深さ z0 */}
              {res.tensionCrackDepth > 0 && (
                <>
                  <line
                    x1="150"
                    y1={wallTopY + z0Px}
                    x2="260"
                    y2={wallTopY + z0Px}
                    stroke="#ef4444"
                    strokeDasharray="4 3"
                    strokeWidth="1.5"
                  />
                  <text
                    x="265"
                    y={wallTopY + z0Px + 4}
                    className="text-[11px] font-semibold fill-red-600 dark:fill-red-400 font-mono-num"
                  >
                    引張亀裂 z₀ = {res.tensionCrackDepth} m
                  </text>
                </>
              )}

              {/* 土圧分布（正圧領域） */}
              <polygon
                points={`150,${wallTopY + z0Px} ${150 + topWidth},${wallTopY + z0Px} ${
                  150 + botWidth
                },${wallBotY} 150,${wallBotY}`}
                fill="rgba(37, 99, 235, 0.18)"
                stroke="#2563eb"
                strokeWidth="2"
              />

              <text
                x={158 + botWidth}
                y={wallBotY - 4}
                className="text-xs font-bold fill-blue-700 dark:fill-blue-300 font-mono-num"
              >
                pₐ(H) = {res.paBottom} kPa
              </text>
              <text
                x="62"
                y={(wallTopY + wallBotY) / 2}
                textAnchor="middle"
                className="text-xs font-semibold fill-current font-mono-num"
              >
                H = {inputs.height} m
              </text>
            </svg>
          </div>

          <section className="app-surface rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold">ランキン土圧の計算式と結果</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="app-surface-subtle rounded-lg p-3">
                <MathFormula
                  block
                  math={`K_a = \\tan^2\\left(45^\\circ - \\frac{${inputs.phi}^\\circ}{2}\\right) = ${res.ka}`}
                />
                <MathFormula
                  block
                  math={`K_p = \\tan^2\\left(45^\\circ + \\frac{${inputs.phi}^\\circ}{2}\\right) = ${res.kp}`}
                />
              </div>
              <div className="app-surface-subtle rounded-lg p-3">
                <MathFormula
                  block
                  math={`p_a(H) = (${inputs.q} + ${inputs.gamma}\\times${inputs.height})K_a - 2(${inputs.c})\\sqrt{K_a} = ${res.paBottom}\\text{ kPa}`}
                />
                <MathFormula
                  block
                  math={`P_a = ${res.totalActiveForce}\\text{ kN/m},\\quad P_p = ${res.totalPassiveForce}\\text{ kN/m}`}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RankineEarthModule;
