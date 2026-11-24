import React from 'react';
import { formatRational, type SimplexStep } from '../../utils/mathProgramming';

interface SimplexTableauViewProps {
  step: SimplexStep;
  highlightPivot?: boolean;
  highlightCols?: number[];
  overrideZRow?: number[];
  overrideZValue?: number;
  overrideRhs?: number[];
  highlightNegative?: boolean;
  caption?: string;
}

export const SimplexTableauView: React.FC<SimplexTableauViewProps> = ({
  step,
  highlightPivot = false,
  highlightCols = [],
  overrideZRow,
  overrideZValue,
  overrideRhs,
  highlightNegative = false,
  caption,
}) => {
  const zRow = overrideZRow ?? step.zRow;
  const zVal = overrideZValue ?? step.zValue;
  const rhs = overrideRhs ?? step.rhs;
  const highlightSet = new Set(highlightCols);
  const basisSet = new Set(step.basis);

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
      <table className="w-full border-collapse text-xs font-mono-num">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="app-surface-subtle border-b border-[var(--border-subtle)]">
            <th scope="col" className="px-2.5 py-2 text-left font-bold whitespace-nowrap">
              基底変数
            </th>
            <th scope="col" className="px-2.5 py-2 text-right font-bold whitespace-nowrap">
              基底変数の値
            </th>
            <th scope="col" className="px-2 py-2 text-center font-bold">
              z
            </th>
            {step.varNames.map((name, colIdx) => {
              const isEntering = highlightPivot && step.enteringCol === colIdx;
              const isSpecCol = highlightSet.has(colIdx);
              return (
                <th
                  key={`${name}-${colIdx}`}
                  scope="col"
                  className={`px-2.5 py-2 text-right font-bold whitespace-nowrap ${
                    isEntering
                      ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                      : isSpecCol
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : ''
                  }`}
                >
                  {name}
                </th>
              );
            })}
            {highlightPivot && (
              <th scope="col" className="px-2.5 py-2 text-right font-bold whitespace-nowrap">
                最小比 (b/a)
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {/* z 行 */}
          <tr className="bg-[var(--surface-subtle)]/50 font-semibold">
            <th scope="row" className="px-2.5 py-2 text-left">
              z{step.phase === 1 ? ' (第1段階)' : ''}
            </th>
            <td className="px-2.5 py-2 text-right">{formatRational(zVal)}</td>
            <td className="px-2 py-2 text-center">1</td>
            {zRow.map((val, colIdx) => {
              const isEntering = highlightPivot && step.enteringCol === colIdx;
              const isSpecCol = highlightSet.has(colIdx);
              const isNegAlert = highlightNegative && !basisSet.has(colIdx) && val < -1e-7;
              return (
                <td
                  key={`z-${colIdx}`}
                  className={`px-2.5 py-2 text-right ${
                    isNegAlert
                      ? 'bg-red-500/20 text-red-700 dark:text-red-300 font-bold'
                      : isEntering
                        ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold'
                        : isSpecCol
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
                          : ''
                  }`}
                >
                  {formatRational(val)}
                </td>
              );
            })}
            {highlightPivot && (
              <td className="px-2.5 py-2 text-right app-text-muted">—</td>
            )}
          </tr>

          {/* 制約行 */}
          {step.rows.map((row, rIdx) => {
            const bIdx = step.basis[rIdx];
            const bName = step.varNames[bIdx] ?? `v${bIdx}`;
            const isLeaving = highlightPivot && step.leavingRow === rIdx;
            const ratioVal = step.ratios[rIdx];
            const rhsVal = rhs[rIdx] ?? 0;
            const isRhsNeg = highlightNegative && rhsVal < -1e-7;

            return (
              <tr
                key={`row-${rIdx}`}
                className={isLeaving ? 'bg-amber-500/10' : ''}
              >
                <th scope="row" className="px-2.5 py-2 text-left font-bold">
                  {bName}
                </th>
                <td
                  className={`px-2.5 py-2 text-right font-semibold ${
                    isRhsNeg
                      ? 'bg-red-500/20 text-red-700 dark:text-red-300 font-bold'
                      : ''
                  }`}
                >
                  {formatRational(rhsVal)}
                </td>
                <td className="px-2 py-2 text-center app-text-muted">0</td>
                {row.map((val, colIdx) => {
                  const isEntering = highlightPivot && step.enteringCol === colIdx;
                  const isPivotCell = isEntering && isLeaving;
                  const isSpecCol = highlightSet.has(colIdx);
                  return (
                    <td
                      key={`r-${rIdx}-c-${colIdx}`}
                      className={`px-2.5 py-2 text-right ${
                        isPivotCell
                          ? 'bg-amber-500/30 font-bold ring-2 ring-inset ring-amber-600 dark:ring-amber-400'
                          : isEntering
                            ? 'bg-blue-500/10'
                            : isSpecCol
                              ? 'bg-emerald-500/10'
                              : ''
                      }`}
                    >
                      {formatRational(val)}
                    </td>
                  );
                })}
                {highlightPivot && (
                  <td className="px-2.5 py-2 text-right whitespace-nowrap">
                    {step.enteringCol === null ? (
                      <span className="app-text-muted">—</span>
                    ) : ratioVal === null ? (
                      <span className="text-xs app-text-muted">除外 (≤0)</span>
                    ) : (
                      <span className={isLeaving ? 'font-bold text-amber-700 dark:text-amber-300' : ''}>
                        {formatRational(ratioVal)}
                      </span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
