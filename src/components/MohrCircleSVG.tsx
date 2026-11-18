import React from 'react';
import { degToRad, type MohrInputs, type MohrResult } from '../utils/mohrPhysics';

interface MohrCircleSVGProps {
  inputs: MohrInputs;
  result: MohrResult;
}

export const MohrCircleSVG: React.FC<MohrCircleSVGProps> = ({ inputs, result }) => {
  const width = 640;
  const height = 440;
  const padLeft = 56;
  const padRight = 28;
  const padTop = 28;
  const padBottom = 48;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxSigma = Math.max(inputs.sigma1, result.activeSigma1, 200) * 1.15;
  const minSigma = Math.min(0, inputs.sigma3, result.activeSigma3) - 20;
  const sigmaSpan = Math.max(maxSigma - minSigma, 100);

  const maxTauNeeded = Math.max(
    result.radius * 1.35,
    inputs.c + maxSigma * Math.tan(degToRad(inputs.phi)) * 0.5,
    80
  );
  const tauSpan = maxTauNeeded * 2;

  const scale = Math.min(plotW / sigmaSpan, plotH / tauSpan);

  const originX = padLeft - minSigma * scale;
  const originY = padTop + plotH / 2;

  const toX = (sigma: number) => originX + sigma * scale;
  const toY = (tau: number) => originY - tau * scale;

  const rawStep = sigmaSpan / 6;
  const niceStep =
    rawStep <= 20 ? 20 : rawStep <= 50 ? 50 : rawStep <= 100 ? 100 : 200;

  const minGridSigma = Math.floor(minSigma / niceStep) * niceStep;
  const maxGridSigma = Math.ceil((minSigma + plotW / scale) / niceStep) * niceStep;
  const sigmaTicks: number[] = [];
  for (let s = minGridSigma; s <= maxGridSigma; s += niceStep) {
    if (toX(s) >= padLeft - 5 && toX(s) <= width - padRight + 5) {
      sigmaTicks.push(s);
    }
  }

  const maxGridTau = Math.ceil((plotH / 2 / scale) / niceStep) * niceStep;
  const tauTicks: number[] = [];
  for (let t = -maxGridTau; t <= maxGridTau; t += niceStep) {
    if (toY(t) >= padTop - 5 && toY(t) <= height - padBottom + 5) {
      tauTicks.push(t);
    }
  }

  const phiRad = degToRad(inputs.phi);
  const envStartSigma = Math.max(minSigma, -inputs.c / Math.max(Math.tan(phiRad), 0.001));
  const envEndSigma = minSigma + plotW / scale;
  const envY1 = toY(inputs.c + envStartSigma * Math.tan(phiRad));
  const envY2 = toY(inputs.c + envEndSigma * Math.tan(phiRad));
  const envNegY1 = toY(-(inputs.c + envStartSigma * Math.tan(phiRad)));
  const envNegY2 = toY(-(inputs.c + envEndSigma * Math.tan(phiRad)));

  const activeCx = toX(result.activeCenter);
  const totalCx = toX(result.centerTotal);
  const rPx = result.radius * scale;

  const ptX = toX(result.activeSigmaTheta);
  const ptY = toY(result.tauTheta);

  const arcRadius = Math.min(34, Math.max(16, rPx * 0.35));
  const twoThetaRad = degToRad(2 * inputs.theta);
  const arcEndX = activeCx + arcRadius * Math.cos(twoThetaRad);
  const arcEndY = originY - arcRadius * Math.sin(twoThetaRad);
  const largeArcFlag = 2 * inputs.theta > 180 ? 1 : 0;

  const circleColor = result.isFailure ? 'var(--diagram-red)' : 'var(--diagram-blue)';
  const circleFill = result.isFailure ? 'var(--diagram-red-fill)' : 'var(--diagram-blue-fill)';

  return (
    <div className="app-surface relative w-full overflow-hidden rounded-xl shadow-sm">
      <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">
            モールの応力円（圧縮正・1:1 縮尺）
          </span>
          {inputs.useEffectiveStress && (
            <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
              有効応力モード (u = {inputs.u} kPa)
            </span>
          )}
        </div>
        {result.isFailure ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-0.5 text-xs font-bold text-red-700 dark:text-red-300 border border-red-500/40">
            <span className="h-2 w-2 rounded-full bg-[var(--diagram-red)]" aria-hidden="true" />
            破壊 (Failure)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <span className="h-2 w-2 rounded-full bg-[var(--diagram-emerald)]" aria-hidden="true" />
            安定 (Safe)
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto block select-none"
        role="img"
        aria-label="モールの応力円とモール・クーロンの破壊包絡線"
      >
        <defs>
          <clipPath id="mohr-plot-area">
            <rect x={padLeft} y={padTop} width={plotW} height={plotH} />
          </clipPath>
        </defs>

        {/* 背景グリッド */}
        <g stroke="currentColor" strokeOpacity="0.16" strokeWidth="1">
          {sigmaTicks.map((s) => (
            <line key={`gx-${s}`} x1={toX(s)} y1={padTop} x2={toX(s)} y2={height - padBottom} />
          ))}
          {tauTicks.map((t) => (
            <line key={`gy-${t}`} x1={padLeft} y1={toY(t)} x2={width - padRight} y2={toY(t)} />
          ))}
        </g>

        {/* 座標軸 */}
        <line
          x1={padLeft}
          y1={originY}
          x2={width - padRight}
          y2={originY}
          stroke="currentColor"
          strokeOpacity="0.72"
          strokeWidth="1.5"
        />
        {originX >= padLeft && originX <= width - padRight && (
          <line
            x1={originX}
            y1={padTop}
            x2={originX}
            y2={height - padBottom}
            stroke="currentColor"
            strokeOpacity="0.72"
            strokeWidth="1.5"
          />
        )}

        {/* 目盛りラベル */}
        <g className="text-[11px] fill-[var(--text-muted)] font-mono-num">
          {sigmaTicks.map((s) => (
            <text key={`tx-${s}`} x={toX(s)} y={originY + 16} textAnchor="middle">
              {s}
            </text>
          ))}
          {tauTicks
            .filter((t) => t !== 0)
            .map((t) => (
              <text
                key={`ty-${t}`}
                x={Math.max(padLeft - 8, originX - 8)}
                y={toY(t) + 4}
                textAnchor="end"
              >
                {t}
              </text>
            ))}
        </g>

        {/* 軸タイトル */}
        <text
          x={width - padRight}
          y={originY + 34}
          textAnchor="end"
          className="text-xs font-semibold fill-current"
        >
          σ (kPa) [圧縮正]
        </text>
        <text
          x={Math.max(padLeft + 6, originX + 8)}
          y={padTop + 14}
          textAnchor="start"
          className="text-xs font-semibold fill-current"
        >
          τ (kPa)
        </text>

        <g clipPath="url(#mohr-plot-area)">
          {/* 破壊包絡線 */}
          <line
            x1={toX(envStartSigma)}
            y1={envY1}
            x2={toX(envEndSigma)}
            y2={envY2}
            stroke="var(--diagram-amber)"
            strokeWidth="2"
          />
          <line
            x1={toX(envStartSigma)}
            y1={envNegY1}
            x2={toX(envEndSigma)}
            y2={envNegY2}
            stroke="var(--diagram-amber)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.75"
          />

          {/* 全応力円（有効応力モード時は破線比較） */}
          {inputs.useEffectiveStress && (
            <circle
              cx={totalCx}
              cy={originY}
              r={rPx}
              fill="none"
              stroke="var(--diagram-muted)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          )}

          {/* アクティブなモール円 */}
          <circle
            cx={activeCx}
            cy={originY}
            r={rPx}
            fill={circleFill}
            stroke={circleColor}
            strokeWidth="2.5"
          />

          {/* 2θ 角度弧 */}
          {inputs.theta > 0 && rPx > 10 && (
            <path
              d={`M ${activeCx + arcRadius} ${originY} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} 0 ${arcEndX} ${arcEndY}`}
              fill="none"
              stroke="var(--diagram-teal)"
              strokeWidth="2"
            />
          )}

          <line
            x1={activeCx}
            y1={originY}
            x2={ptX}
            y2={ptY}
            stroke="var(--diagram-teal)"
            strokeWidth="2"
          />

          <line
            x1={ptX}
            y1={ptY}
            x2={ptX}
            y2={originY}
            stroke="var(--diagram-teal)"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />

          <circle cx={activeCx} cy={originY} r="4" fill="currentColor" />
          <text
            x={activeCx}
            y={originY + 16}
            textAnchor="middle"
            className="text-xs font-bold fill-current"
          >
            {inputs.useEffectiveStress ? "C'" : 'C'}
          </text>

          <circle cx={toX(result.activeSigma3)} cy={originY} r="4" fill={circleColor} />
          <text
            x={toX(result.activeSigma3)}
            y={originY - 10}
            textAnchor="middle"
            className="text-xs font-semibold fill-current"
          >
            {inputs.useEffectiveStress ? "σ'₃" : 'σ₃'}
          </text>

          <circle cx={toX(result.activeSigma1)} cy={originY} r="4" fill={circleColor} />
          <text
            x={toX(result.activeSigma1)}
            y={originY - 10}
            textAnchor="middle"
            className="text-xs font-semibold fill-current"
          >
            {inputs.useEffectiveStress ? "σ'₁" : 'σ₁'}
          </text>

          <circle cx={ptX} cy={ptY} r="5.5" fill="var(--diagram-teal)" stroke="var(--diagram-halo)" strokeWidth="1.5" />
          <text
            x={ptX + 8}
            y={ptY - 8}
            className="text-xs font-bold fill-[var(--diagram-teal)] font-mono-num"
          >
            ({result.activeSigmaTheta}, {result.tauTheta})
          </text>

          {inputs.theta > 4 && rPx > 20 && (
            <text
              x={activeCx + (arcRadius + 14) * Math.cos(twoThetaRad / 2)}
              y={originY - (arcRadius + 14) * Math.sin(twoThetaRad / 2) + 4}
              textAnchor="middle"
              className="text-[11px] font-bold fill-[var(--diagram-teal)]"
            >
              2θ={2 * inputs.theta}°
            </text>
          )}
        </g>
      </svg>

      {/* 凡例 */}
      <div className="app-surface-subtle border-x-0 border-b-0 px-4 py-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs app-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-[var(--diagram-amber)] inline-block" aria-hidden="true" />
          破壊包絡線 (τ_f = c + σ tanφ)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`h-2.5 w-2.5 rounded-full border-2 inline-block ${
              result.isFailure
                ? 'border-[var(--diagram-red)] bg-[var(--diagram-red-fill)]'
                : 'border-[var(--diagram-blue)] bg-[var(--diagram-blue-fill)]'
            }`}
            aria-hidden="true"
          />
          {inputs.useEffectiveStress ? '有効応力円 (実線)' : '全応力円 (実線)'}
        </span>
        {inputs.useEffectiveStress && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t-2 border-dashed border-[var(--diagram-muted)] inline-block" aria-hidden="true" />
            全応力円 (破線)
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--diagram-teal)] inline-block" aria-hidden="true" />
          任意角の応力点 (2θ 回転)
        </span>
      </div>
    </div>
  );
};
