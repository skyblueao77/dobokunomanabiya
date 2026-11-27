import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Calculator, Printer, Scale } from 'lucide-react';
import { LEARNING_UNITS, SUBJECTS, type UnitId } from '../data/curriculum';
import { buildRoutePath, isPlainLeftClick } from '../utils/router';
import { MathFormula } from './MathFormula';

interface ReferencePageProps {
  onOpenUnit: (unitId: UnitId) => void;
  onBackToPortal: () => void;
}

type ConverterCategory = 'stress' | 'force' | 'slope' | 'discharge';

interface UnitOption {
  id: string;
  label: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

const CONVERTER_DEFS: Record<
  ConverterCategory,
  { title: string; subtitle: string; defaultValue: number; units: UnitOption[] }
> = {
  stress: {
    title: '応力・圧力・土圧',
    subtitle: 'SI 単位（kPa = kN/m², MPa = N/mm²）と重力単位系の相互換算',
    defaultValue: 100,
    units: [
      { id: 'kPa', label: 'kPa (= kN/m²)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'MPa', label: 'MPa (= N/mm²)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'Pa', label: 'Pa (= N/m²)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      {
        id: 'tf_m2',
        label: 'tf/m²',
        toBase: (v) => v * 9.80665,
        fromBase: (v) => v / 9.80665,
      },
      {
        id: 'kgf_cm2',
        label: 'kgf/cm²',
        toBase: (v) => v * 98.0665,
        fromBase: (v) => v / 98.0665,
      },
    ],
  },
  force: {
    title: '荷重・力',
    subtitle: '構造計算・土圧合力に頻出する力の単位換算',
    defaultValue: 50,
    units: [
      { id: 'kN', label: 'kN', toBase: (v) => v, fromBase: (v) => v },
      { id: 'N', label: 'N', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'MN', label: 'MN', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'tf', label: 'tf', toBase: (v) => v * 9.80665, fromBase: (v) => v / 9.80665 },
      {
        id: 'kgf',
        label: 'kgf',
        toBase: (v) => (v * 9.80665) / 1000,
        fromBase: (v) => (v * 1000) / 9.80665,
      },
    ],
  },
  slope: {
    title: '勾配・角度',
    subtitle: '水路勾配 I（小数・‰・%・1/N）と斜面角度 θ の換算',
    defaultValue: 0.002,
    units: [
      { id: 'ratio', label: '勾配 I (小数, 例: 0.001)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'permille', label: '‰ (パーミル)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'percent', label: '% (パーセント)', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      {
        id: 'deg',
        label: '角度 θ (deg)',
        toBase: (v) => Math.tan((v * Math.PI) / 180),
        fromBase: (v) => (Math.atan(v) * 180) / Math.PI,
      },
      {
        id: 'rad',
        label: '角度 θ (rad)',
        toBase: (v) => Math.tan(v),
        fromBase: (v) => Math.atan(v),
      },
    ],
  },
  discharge: {
    title: '流量',
    subtitle: '河川・管水路・排水設計で頻出する体積流量の換算',
    defaultValue: 2.5,
    units: [
      { id: 'm3_s', label: 'm³/s', toBase: (v) => v, fromBase: (v) => v },
      { id: 'L_s', label: 'L/s', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'm3_min', label: 'm³/min', toBase: (v) => v / 60, fromBase: (v) => v * 60 },
      { id: 'm3_h', label: 'm³/h', toBase: (v) => v / 3600, fromBase: (v) => v * 3600 },
    ],
  },
};

const MASTER_FORMULAS: {
  subjectId: (typeof SUBJECTS)[number]['id'];
  unitId: UnitId;
  name: string;
  formula: string;
  note: string;
}[] = [
  {
    subjectId: 'structural',
    unitId: 'beam-sfd-bmd',
    name: '単純梁の支点反力と最大モーメント（等分布）',
    formula: 'R_A = R_B = \\frac{wL}{2},\\quad M_{\\max} = \\frac{wL^2}{8}',
    note: '下側引張正。集中荷重のみ中央載荷では M_max = PL/4。',
  },
  {
    subjectId: 'structural',
    unitId: 'cantilever-beam',
    name: '片持ち梁の固定端モーメントと自由端たわみ',
    formula: 'M_A = -\\left(Pa + \\frac{wL^2}{2} + M_0\\right),\\quad \\delta_P = \\frac{PL^3}{3EI},\\quad \\delta_w = \\frac{wL^4}{8EI}',
    note: '矩形断面 I = bh³/12。弾性曲線方程式 EI y″ = −M(x)。',
  },
  {
    subjectId: 'hydraulics',
    unitId: 'open-channel-flow',
    name: 'マニングの等流公式とフルード数',
    formula: 'v = \\frac{1}{n} R^{2/3} I^{1/2},\\quad R = \\frac{A}{P},\\quad Fr = \\frac{v}{\\sqrt{g D}}',
    note: 'Fr < 1 で常流、Fr = 1 で限界流、Fr > 1 で射流。',
  },
  {
    subjectId: 'hydraulics',
    unitId: 'specific-energy-jump',
    name: '比エネルギー・限界水深・ベランジェ跳水式',
    formula: 'E = h + \\frac{q^2}{2gh^2},\\quad h_c = \\left(\\frac{q^2}{g}\\right)^{1/3},\\quad h_2 = \\frac{h_1}{2}\\left(\\sqrt{1+8Fr_1^2}-1\\right)',
    note: '跳水エネルギー損失 ΔE = (h₂ − h₁)³ / (4 h₁ h₂)。',
  },
  {
    subjectId: 'soil',
    unitId: 'geomechanics-continuum',
    name: 'コーシーの公式と有効応力原理',
    formula: '\\mathbf{t} = \\boldsymbol{\\sigma}\\mathbf{n},\\quad \\sigma\'_{ij} = \\sigma_{ij} - u\\,\\delta_{ij}',
    note: '日本の土質力学は圧縮正（+）・引張負（−）。',
  },
  {
    subjectId: 'soil',
    unitId: 'mohr-circle',
    name: 'モールの応力円とモール・クーロン破壊規準',
    formula: '\\sigma_\\theta = \\frac{\\sigma_1+\\sigma_3}{2} + \\frac{\\sigma_1-\\sigma_3}{2}\\cos 2\\theta,\\quad \\tau_f = c + \\sigma\'\\tan\\phi',
    note: '破壊面角度 θ_f = 45° + φ/2。',
  },
  {
    subjectId: 'soil',
    unitId: 'rankine-earth-pressure',
    name: 'ランキン主働・受働土圧係数と引張亀裂深さ',
    formula: 'K_a = \\tan^2\\left(45^\\circ - \\frac{\\phi}{2}\\right),\\quad K_p = \\frac{1}{K_a},\\quad z_0 = \\frac{2c}{\\gamma\\sqrt{K_a}} - \\frac{q}{\\gamma}',
    note: '粘性土では引張域（p_a < 0）を無視して合力を積分。',
  },
  {
    subjectId: 'math-programming',
    unitId: 'lp-optimization',
    name: '線形計画の双対定理と相補性条件',
    formula: '\\max \\mathbf{c}^\\top \\mathbf{x} \\;\\text{s.t.}\\; A\\mathbf{x}\\le\\mathbf{b},\\mathbf{x}\\ge 0 \\iff \\min \\mathbf{b}^\\top \\mathbf{y} \\;\\text{s.t.}\\; A^\\top\\mathbf{y}\\ge\\mathbf{c},\\mathbf{y}\\ge 0',
    note: '強双対性 cᵀx* = bᵀy* とシャドウプライス解釈。',
  },
  {
    subjectId: 'math-programming',
    unitId: 'nlp-optimization',
    name: '無制約最適化の最適性条件とニュートン法',
    formula: '\\nabla f(\\mathbf{x}^*) = \\mathbf{0},\\quad H(\\mathbf{x}^*) \\succ 0,\\quad \\mathbf{x}_{k+1} = \\mathbf{x}_k - H(\\mathbf{x}_k)^{-1}\\nabla f(\\mathbf{x}_k)',
    note: '狭義凸関数では停留点が大域的最適解と一致。',
  },
];

function formatConverted(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs === 0) return '0';
  if (abs >= 1e6 || abs < 1e-4) return value.toExponential(4);
  return Number(value.toPrecision(6)).toString();
}

export const ReferencePage: React.FC<ReferencePageProps> = ({
  onOpenUnit,
  onBackToPortal,
}) => {
  const [category, setCategory] = useState<ConverterCategory>('stress');
  const [fromUnitId, setFromUnitId] = useState<string>('kPa');
  const [inputText, setInputText] = useState<string>('100');

  const currentDef = CONVERTER_DEFS[category];

  const handleSelectCategory = (next: ConverterCategory) => {
    setCategory(next);
    setFromUnitId(CONVERTER_DEFS[next].units[0].id);
    setInputText(String(CONVERTER_DEFS[next].defaultValue));
  };

  const convertedRows = useMemo(() => {
    const parsed = Number(inputText);
    if (!Number.isFinite(parsed)) {
      return currentDef.units.map((u) => ({ id: u.id, label: u.label, display: '—' }));
    }
    const sourceUnit = currentDef.units.find((u) => u.id === fromUnitId) ?? currentDef.units[0];
    const baseValue = sourceUnit.toBase(parsed);
    const rows = currentDef.units.map((u) => ({
      id: u.id,
      label: u.label,
      display: formatConverted(u.fromBase(baseValue)),
    }));
    if (category === 'slope') {
      const invN = Math.abs(baseValue) > 1e-12 ? `1 / ${formatConverted(1 / baseValue)}` : '水平 (0)';
      rows.push({ id: 'inv_n', label: '分数勾配 (1 / N)', display: invN });
    }
    return rows;
  }, [category, currentDef, fromUnitId, inputText]);

  return (
    <div className="space-y-6">
      <div className="app-surface rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs app-text-muted mb-1">
            <span>全科目横断リファレンス</span>
            <span aria-hidden="true">/</span>
            <span>公式チートシート＆単位換算</span>
          </div>
          <h1 id="main-content" tabIndex={-1} className="text-xl sm:text-2xl font-bold outline-none">
            土木工学・数理計画 公式チートシート＆単位換算ツール
          </h1>
          <p className="text-xs sm:text-sm app-text-muted mt-1">
            レポート検算や試験勉強に使える頻出単位の即時換算、科目ごとの符号規約比較、収録全 {LEARNING_UNITS.length} 単元の代表公式を 1 ページに集約しています。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="interactive-btn app-surface inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            印刷 / PDF 保存
          </button>
          <button
            type="button"
            onClick={onBackToPortal}
            className="interactive-btn app-surface inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            ポータルへ戻る
          </button>
        </div>
      </div>

      {/* 1. インタラクティブ単位換算ツール */}
      <section aria-labelledby="converter-heading" className="app-surface rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="converter-heading" className="text-base font-bold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-[var(--accent-color)]" aria-hidden="true" />
              土木頻出 単位換算クイックツール
            </h2>
            <p className="text-xs app-text-muted mt-0.5">{currentDef.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="換算カテゴリ選択">
            {(Object.keys(CONVERTER_DEFS) as ConverterCategory[]).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={category === key}
                onClick={() => handleSelectCategory(key)}
                className={`interactive-btn rounded-lg px-3 py-1.5 text-xs font-semibold border cursor-pointer ${
                  category === key
                    ? 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/35'
                    : 'app-surface-subtle'
                }`}
              >
                {CONVERTER_DEFS[key].title}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5 space-y-1">
            <label htmlFor="unit-conv-value" className="block text-xs font-semibold">
              換算元の数値
            </label>
            <input
              id="unit-conv-value"
              type="number"
              step="any"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="app-surface w-full rounded-lg px-3 py-2 text-sm font-mono-num"
            />
          </div>
          <div className="md:col-span-7 space-y-1">
            <label htmlFor="unit-conv-source" className="block text-xs font-semibold">
              換算元の単位
            </label>
            <select
              id="unit-conv-source"
              value={fromUnitId}
              onChange={(e) => setFromUnitId(e.target.value)}
              className="app-surface w-full rounded-lg px-3 py-2 text-sm"
            >
              {currentDef.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {convertedRows.map((row) => (
            <div
              key={row.id}
              className={`rounded-lg px-3.5 py-2.5 border ${
                row.id === fromUnitId
                  ? 'bg-blue-500/10 border-blue-500/35'
                  : 'app-surface-subtle'
              }`}
            >
              <div className="text-[11px] app-text-muted">{row.label}</div>
              <div className="text-base font-bold font-mono-num mt-0.5">{row.display}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. 科目別の符号規約比較表 */}
      <section aria-labelledby="sign-convention-heading" className="app-surface rounded-2xl p-5 shadow-sm space-y-3">
        <h2 id="sign-convention-heading" className="text-base font-bold flex items-center gap-2">
          <Scale className="h-4 w-4 text-[var(--accent-color)]" aria-hidden="true" />
          科目ごとの符号規約まとめ（日本の大学・高専標準）
        </h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]" tabIndex={0}>
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="app-surface-subtle border-b border-[var(--border-subtle)]">
                <th className="px-3.5 py-2.5 font-bold">分野</th>
                <th className="px-3.5 py-2.5 font-bold">物理量</th>
                <th className="px-3.5 py-2.5 font-bold">本サイトの正 (+) 規約</th>
                <th className="px-3.5 py-2.5 font-bold">注意点（他分野との違い）</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              <tr>
                <td className="px-3.5 py-2.5 font-semibold">土質力学</td>
                <td className="px-3.5 py-2.5">垂直応力 σ / 有効応力 σ&apos;</td>
                <td className="px-3.5 py-2.5">圧縮正（+）・引張負（−）</td>
                <td className="px-3.5 py-2.5 app-text-muted">機械工学・金属材料力学は一般に引張正</td>
              </tr>
              <tr>
                <td className="px-3.5 py-2.5 font-semibold">構造力学</td>
                <td className="px-3.5 py-2.5">曲げモーメント図 (BMD)</td>
                <td className="px-3.5 py-2.5">下側引張を正として下側に描画</td>
                <td className="px-3.5 py-2.5 app-text-muted">片持ち梁は上側引張（負値）のため上側に描画</td>
              </tr>
              <tr>
                <td className="px-3.5 py-2.5 font-semibold">構造力学</td>
                <td className="px-3.5 py-2.5">たわみ δ(x)</td>
                <td className="px-3.5 py-2.5">鉛直下向きを正（EI y&Prime; = −M）</td>
                <td className="px-3.5 py-2.5 app-text-muted">上向き座標系では EI y&Prime; = +M となる教科書もあり</td>
              </tr>
              <tr>
                <td className="px-3.5 py-2.5 font-semibold">水理学</td>
                <td className="px-3.5 py-2.5">重力加速度 g・勾配 I</td>
                <td className="px-3.5 py-2.5">g = 9.80665 m/s²、下り勾配を正</td>
                <td className="px-3.5 py-2.5 app-text-muted">1/1000 は I = 0.001（1‰ = 0.1%）</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. 全収録単元の代表公式チートシート */}
      <section aria-labelledby="formula-sheet-heading" className="space-y-4">
        <h2 id="formula-sheet-heading" className="text-base font-bold">
          全 {LEARNING_UNITS.length} 単元 代表公式チートシート
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MASTER_FORMULAS.map((item) => {
            const subject = SUBJECTS.find((s) => s.id === item.subjectId);
            const unitPath = buildRoutePath(item.unitId);
            return (
              <article
                key={item.unitId}
                className="app-surface rounded-xl p-4 shadow-sm flex flex-col justify-between gap-2 print-break-avoid"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs app-text-muted mb-1">
                    <span className="font-semibold">{subject?.name}</span>
                    <a
                      href={unitPath}
                      onClick={(e) => {
                        if (isPlainLeftClick(e)) {
                          e.preventDefault();
                          onOpenUnit(item.unitId);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-[var(--accent-color)] font-semibold hover:underline no-print"
                    >
                      シミュレーターを開く
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </div>
                  <h3 className="text-sm font-bold">{item.name}</h3>
                  <div className="app-surface-subtle rounded-lg px-3 py-2 my-2">
                    <MathFormula block math={item.formula} />
                  </div>
                </div>
                <p className="text-xs app-text-muted">{item.note}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ReferencePage;
