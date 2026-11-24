import React, { useCallback, useMemo } from 'react';
import { NLP_MODELS, round2, type NlpModelId } from '../../utils/mathProgramming';

interface NlpContourPlotProps {
  modelId: NlpModelId;
  theta: number;
  currentPoint?: [number, number];
  showGradientArrow?: boolean;
  trajectory?: [number, number][];
  activeStepIndex?: number;
  secondaryTrajectory?: [number, number][];
  secondaryIsDashed?: boolean;
  highlightOptimum?: [number, number];
  ariaLabel: string;
}

export const NlpContourPlot: React.FC<NlpContourPlotProps> = ({
  modelId,
  theta,
  currentPoint,
  showGradientArrow = false,
  trajectory,
  activeStepIndex,
  secondaryTrajectory,
  secondaryIsDashed = true,
  highlightOptimum,
  ariaLabel,
}) => {
  const model = NLP_MODELS[modelId];
  const [minX, minY] = model.domainMin;
  const [maxX, maxY] = model.domainMax;

  const w = 480;
  const h = 340;
  const padL = 46;
  const padR = 20;
  const padT = 18;
  const padB = 36;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const toPxX = useCallback(
    (x: number) => padL + ((x - minX) / (maxX - minX)) * plotW,
    [minX, maxX, plotW]
  );
  const toPxY = useCallback(
    (y: number) => padT + plotH - ((y - minY) / (maxY - minY)) * plotH,
    [minY, maxY, plotH]
  );

  // 背景グリッド＆等高線パスは modelId と theta が変わったときだけ再計算
  const { cells, contourPaths, cellW, cellH, minF, spanF } = useMemo(() => {
    const N = 34;
    const dx = (maxX - minX) / N;
    const dy = (maxY - minY) / N;
    const vals: number[][] = [];
    const flatVals: number[] = [];

    for (let iy = 0; iy <= N; iy++) {
      const row: number[] = [];
      const y = minY + iy * dy;
      for (let ix = 0; ix <= N; ix++) {
        const x = minX + ix * dx;
        const v = model.evaluate(x, y, theta);
        row.push(v);
        flatVals.push(v);
      }
      vals.push(row);
    }

    const sorted = [...flatVals].sort((a, b) => a - b);
    const fMin = sorted[0];
    // 境界付近の発散値（1/xなど）を88パーセンタイルでクリップして等高線のコントラストを確保
    const fClip = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.88))];
    const span = Math.max(1e-4, fClip - fMin);

    const cellList: { x: number; y: number; norm: number }[] = [];
    for (let iy = 0; iy < N; iy++) {
      for (let ix = 0; ix < N; ix++) {
        const xc = minX + (ix + 0.5) * dx;
        const yc = minY + (iy + 0.5) * dy;
        const vc = model.evaluate(xc, yc, theta);
        const norm = Math.max(0, Math.min(1, (vc - fMin) / span));
        cellList.push({
          x: padL + (ix / N) * plotW,
          y: padT + plotH - ((iy + 1) / N) * plotH,
          norm,
        });
      }
    }

    // 等高線レベル（最小点付近を密に見せるため2次スケール）
    const levels = [0.02, 0.06, 0.12, 0.22, 0.35, 0.52, 0.72, 0.92].map(
      (t) => fMin + span * t
    );

    const paths: string[] = [];
    for (const lv of levels) {
      let d = '';
      for (let iy = 0; iy < N; iy++) {
        for (let ix = 0; ix < N; ix++) {
          const v00 = vals[iy][ix];
          const v10 = vals[iy][ix + 1];
          const v11 = vals[iy + 1][ix + 1];
          const v01 = vals[iy + 1][ix];

          const pts: [number, number][] = [];
          const interp = (a: number, b: number, va: number, vb: number) =>
            a + ((lv - va) / (vb - va)) * (b - a);

          const x0 = minX + ix * dx;
          const x1 = minX + (ix + 1) * dx;
          const y0 = minY + iy * dy;
          const y1 = minY + (iy + 1) * dy;

          if ((v00 < lv) !== (v10 < lv)) pts.push([interp(x0, x1, v00, v10), y0]);
          if ((v10 < lv) !== (v11 < lv)) pts.push([x1, interp(y0, y1, v10, v11)]);
          if ((v01 < lv) !== (v11 < lv)) pts.push([interp(x0, x1, v01, v11), y1]);
          if ((v00 < lv) !== (v01 < lv)) pts.push([x0, interp(y0, y1, v00, v01)]);

          if (pts.length >= 2) {
            d += `M ${toPxX(pts[0][0]).toFixed(1)} ${toPxY(pts[0][1]).toFixed(1)} L ${toPxX(pts[1][0]).toFixed(1)} ${toPxY(pts[1][1]).toFixed(1)} `;
          }
          if (pts.length === 4) {
            d += `M ${toPxX(pts[2][0]).toFixed(1)} ${toPxY(pts[2][1]).toFixed(1)} L ${toPxX(pts[3][0]).toFixed(1)} ${toPxY(pts[3][1]).toFixed(1)} `;
          }
        }
      }
      if (d) paths.push(d);
    }

    return {
      cells: cellList,
      contourPaths: paths,
      cellW: plotW / N + 0.4,
      cellH: plotH / N + 0.4,
      minF: fMin,
      spanF: span,
    };
  }, [model, theta, minX, maxX, minY, maxY, plotW, plotH, toPxX, toPxY]);

  const xTicks = useMemo(() => {
    const arr: number[] = [];
    const step = maxX - minX > 5 ? 1 : 0.5;
    for (let v = Math.ceil(minX / step) * step; v <= maxX + 1e-6; v += step) {
      arr.push(round2(v));
    }
    return arr;
  }, [minX, maxX]);

  const yTicks = useMemo(() => {
    const arr: number[] = [];
    const step = maxY - minY > 5 ? 1 : 0.5;
    for (let v = Math.ceil(minY / step) * step; v <= maxY + 1e-6; v += step) {
      arr.push(round2(v));
    }
    return arr;
  }, [minY, maxY]);

  const gradArrow = useMemo(() => {
    if (!currentPoint || !showGradientArrow) return null;
    const g = model.gradient(currentPoint[0], currentPoint[1], theta);
    const norm = Math.hypot(g[0], g[1]);
    if (norm < 1e-6) return null;
    const lenPx = Math.min(44, Math.max(14, norm * 7));
    const px = toPxX(currentPoint[0]);
    const py = toPxY(currentPoint[1]);
    // 最急降下方向 (-∇f) と勾配方向 (+∇f)
    const ux = g[0] / norm;
    const uy = -g[1] / norm; // SVG y-down
    return {
      x1: px,
      y1: py,
      x2Grad: px + ux * lenPx,
      y2Grad: py + uy * lenPx,
      x2Desc: px - ux * lenPx,
      y2Desc: py - uy * lenPx,
    };
  }, [currentPoint, showGradientArrow, model, theta, toPxX, toPxY]);

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full max-w-[500px] h-auto select-none"
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <marker
            id={`nlp-arr-amber-${modelId}`}
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
            id={`nlp-arr-emerald-${modelId}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--diagram-emerald)" />
          </marker>
          <clipPath id={`nlp-clip-${modelId}`}>
            <rect x={padL} y={padT} width={plotW} height={plotH} />
          </clipPath>
        </defs>

        {/* 背景ヒートマップ（低値＝濃淡を反転して谷を分かりやすく） */}
        <g clipPath={`url(#nlp-clip-${modelId})`}>
          {cells.map((c, idx) => (
            <rect
              key={idx}
              x={c.x}
              y={c.y}
              width={cellW}
              height={cellH}
              fill="var(--diagram-blue)"
              fillOpacity={(0.03 + c.norm * 0.22).toFixed(3)}
            />
          ))}

          {/* 等高線 */}
          {contourPaths.map((d, i) => (
            <path
              key={`c-${i}`}
              d={d}
              fill="none"
              stroke="var(--diagram-sky)"
              strokeOpacity="0.55"
              strokeWidth="1.2"
            />
          ))}

          {/* サブ軌跡（最急降下法や最適解軌跡など） */}
          {secondaryTrajectory && secondaryTrajectory.length >= 2 && (
            <polyline
              points={secondaryTrajectory
                .map(([x, y]) => `${toPxX(x).toFixed(1)},${toPxY(y).toFixed(1)}`)
                .join(' ')}
              fill="none"
              stroke="var(--diagram-teal)"
              strokeWidth="2"
              strokeDasharray={secondaryIsDashed ? '5 4' : undefined}
            />
          )}

          {/* メイン反復軌跡（ニュートン法など） */}
          {trajectory && trajectory.length >= 2 && (
            <polyline
              points={trajectory
                .map(([x, y]) => `${toPxX(x).toFixed(1)},${toPxY(y).toFixed(1)}`)
                .join(' ')}
              fill="none"
              stroke="var(--diagram-amber)"
              strokeWidth="2.4"
            />
          )}

          {trajectory?.map(([x, y], idx) => {
            const isActive = activeStepIndex === idx;
            return (
              <g key={`tr-${idx}`}>
                <circle
                  cx={toPxX(x)}
                  cy={toPxY(y)}
                  r={isActive ? 6 : 3.8}
                  fill={isActive ? 'var(--diagram-red)' : 'var(--diagram-amber)'}
                  stroke="var(--diagram-halo)"
                  strokeWidth="1.5"
                />
                {(isActive || idx === 0) && (
                  <text
                    x={toPxX(x) + 7}
                    y={toPxY(y) - 6}
                    className="text-[10px] font-bold fill-current font-mono-num"
                  >
                    x({idx})
                  </text>
                )}
              </g>
            );
          })}

          {/* 停留点マーカー（モデル定義の定点） */}
          {model.stationaryPoints?.map((sp, idx) => (
            <g key={`sp-${idx}`}>
              <circle
                cx={toPxX(sp.x[0])}
                cy={toPxY(sp.x[1])}
                r="4.5"
                fill={sp.kind === 'saddle' ? 'var(--diagram-red)' : 'var(--diagram-emerald)'}
                stroke="var(--diagram-halo)"
                strokeWidth="1.5"
              />
            </g>
          ))}

          {/* ハイライト最適点 */}
          {highlightOptimum && (
            <g>
              <circle
                cx={toPxX(highlightOptimum[0])}
                cy={toPxY(highlightOptimum[1])}
                r="6"
                fill="var(--diagram-emerald)"
                stroke="var(--diagram-halo)"
                strokeWidth="2"
              />
              <text
                x={toPxX(highlightOptimum[0]) + 8}
                y={toPxY(highlightOptimum[1]) - 8}
                className="text-xs font-bold fill-[var(--diagram-emerald)] font-mono-num"
              >
                x*({round2(highlightOptimum[0])}, {round2(highlightOptimum[1])})
              </text>
            </g>
          )}

          {/* 勾配ベクトル / 最急降下ベクトル */}
          {gradArrow && (
            <g>
              <line
                x1={gradArrow.x1}
                y1={gradArrow.y1}
                x2={gradArrow.x2Grad}
                y2={gradArrow.y2Grad}
                stroke="var(--diagram-amber)"
                strokeWidth="2.2"
                markerEnd={`url(#nlp-arr-amber-${modelId})`}
              />
              <line
                x1={gradArrow.x1}
                y1={gradArrow.y1}
                x2={gradArrow.x2Desc}
                y2={gradArrow.y2Desc}
                stroke="var(--diagram-emerald)"
                strokeWidth="2.2"
                markerEnd={`url(#nlp-arr-emerald-${modelId})`}
              />
            </g>
          )}

          {/* 現在操作点 */}
          {currentPoint && (
            <circle
              cx={toPxX(currentPoint[0])}
              cy={toPxY(currentPoint[1])}
              r="5.5"
              fill="var(--diagram-red)"
              stroke="var(--diagram-halo)"
              strokeWidth="2"
            />
          )}
        </g>

        {/* プロット枠と軸目盛り */}
        <rect
          x={padL}
          y={padT}
          width={plotW}
          height={plotH}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.45"
        />

        {xTicks.map((t) => (
          <g key={`xt-${t}`}>
            <line x1={toPxX(t)} y1={padT + plotH} x2={toPxX(t)} y2={padT + plotH + 4} stroke="currentColor" strokeOpacity="0.6" />
            <text x={toPxX(t)} y={padT + plotH + 16} textAnchor="middle" className="text-[10px] fill-[var(--text-muted)] font-mono-num">
              {t}
            </text>
          </g>
        ))}

        {yTicks.map((t) => (
          <g key={`yt-${t}`}>
            <line x1={padL - 4} y1={toPxY(t)} x2={padL} y2={toPxY(t)} stroke="currentColor" strokeOpacity="0.6" />
            <text x={padL - 7} y={toPxY(t) + 3} textAnchor="end" className="text-[10px] fill-[var(--text-muted)] font-mono-num">
              {t}
            </text>
          </g>
        ))}

        <text x={padL + plotW / 2} y={h - 4} textAnchor="middle" className="text-xs font-bold fill-current">
          x₁
        </text>
        <text x={14} y={padT + plotH / 2} textAnchor="middle" className="text-xs font-bold fill-current">
          x₂
        </text>
      </svg>

      <div className="flex flex-wrap items-center justify-center gap-3 text-xs app-text-muted pt-1 font-mono-num">
        <span>谷底目安 f_min ≈ {round2(minF)}</span>
        <span>／ 濃色ほど値大 (上限クリップ ≈ {round2(minF + spanF)})</span>
      </div>
    </div>
  );
};
