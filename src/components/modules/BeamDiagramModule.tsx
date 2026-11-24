import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';
import { calculateSimplySupportedBeam, type BeamInputs } from '../../utils/civilPhysics';
import { buildRoutePath, isPlainLeftClick } from '../../utils/router';
import { SliderInput } from '../SliderInput';
import { MathFormula } from '../MathFormula';

const DEFAULT_BEAM: BeamInputs = {
  span: 6,
  pointLoad: 20,
  loadPos: 3,
  udl: 4,
};

interface BeamDiagramModuleProps {
  isCompleted: boolean;
  onToggleUnitComplete: () => void;
  onBackToPortal: () => void;
}

export const BeamDiagramModule: React.FC<BeamDiagramModuleProps> = ({
  isCompleted,
  onToggleUnitComplete,
  onBackToPortal,
}) => {
  const [inputs, setInputs] = useState<BeamInputs>(DEFAULT_BEAM);
  const res = useMemo(() => calculateSimplySupportedBeam(inputs), [inputs]);

  const svgW = 560;
  const xStart = 50;
  const xEnd = 510;
  const plotW = xEnd - xStart;

  const toX = (x: number) => xStart + (x / inputs.span) * plotW;

  const maxV = Math.max(res.maxShear, 1);
  const sfdZeroY = 145;
  const sfdScale = 45 / maxV;

  const maxM = Math.max(res.maxMoment, 1);
  const bmdZeroY = 235;
  const bmdScale = 65 / maxM;

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
            <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2.5 flex items-center justify-between">
              <h2 className="text-sm font-semibold">構造モデル・SFD・BMD（下側引張正）</h2>
              <span className="text-xs font-mono-num font-bold text-blue-700 dark:text-blue-300">
                M_max = {res.maxMoment} kN·m (x = {res.maxMomentPos} m)
              </span>
            </div>

            <svg
              viewBox={`0 0 ${svgW} 325`}
              className="w-full h-auto block select-none"
              role="img"
              aria-label="単純梁のせん断力図と曲げモーメント図"
            >
              {/* 梁本体 */}
              <line x1={xStart} y1="60" x2={xEnd} y2="60" stroke="currentColor" strokeWidth="4" />
              {/* ピン・ローラー支点 */}
              <polygon
                points={`${xStart},62 ${xStart - 10},78 ${xStart + 10},78`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <polygon
                points={`${xEnd},62 ${xEnd - 10},78 ${xEnd + 10},78`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              {/* 集中荷重 */}
              {inputs.pointLoad > 0 && (
                <>
                  <line
                    x1={toX(inputs.loadPos)}
                    y1="20"
                    x2={toX(inputs.loadPos)}
                    y2="56"
                    stroke="var(--diagram-red)"
                    strokeWidth="2.5"
                  />
                  <text
                    x={toX(inputs.loadPos)}
                    y="15"
                    textAnchor="middle"
                    className="text-xs font-bold fill-[var(--diagram-red)] font-mono-num"
                  >
                    P = {inputs.pointLoad} kN
                  </text>
                </>
              )}

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
            </svg>
          </div>

          <section className="app-surface rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold">支点反力と最大曲げモーメント</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="app-surface-subtle rounded-lg p-3">
                <MathFormula
                  block
                  math={`R_A = \\frac{P(L-a)}{L} + \\frac{wL}{2} = ${res.ra}\\text{ kN}`}
                />
                <MathFormula
                  block
                  math={`R_B = \\frac{Pa}{L} + \\frac{wL}{2} = ${res.rb}\\text{ kN}`}
                />
              </div>
              <div className="app-surface-subtle rounded-lg p-3">
                <MathFormula
                  block
                  math={`M_{\\max} = ${res.maxMoment}\\text{ kN}\\cdot\\text{m}\\quad (x = ${res.maxMomentPos}\\text{ m})`}
                />
                <MathFormula block math={`|V|_{\\max} = ${res.maxShear}\\text{ kN}`} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default BeamDiagramModule;
