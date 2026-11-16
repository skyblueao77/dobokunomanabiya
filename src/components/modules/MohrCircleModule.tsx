import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';
import { calculateMohrCircle, type MohrInputs } from '../../utils/mohrPhysics';
import { SliderInput } from '../SliderInput';
import { MohrCircleSVG } from '../MohrCircleSVG';
import { SoilElementSVG } from '../SoilElementSVG';
import { CalculationSteps } from '../CalculationSteps';
import { PracticeProblems } from '../PracticeProblems';
import { CopyShareButton } from '../CopyShareButton';

const DEFAULT_INPUTS: MohrInputs = {
  sigma1: 200,
  sigma3: 80,
  theta: 30,
  c: 20,
  phi: 30,
  u: 40,
  useEffectiveStress: false,
};

function parseInitialInputs(): MohrInputs {
  try {
    const hash = window.location.hash;
    const queryIdx = hash.indexOf('?');
    if (queryIdx === -1) return DEFAULT_INPUTS;
    const params = new URLSearchParams(hash.slice(queryIdx + 1));
    const num = (key: string, fallback: number) => {
      const val = params.get(key);
      if (val === null) return fallback;
      const parsed = Number(val);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const sigma1 = Math.max(0, Math.min(500, num('s1', DEFAULT_INPUTS.sigma1)));
    const sigma3 = Math.max(-50, Math.min(sigma1, num('s3', DEFAULT_INPUTS.sigma3)));
    return {
      sigma1,
      sigma3,
      theta: Math.max(0, Math.min(90, num('th', DEFAULT_INPUTS.theta))),
      c: Math.max(0, Math.min(100, num('c', DEFAULT_INPUTS.c))),
      phi: Math.max(0, Math.min(45, num('phi', DEFAULT_INPUTS.phi))),
      u: Math.max(0, Math.min(200, num('u', DEFAULT_INPUTS.u))),
      useEffectiveStress: params.get('eff') === '1',
    };
  } catch {
    return DEFAULT_INPUTS;
  }
}

interface MohrCircleModuleProps {
  isCompleted: boolean;
  onToggleUnitComplete: () => void;
  completedProblemIds: number[];
  onToggleProblemDone: (id: number) => void;
  onBackToPortal: () => void;
}

export const MohrCircleModule: React.FC<MohrCircleModuleProps> = ({
  isCompleted,
  onToggleUnitComplete,
  completedProblemIds,
  onToggleProblemDone,
  onBackToPortal,
}) => {
  const [inputs, setInputs] = useState<MohrInputs>(() => parseInitialInputs());

  const result = useMemo(() => calculateMohrCircle(inputs), [inputs]);

  useEffect(() => {
    const params = new URLSearchParams({
      s1: String(inputs.sigma1),
      s3: String(inputs.sigma3),
      th: String(inputs.theta),
      c: String(inputs.c),
      phi: String(inputs.phi),
      u: String(inputs.u),
      eff: inputs.useEffectiveStress ? '1' : '0',
    });
    const nextHash = `#/unit/mohr-circle?${params.toString()}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash);
    }
  }, [inputs]);

  const updateField = <K extends keyof MohrInputs>(key: K, value: MohrInputs[K]) => {
    setInputs((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'sigma1' && next.sigma3 > next.sigma1) {
        next.sigma3 = next.sigma1;
      } else if (key === 'sigma3' && next.sigma3 > next.sigma1) {
        next.sigma1 = next.sigma3;
      }
      return next;
    });
  };

  const handleLoadPreset = (preset: Partial<MohrInputs>) => {
    setInputs((prev) => ({
      ...prev,
      ...preset,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* 単元ヘッダー・アクションバー */}
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
            土質力学｜モールの応力円・破壊規準
          </h1>
          <p className="text-xs sm:text-sm app-text-muted">
            圧縮正（＋）・引張負（−）の教科書規約に基づき、主応力・任意面の応力・有効応力・破壊判定をリアルタイム可視化します。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CopyShareButton getTextToCopy={() => window.location.href} />
          <button
            type="button"
            onClick={() => setInputs(DEFAULT_INPUTS)}
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

      {/* シミュレーター本体 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-4 min-w-0 space-y-4">
          <div className="app-surface rounded-xl p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-bold border-b border-[var(--border-subtle)] pb-2">
              応力状態・地盤定数の設定
            </h2>

            <div className="space-y-3.5">
              <SliderInput
                label="最大主応力"
                symbol="σ₁"
                unit="kPa"
                value={inputs.sigma1}
                min={0}
                max={500}
                step={5}
                onChange={(v) => updateField('sigma1', v)}
              />
              <SliderInput
                label="最小主応力"
                symbol="σ₃"
                unit="kPa"
                value={inputs.sigma3}
                min={-50}
                max={400}
                step={5}
                onChange={(v) => updateField('sigma3', v)}
              />
              <SliderInput
                label="対象面の角度"
                symbol="θ"
                unit="°"
                value={inputs.theta}
                min={0}
                max={90}
                step={1}
                onChange={(v) => updateField('theta', v)}
              />
            </div>

            <div className="border-t border-[var(--border-subtle)] pt-3.5 space-y-3.5">
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                モール・クーロンの破壊規準
              </div>
              <SliderInput
                label="粘着力"
                symbol="c"
                unit="kPa"
                value={inputs.c}
                min={0}
                max={100}
                step={1}
                onChange={(v) => updateField('c', v)}
              />
              <SliderInput
                label="内部摩擦角"
                symbol="φ"
                unit="°"
                value={inputs.phi}
                min={0}
                max={45}
                step={1}
                onChange={(v) => updateField('phi', v)}
              />
            </div>

            <div className="border-t border-[var(--border-subtle)] pt-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="effective-stress-toggle"
                  className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 cursor-pointer"
                >
                  有効応力モード（全応力と比較）
                </label>
                <button
                  id="effective-stress-toggle"
                  type="button"
                  role="switch"
                  aria-checked={inputs.useEffectiveStress}
                  onClick={() =>
                    updateField('useEffectiveStress', !inputs.useEffectiveStress)
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    inputs.useEffectiveStress ? 'bg-indigo-600' : 'bg-slate-400'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                      inputs.useEffectiveStress ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <SliderInput
                label="間隙水圧"
                symbol="u"
                unit="kPa"
                value={inputs.u}
                min={0}
                max={200}
                step={5}
                onChange={(v) => updateField('u', v)}
              />
            </div>
          </div>

          <div
            className={`rounded-xl border p-4 shadow-sm ${
              result.isFailure
                ? 'border-red-500/40 bg-red-500/10'
                : 'border-emerald-500/35 bg-emerald-500/10'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {result.isFailure ? (
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              )}
              <div className="text-xs space-y-1">
                <div
                  className={`font-bold text-sm ${
                    result.isFailure
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {result.isFailure ? '破壊状態（Failure）' : '安定状態（Safe）'}
                </div>
                <p>
                  理論上のせん断面角度:{' '}
                  <span className="font-bold font-mono-num">θ_f = {result.thetaF}°</span>
                </p>
                {result.safetyFactor !== null && (
                  <p>
                    破壊に対する余裕度 (R_f / R):{' '}
                    <span className="font-bold font-mono-num">{result.safetyFactor}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <SoilElementSVG inputs={inputs} result={result} />
        </aside>

        <div className="lg:col-span-8 min-w-0 space-y-6">
          <MohrCircleSVG inputs={inputs} result={result} />
          <CalculationSteps inputs={inputs} result={result} />
        </div>
      </div>

      <PracticeProblems
        onLoadPreset={handleLoadPreset}
        completedIds={completedProblemIds}
        onToggleProblemDone={onToggleProblemDone}
      />
    </div>
  );
};

export default MohrCircleModule;
