import React, { useMemo, useState } from 'react';
import {
  formatRational,
  round2,
  solveLP2D,
  type Lp2DConstraint,
  type LpSense,
} from '../../utils/mathProgramming';
import { SliderInput } from '../SliderInput';
import { MathFormula } from '../MathFormula';
import { ChapterExercisePanel, type ContinuumExercise } from '../continuum/ChapterExercisePanel';

interface LpCh1Props {
  completedIds: string[];
  onToggleDone: (id: string) => void;
  onMarkDone: (id: string) => void;
}

type PresetId = 'concrete-mix' | 'soil-stabilizer';

interface GraphicalPreset {
  id: PresetId;
  title: string;
  sense: LpSense;
  c1: number;
  c2: number;
  b1: number;
  b2: number;
  c3: Lp2DConstraint;
  a1Label: string;
  a2Label: string;
  c1Coeffs: [number, number];
  c2Coeffs: [number, number];
  op: '<=' | '>=';
  unitProfit: string;
  maxAxis: number;
}

const PRESETS: Record<PresetId, GraphicalPreset> = {
  'concrete-mix': {
    id: 'concrete-mix',
    title: '① コンクリート二次製品の生産配分（最大化）',
    sense: 'max',
    c1: 5,
    c2: 4,
    b1: 18,
    b2: 18,
    c1Coeffs: [2, 1],
    c2Coeffs: [1, 2],
    c3: { a1: 1, a2: 0, op: '<=', b: 7, label: 'x1 ≤ 7 (骨材供給)' },
    a1Label: '型枠工数 (2x₁+x₂)',
    a2Label: '養生槽容量 (x₁+2x₂)',
    op: '<=',
    unitProfit: '百万円',
    maxAxis: 14,
  },
  'soil-stabilizer': {
    id: 'soil-stabilizer',
    title: '② 軟弱地盤改良固化材の配合（最小化）',
    sense: 'min',
    c1: 4,
    c2: 5,
    b1: 9,
    b2: 8,
    c1Coeffs: [3, 1],
    c2Coeffs: [1, 2],
    c3: { a1: 0, a2: 1, op: '>=', b: 1, label: 'x2 ≥ 1 (最低混和量)' },
    a1Label: '一軸圧縮強度 (3x₁+x₂)',
    a2Label: '長期安定成分 (x₁+2x₂)',
    op: '>=',
    unitProfit: '万円',
    maxAxis: 10,
  },
};

function clipLineToBox(
  a1: number,
  a2: number,
  b: number,
  maxX: number,
  maxY: number
): [{ x1: number; x2: number }, { x1: number; x2: number }] | null {
  const pts: { x1: number; x2: number }[] = [];
  const eps = 1e-8;
  if (Math.abs(a2) > eps) {
    const yAt0 = b / a2;
    if (yAt0 >= -eps && yAt0 <= maxY + eps) pts.push({ x1: 0, x2: Math.max(0, Math.min(maxY, yAt0)) });
    const yAtMax = (b - a1 * maxX) / a2;
    if (yAtMax >= -eps && yAtMax <= maxY + eps) {
      pts.push({ x1: maxX, x2: Math.max(0, Math.min(maxY, yAtMax)) });
    }
  }
  if (Math.abs(a1) > eps) {
    const xAt0 = b / a1;
    if (xAt0 >= -eps && xAt0 <= maxX + eps) pts.push({ x1: Math.max(0, Math.min(maxX, xAt0)), x2: 0 });
    const xAtMax = (b - a2 * maxY) / a1;
    if (xAtMax >= -eps && xAtMax <= maxX + eps) {
      pts.push({ x1: Math.max(0, Math.min(maxX, xAtMax)), x2: maxY });
    }
  }
  const uniq: { x1: number; x2: number }[] = [];
  for (const p of pts) {
    if (!uniq.some((q) => Math.hypot(q.x1 - p.x1, q.x2 - p.x2) < 1e-5)) {
      uniq.push(p);
    }
  }
  if (uniq.length < 2) return null;
  return [uniq[0], uniq[1]];
}

export const LpCh1Graphical: React.FC<LpCh1Props> = ({
  completedIds,
  onToggleDone,
  onMarkDone,
}) => {
  const [presetId, setPresetId] = useState<PresetId>('concrete-mix');
  const preset = PRESETS[presetId];

  const [c1, setC1] = useState(preset.c1);
  const [c2, setC2] = useState(preset.c2);
  const [b1, setB1] = useState(preset.b1);
  const [b2, setB2] = useState(preset.b2);
  const [zProbe, setZProbe] = useState(40);

  const loadPreset = (id: PresetId) => {
    const p = PRESETS[id];
    setPresetId(id);
    setC1(p.c1);
    setC2(p.c2);
    setB1(p.b1);
    setB2(p.b2);
    setZProbe(id === 'concrete-mix' ? 40 : 32);
  };

  const constraints: Lp2DConstraint[] = useMemo(
    () => [
      { a1: preset.c1Coeffs[0], a2: preset.c1Coeffs[1], op: preset.op, b: b1, label: '制約1' },
      { a1: preset.c2Coeffs[0], a2: preset.c2Coeffs[1], op: preset.op, b: b2, label: '制約2' },
      preset.c3,
    ],
    [preset, b1, b2]
  );

  const lpRes = useMemo(
    () =>
      solveLP2D({
        sense: preset.sense,
        c1,
        c2,
        constraints,
        maxX: preset.maxAxis,
        maxY: preset.maxAxis,
      }),
    [preset.sense, preset.maxAxis, c1, c2, constraints]
  );

  const exercises: ContinuumExercise[] = [
    {
      id: 'lp-ch1-q1',
      title: '問1：コンクリート二次製品の生産配分（最大化）',
      category: '図解法（最大化）',
      statement:
        'プレキャスト製品 A（1日あたり生産量 x₁）と製品 B（生産量 x₂）を生産する。1単位あたりの利益は A が 5 百万円、B が 4 百万円である。制約条件が 2x₁ + x₂ ≤ 18（型枠工数）、x₁ + 2x₂ ≤ 18（養生槽容量）、x₁ ≤ 7（骨材供給上限）、x₁ ≥ 0, x₂ ≥ 0 のとき、利益の最大値を求めよ。',
      mathContext:
        '\\max_{x_1, x_2} 5x_1 + 4x_2 \\quad\\text{s.t. } 2x_1 + x_2 \\le 18,\\; x_1 + 2x_2 \\le 18,\\; x_1 \\le 7,\\; x_1, x_2 \\ge 0',
      kind: 'numeric',
      expectedValue: 54,
      tolerance: 0.2,
      unit: '百万円',
      inputHint: '制約境界線の交点をすべて求め、実行可能領域の各頂点で目的関数値を評価します。',
      hint: '2x₁ + x₂ = 18 と x₁ + 2x₂ = 18 の交点は (x₁, x₂) = (6, 6) であり、x₁ ≤ 7 も満たします。',
      steps: [
        {
          label: '実行可能領域の頂点（端点）を列挙する',
          math: '(0,0),\\ (7,0),\\ (7,4),\\ (6,6),\\ (0,9)',
        },
        {
          label: '各頂点で目的関数 z = 5x₁ + 4x₂ を比較する',
          math: 'z(6,6) = 5(6) + 4(6) = 54 > z(7,4) = 51 > z(0,9) = 36 > z(7,0) = 35',
        },
      ],
      answerSummary: '54 百万円（最適生産量 x₁ = 6, x₂ = 6）',
      onApplyPreset: () => loadPreset('concrete-mix'),
    },
    {
      id: 'lp-ch1-q2',
      title: '問2：軟弱地盤改良固化材の配合（最小化）',
      category: '図解法（最小化）',
      statement:
        '固化材 C₁（配合量 x₁）と固化材 C₂（配合量 x₂）を混合する。1単位あたりの費用は C₁ が 4 万円、C₂ が 5 万円である。所要品質の制約が 3x₁ + x₂ ≥ 9、x₁ + 2x₂ ≥ 8、x₂ ≥ 1、x₁ ≥ 0, x₂ ≥ 0 のとき、合計費用の最小値を求めよ。',
      mathContext:
        '\\min_{x_1, x_2} 4x_1 + 5x_2 \\quad\\text{s.t. } 3x_1 + x_2 \\ge 9,\\; x_1 + 2x_2 \\ge 8,\\; x_2 \\ge 1,\\; x_1, x_2 \\ge 0',
      kind: 'numeric',
      expectedValue: 23,
      tolerance: 0.2,
      unit: '万円',
      inputHint: '最小化問題なので、実行可能領域の下側境界の端点で目的関数を最小にする点を探します。',
      hint: '3x₁ + x₂ = 9 と x₁ + 2x₂ = 8 を連立させると (x₁, x₂) = (2, 3) が得られます。',
      steps: [
        {
          label: '実行可能領域の頂点（下側境界の端点）を求める',
          math: '(6,1),\\ (2,3),\\ (0,9)',
        },
        {
          label: '各頂点で費用 w = 4x₁ + 5x₂ を計算して最小値を求める',
          math: 'w(6,1) = 29,\\quad w(2,3) = 4(2)+5(3)=23,\\quad w(0,9) = 45',
        },
      ],
      answerSummary: '23 万円（最適配合量 x₁ = 2, x₂ = 3）',
      onApplyPreset: () => loadPreset('soil-stabilizer'),
    },
  ];

  // SVG 座標系
  const w = 540;
  const h = 380;
  const padL = 48;
  const padR = 24;
  const padT = 22;
  const padB = 40;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const maxVal = preset.maxAxis;
  const toX = (x1: number) => padL + (x1 / maxVal) * plotW;
  const toY = (x2: number) => padT + plotH - (x2 / maxVal) * plotH;

  const lineColors = ['var(--diagram-blue)', 'var(--diagram-teal)', 'var(--diagram-violet)'];
  const polyPoints = lpRes.polygon
    .map((p) => `${toX(p.x1).toFixed(1)},${toY(p.x2).toFixed(1)}`)
    .join(' ');

  const probeSeg = clipLineToBox(c1, c2, zProbe, maxVal, maxVal);
  const optSeg =
    lpRes.optimalValue !== null
      ? clipLineToBox(c1, c2, lpRes.optimalValue, maxVal, maxVal)
      : null;

  const gridTicks = Array.from({ length: Math.floor(maxVal / 2) + 1 }, (_, i) => i * 2);

  return (
    <div className="space-y-6">
      {/* 1. 理解パート */}
      <section className="app-surface rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <h2 className="text-base sm:text-lg font-bold">
            1. 理解：線形計画問題の定式化と図解法の幾何的意味
          </h2>
          <span className="rounded-md bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
            第1章：定式化と図解法
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm leading-relaxed">
          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">定式化の4ステップ</h3>
            <ol className="text-xs sm:text-sm app-text-muted list-decimal pl-4 space-y-1">
              <li>
                <strong>決定変数</strong>：操作できる量（生産量・配合量など）を <MathFormula math="x_1, x_2" /> とおく。
              </li>
              <li>
                <strong>目的関数</strong>：最大化・最小化したい指標を1次式 <MathFormula math="z = c_1 x_1 + c_2 x_2" /> で表す。
              </li>
              <li>
                <strong>制約条件</strong>：資源上限（<MathFormula math="\le" />）や品質下限（<MathFormula math="\ge" />）を1次不等式で表す。
              </li>
              <li>
                <strong>非負条件</strong>：物理的な量が負にならない制約 <MathFormula math="x_1 \ge 0,\ x_2 \ge 0" /> を付す。
              </li>
            </ol>
          </div>

          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">なぜ最適解は「頂点（端点）」にあるのか？</h3>
            <p className="text-xs sm:text-sm app-text-muted">
              1次不等式の共通部分である<strong>実行可能領域</strong>は、すべての辺が直線で囲まれた凸多角形（または凸多面体）になります。目的関数 <MathFormula math="c_1 x_1 + c_2 x_2 = z" /> の等高線は互いに平行な直線群であり、<MathFormula math="z" /> を動かして領域と最後に接する位置は（境界が平行な場合を除き）必ず<strong>多角形の端点</strong>に現れます。
            </p>
            <MathFormula
              block
              math={`\\text{勾配方向 } \\nabla z = (c_1, c_2) \\text{ へ等高線を平行移動（最小化では逆向き）}`}
            />
          </div>
        </div>
      </section>

      {/* 2. 想像パート */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-5 app-surface rounded-xl p-4 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold border-b border-[var(--border-subtle)] pb-2">
            2. 想像：2変数 LP インタラクティブ図解
          </h2>

          <div className="space-y-2">
            <div className="text-xs font-bold">土木計画シナリオを選択</div>
            <div className="flex flex-col gap-1.5">
              {(['concrete-mix', 'soil-stabilizer'] as PresetId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => loadPreset(id)}
                  className={`text-left rounded-lg px-3 py-2 text-xs font-semibold border cursor-pointer transition-colors ${
                    presetId === id
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'app-surface-subtle border-[var(--border-control)]'
                  }`}
                >
                  {PRESETS[id].title}
                </button>
              ))}
            </div>
          </div>

          <div className="app-surface-subtle rounded-lg p-3 overflow-x-auto">
            <MathFormula
              block
              math={`\\${preset.sense === 'max' ? 'max' : 'min'}\\; ${c1}x_1 + ${c2}x_2 \\quad \\text{s.t. } ${preset.c1Coeffs[0]}x_1 + ${preset.c1Coeffs[1]}x_2 ${preset.op === '<=' ? '\\le' : '\\ge'} ${b1},\\; ${preset.c2Coeffs[0]}x_1 + ${preset.c2Coeffs[1]}x_2 ${preset.op === '<=' ? '\\le' : '\\ge'} ${b2}`}
            />
          </div>

          <div className="space-y-3">
            <SliderInput
              label="変数 x₁ の目的係数"
              symbol="c₁"
              unit={preset.unitProfit}
              value={c1}
              min={1}
              max={10}
              step={1}
              onChange={setC1}
            />
            <SliderInput
              label="変数 x₂ の目的係数"
              symbol="c₂"
              unit={preset.unitProfit}
              value={c2}
              min={1}
              max={10}
              step={1}
              onChange={setC2}
            />
            <SliderInput
              label={preset.a1Label}
              symbol="b₁"
              unit=""
              value={b1}
              min={4}
              max={24}
              step={1}
              onChange={setB1}
            />
            <SliderInput
              label={preset.a2Label}
              symbol="b₂"
              unit=""
              value={b2}
              min={4}
              max={24}
              step={1}
              onChange={setB2}
            />

            <div className="border-t border-[var(--border-subtle)] pt-3 space-y-2">
              <SliderInput
                label="等高線の水準（平行移動）"
                symbol="z"
                unit={preset.unitProfit}
                value={zProbe}
                min={0}
                max={90}
                step={1}
                onChange={setZProbe}
              />
              {lpRes.optimalValue !== null && (
                <button
                  type="button"
                  onClick={() => setZProbe(round2(lpRes.optimalValue!))}
                  className="interactive-btn app-surface-subtle rounded-md px-3 py-1.5 text-xs font-semibold cursor-pointer"
                >
                  等高線を最適値 ({formatRational(lpRes.optimalValue)} {preset.unitProfit}) に合わせる
                </button>
              )}
            </div>
          </div>
        </aside>

        <div className="lg:col-span-7 space-y-4">
          <div className="app-surface rounded-xl overflow-hidden shadow-sm">
            <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">
                実行可能領域と目的関数等高線（図解法ビュー）
              </span>
              <span className="text-xs font-mono-num">
                {!lpRes.feasible ? (
                  <span className="text-red-700 dark:text-red-300 font-bold">実行可能領域なし</span>
                ) : lpRes.unbounded ? (
                  <span className="text-amber-700 dark:text-amber-300 font-bold">非有界</span>
                ) : (
                  <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                    最適解 ({formatRational(lpRes.optimalPoint!.x1)}, {formatRational(lpRes.optimalPoint!.x2)}), z* = {formatRational(lpRes.optimalValue!)} {preset.unitProfit}
                  </span>
                )}
              </span>
            </div>

            <div className="p-4 flex flex-col items-center">
              <svg
                viewBox={`0 0 ${w} ${h}`}
                className="w-full max-w-[540px] h-auto select-none"
                role="img"
                aria-label="2変数線形計画問題の実行可能領域と等高線のグラフ"
              >
                {/* 格子線 */}
                {gridTicks.map((t) => (
                  <g key={`grid-${t}`}>
                    <line
                      x1={toX(t)}
                      y1={padT}
                      x2={toX(t)}
                      y2={padT + plotH}
                      stroke="currentColor"
                      strokeOpacity="0.1"
                    />
                    <line
                      x1={padL}
                      y1={toY(t)}
                      x2={padL + plotW}
                      y2={toY(t)}
                      stroke="currentColor"
                      strokeOpacity="0.1"
                    />
                    <text
                      x={toX(t)}
                      y={padT + plotH + 16}
                      textAnchor="middle"
                      className="text-xs fill-[var(--text-muted)] font-mono-num"
                    >
                      {t}
                    </text>
                    <text
                      x={padL - 8}
                      y={toY(t) + 4}
                      textAnchor="end"
                      className="text-xs fill-[var(--text-muted)] font-mono-num"
                    >
                      {t}
                    </text>
                  </g>
                ))}

                {/* 座標軸 */}
                <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="currentColor" strokeWidth="1.5" />
                <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="currentColor" strokeWidth="1.5" />
                <text x={padL + plotW - 4} y={padT + plotH + 30} textAnchor="end" className="text-xs font-bold fill-current">
                  x₁
                </text>
                <text x={padL - 28} y={padT + 10} className="text-xs font-bold fill-current">
                  x₂
                </text>

                {/* 実行可能領域ポリゴン */}
                {lpRes.feasible && polyPoints && (
                  <polygon
                    points={polyPoints}
                    fill="var(--diagram-blue-fill)"
                    stroke="var(--diagram-blue)"
                    strokeWidth="2"
                  />
                )}

                {/* 各制約境界線 */}
                {constraints.map((con, idx) => {
                  const seg = clipLineToBox(con.a1, con.a2, con.b, maxVal, maxVal);
                  if (!seg) return null;
                  return (
                    <line
                      key={`con-${idx}`}
                      x1={toX(seg[0].x1)}
                      y1={toY(seg[0].x2)}
                      x2={toX(seg[1].x1)}
                      y2={toY(seg[1].x2)}
                      stroke={lineColors[idx % lineColors.length]}
                      strokeWidth="2"
                      strokeOpacity="0.85"
                    />
                  );
                })}

                {/* ユーザー探索中の等高線 */}
                {probeSeg && (
                  <line
                    x1={toX(probeSeg[0].x1)}
                    y1={toY(probeSeg[0].x2)}
                    x2={toX(probeSeg[1].x1)}
                    y2={toY(probeSeg[1].x2)}
                    stroke="var(--diagram-amber)"
                    strokeWidth="2.2"
                    strokeDasharray="6 4"
                  />
                )}

                {/* 最適等高線 */}
                {optSeg && (
                  <line
                    x1={toX(optSeg[0].x1)}
                    y1={toY(optSeg[0].x2)}
                    x2={toX(optSeg[1].x1)}
                    y2={toY(optSeg[1].x2)}
                    stroke="var(--diagram-emerald)"
                    strokeWidth="2.5"
                  />
                )}

                {/* 端点と最適点 */}
                {lpRes.vertices.map((v, idx) => {
                  if (v.x1 > maxVal + 0.5 || v.x2 > maxVal + 0.5) return null;
                  const px = toX(v.x1);
                  const py = toY(v.x2);
                  return (
                    <g key={`v-${idx}`}>
                      <circle
                        cx={px}
                        cy={py}
                        r={v.isOptimal ? 6.5 : 4}
                        fill={v.isOptimal ? 'var(--diagram-emerald)' : 'var(--diagram-halo)'}
                        stroke={v.isOptimal ? 'var(--diagram-halo)' : 'var(--diagram-blue)'}
                        strokeWidth="2"
                      />
                      {v.isOptimal && (
                        <text
                          x={px + 8}
                          y={py - 8}
                          className="text-xs font-bold fill-[var(--diagram-emerald)] font-mono-num"
                        >
                          最適 ({formatRational(v.x1)}, {formatRational(v.x2)})
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs app-text-muted pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-[var(--diagram-blue-fill)] border border-[var(--diagram-blue)] inline-block" aria-hidden="true" />
                  実行可能領域
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 bg-[var(--diagram-amber)] inline-block" aria-hidden="true" />
                  操作中の等高線 (z={zProbe})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 bg-[var(--diagram-emerald)] inline-block" aria-hidden="true" />
                  最適等高線
                </span>
              </div>
            </div>
          </div>

          {/* 端点評価一覧表 */}
          <div className="app-surface rounded-xl p-4 shadow-sm space-y-2.5">
            <h3 className="text-xs font-bold app-text-muted">
              実行可能領域の端点（頂点）一覧と目的関数値
            </h3>
            {lpRes.vertices.length === 0 ? (
              <p className="text-xs text-red-700 dark:text-red-300">
                すべての制約条件と非負条件を同時に満たす領域がありません。制約を緩めてください。
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs font-mono-num">
                  <thead>
                    <tr className="app-surface-subtle border-b border-[var(--border-subtle)]">
                      <th scope="col" className="px-3 py-1.5 text-left">端点 (x₁, x₂)</th>
                      <th scope="col" className="px-3 py-1.5 text-right">
                        目的関数値 ({c1}x₁ + {c2}x₂)
                      </th>
                      <th scope="col" className="px-3 py-1.5 text-center">判定</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {lpRes.vertices.map((v, i) => (
                      <tr
                        key={`vt-${i}`}
                        className={
                          v.isOptimal
                            ? 'bg-emerald-500/15 font-bold text-emerald-800 dark:text-emerald-200'
                            : ''
                        }
                      >
                        <td className="px-3 py-1.5">
                          ({formatRational(v.x1)}, {formatRational(v.x2)})
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          {formatRational(v.z)} {preset.unitProfit}
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          {v.isOptimal ? '最適解' : '端点'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. 演習パート */}
      <ChapterExercisePanel
        chapterTitle="第1章：線形計画の定式化と図解法"
        exercises={exercises}
        completedIds={completedIds}
        onToggleDone={onToggleDone}
        onMarkDone={onMarkDone}
      />
    </div>
  );
};
