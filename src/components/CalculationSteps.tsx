import React from 'react';
import { type MohrInputs, type MohrResult } from '../utils/mohrPhysics';
import { MathFormula } from './MathFormula';

interface CalculationStepsProps {
  inputs: MohrInputs;
  result: MohrResult;
}

export const CalculationSteps: React.FC<CalculationStepsProps> = ({ inputs, result }) => {
  const isEff = inputs.useEffectiveStress;
  const cSym = isEff ? "C'" : 'C';
  const s1Sym = isEff ? "\\sigma'_1" : '\\sigma_1';
  const s3Sym = isEff ? "\\sigma'_3" : '\\sigma_3';
  const sThetaSym = isEff ? "\\sigma'_\\theta" : '\\sigma_\\theta';

  const s1 = result.activeSigma1;
  const s3 = result.activeSigma3;
  const center = result.activeCenter;

  return (
    <section className="app-surface rounded-xl shadow-sm overflow-hidden">
      <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2.5 flex items-center justify-between">
        <h2 className="text-sm font-semibold">途中式・検算パネル（リアルタイム計算）</h2>
        <span className="text-xs app-text-muted">
          {isEff ? '有効応力基準' : '全応力基準'}
        </span>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="app-surface-subtle rounded-lg p-3.5 min-w-0">
          <h3 className="text-xs font-semibold app-text-muted mb-1.5">
            1. モール円の中心と半径
          </h3>
          {isEff && (
            <div className="text-xs text-indigo-700 dark:text-indigo-300 mb-1">
              <MathFormula
                math={`\\sigma'_1 = ${inputs.sigma1} - ${inputs.u} = ${s1}\\text{ kPa},\\quad \\sigma'_3 = ${inputs.sigma3} - ${inputs.u} = ${s3}\\text{ kPa}`}
              />
            </div>
          )}
          <MathFormula
            block
            math={`${cSym} = \\frac{${s1Sym} + ${s3Sym}}{2} = \\frac{${s1} + ${s3}}{2} = ${center}\\text{ kPa}`}
          />
          <MathFormula
            block
            math={`R = \\frac{${s1Sym} - ${s3Sym}}{2} = \\frac{${s1} - ${s3}}{2} = ${result.radius}\\text{ kPa}`}
          />
        </div>

        <div className="app-surface-subtle rounded-lg p-3.5 min-w-0">
          <h3 className="text-xs font-semibold app-text-muted mb-1.5">
            2. 任意角 <MathFormula math={`\\theta = ${inputs.theta}^\\circ`} /> の応力
          </h3>
          <MathFormula
            block
            math={`\\begin{aligned} ${sThetaSym} &= ${cSym} + R\\cos(2\\theta) \\\\ &= ${center} + ${result.radius}\\cos(${2 * inputs.theta}^\\circ) = ${result.activeSigmaTheta}\\text{ kPa} \\end{aligned}`}
          />
          <MathFormula
            block
            math={`\\begin{aligned} \\tau_\\theta &= R\\sin(2\\theta) \\\\ &= ${result.radius}\\sin(${2 * inputs.theta}^\\circ) = ${result.tauTheta}\\text{ kPa} \\end{aligned}`}
          />
        </div>

        <div
          className={`md:col-span-2 rounded-lg p-3.5 min-w-0 border ${
            result.isFailure
              ? 'bg-red-500/10 border-red-500/35'
              : 'bg-emerald-500/10 border-emerald-500/30'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <h3 className="text-xs font-semibold">
              3. モール・クーロンの破壊規準判定（
              <MathFormula math={`c = ${inputs.c}\\text{ kPa},\\ \\phi = ${inputs.phi}^\\circ`} />）
            </h3>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                result.isFailure
                  ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                  : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {result.isFailure ? 'R ≥ R_f（破壊条件を満たす）' : 'R < R_f（破壊しない）'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
            <MathFormula
              block
              math={`\\begin{aligned} R_f &= ${cSym}\\sin\\phi + c\\cos\\phi \\\\ &= ${center}\\sin(${inputs.phi}^\\circ) + ${inputs.c}\\cos(${inputs.phi}^\\circ) = ${result.maxAllowableRadius}\\text{ kPa} \\end{aligned}`}
            />
            <MathFormula
              block
              math={`\\theta_f = 45^\\circ + \\frac{\\phi}{2} = 45^\\circ + \\frac{${inputs.phi}^\\circ}{2} = ${result.thetaF}^\\circ`}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
