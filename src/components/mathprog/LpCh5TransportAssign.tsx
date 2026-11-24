import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  formatRational,
  round2,
  solveAssignmentManhattan,
  solveTransportation,
  type GridPoint,
} from '../../utils/mathProgramming';
import { SliderInput } from '../SliderInput';
import { MathFormula } from '../MathFormula';
import { ChapterExercisePanel, type ContinuumExercise } from '../continuum/ChapterExercisePanel';

interface LpCh5Props {
  completedIds: string[];
  onToggleDone: (id: string) => void;
  onMarkDone: (id: string) => void;
}

const TRANSPORT_COSTS = [
  [4, 7, 11],
  [6, 5, 8],
  [9, 6, 3],
];
const PLANT_NAMES = ['プラント甲', 'プラント乙', 'プラント丙'];
const SITE_NAMES = ['現場 1', '現場 2', '現場 3'];
const DEMAND = [25, 25, 30];
const DEFAULT_SUPPLY: [number, number, number] = [40, 28, 22];

const DEFAULT_VEHICLES: GridPoint[] = [
  { id: 'A', label: '車A', x: 1, y: 1 },
  { id: 'B', label: '車B', x: 2, y: 5 },
  { id: 'C', label: '車C', x: 5, y: 5 },
];
const TARGET_BRIDGES: GridPoint[] = [
  { id: 'P', label: '橋梁P', x: 4, y: 5 },
  { id: 'Q', label: '橋梁Q', x: 7, y: 7 },
  { id: 'R', label: '橋梁R', x: 1, y: 4 },
];

export const LpCh5TransportAssign: React.FC<LpCh5Props> = ({
  completedIds,
  onToggleDone,
  onMarkDone,
}) => {
  // 2A: 輸送問題
  const [supply, setSupply] = useState<[number, number, number]>([...DEFAULT_SUPPLY]);
  const [expandC, setExpandC] = useState(1);

  const trRes = useMemo(
    () => solveTransportation(TRANSPORT_COSTS, supply, DEMAND),
    [supply]
  );
  const trExpanded = useMemo(
    () => solveTransportation(TRANSPORT_COSTS, [supply[0], supply[1], supply[2] + expandC], DEMAND),
    [supply, expandC]
  );

  // 2B: 割当問題
  const [vehicles, setVehicles] = useState<GridPoint[]>(DEFAULT_VEHICLES);
  const [assignMode, setAssignMode] = useState<'both' | 'optimal' | 'greedy'>('both');

  const assignRes = useMemo(
    () => solveAssignmentManhattan(vehicles, TARGET_BRIDGES),
    [vehicles]
  );

  const resetTransport = () => {
    setSupply([...DEFAULT_SUPPLY]);
    setExpandC(1);
  };

  const resetAssign = () => {
    setVehicles(DEFAULT_VEHICLES);
    setAssignMode('both');
  };

  const exercises: ContinuumExercise[] = [
    {
      id: 'lp-ch5-q1',
      title: '問1：プラント乙の出荷能力増強に伴う最小総輸送費用の算出',
      category: '輸送問題とシャドー・プライス',
      statement:
        '初期条件（供給能力 甲=40, 乙=28, 丙=22、需要 25, 25, 30、最小総費用 365 万円、各プラントのシャドー・プライス 甲=0, 乙=2, 丙=7 万円/単位）において、プラント乙の出荷能力を 28 台から 29 台へ 1 単位増強したときの新しい最小総輸送費用（万円）を求めよ。',
      mathContext:
        '\\Delta C_{\\text{輸送}} = -(\\text{シャドー・プライス}) \\times \\Delta S_2 \\quad (\\Delta S_2 = 1)',
      kind: 'numeric',
      expectedValue: 363,
      tolerance: 0.2,
      unit: '万円',
      inputHint: 'プラント乙のシャドー・プライス 2 万円/単位は、能力が 1 台増えたときの総輸送費用の減少額を表します。',
      hint: '初期最小費用 365 万円から、シャドー・プライス 2 万円を引きます。また実際にルートを見ると甲→現場2(単価7)が1台減り、乙→現場2(単価5)が1台増えるため差額 -2 万円になります。',
      steps: [
        {
          label: 'シャドー・プライス（2万円/単位）による減少額を確認する',
          math: '365 - 2 \\times 1 = 363\\text{ 万円}',
        },
        {
          label: '輸送ルートの入れ替えでも検算する（甲→現場2が 5→4 台、乙→現場2が 20→21 台）',
          math: '\\Delta C = (5 - 7) \\times 1 = -2\\text{ 万円} \\implies 363\\text{ 万円（なお大幅増強時は基底変化に注意）}',
        },
      ],
      answerSummary: '363 万円（増強前 365 万円から 2 万円減少）',
      onApplyPreset: () => {
        setSupply([40, 29, 22]);
        setExpandC(1);
      },
    },
    {
      id: 'lp-ch5-q2',
      title: '問2：3×3 正方割当問題（パトロール車 3 台 → 橋梁 3 箇所）の最小合計距離',
      category: '割当問題（マンハッタン距離）',
      statement:
        '緊急パトロール車 A(1,1), B(2,5), C(5,5) から、点検対象橋梁 P(4,5), Q(7,7), R(1,4) へ各車 1 箇所ずつ（1 対 1）割り当てる。マンハッタン距離 d((x₁,y₁),(x₂,y₂)) = |x₁−x₂| + |y₁−y₂| に基づく全体最適解の合計移動距離の最小値（km）を求めよ。',
      mathContext:
        'd_{AP}=7,\\ d_{AQ}=12,\\ d_{AR}=3,\\quad d_{BP}=2,\\ d_{BQ}=7,\\ d_{BR}=2,\\quad d_{CP}=1,\\ d_{CQ}=4,\\ d_{CR}=5',
      kind: 'numeric',
      expectedValue: 9,
      tolerance: 0.1,
      unit: 'km',
      inputHint: '近い順に C→P (1 km) を確定する貪欲法（合計 15 km）ではなく、全 6 通りの組合せを比較します。',
      hint: '車Aは橋梁Qから非常に遠い（12 km）ため、車Cを橋梁Q(4 km)に回し、車Aを橋梁R(3 km)、車Bを橋梁P(2 km)へ割り当てます。',
      steps: [
        {
          label: '貪欲法（最短ペア順確定）の結果を確認する',
          math: '\\text{C→P (1) + B→R (2) + A→Q (12) = 15 km（最大単車距離 12 km）}',
        },
        {
          label: '全体最適解（A→R, B→P, C→Q）の合計距離を求める',
          math: 'd_{AR} + d_{BP} + d_{CQ} = 3 + 2 + 4 = 9\\text{ km（最大単車距離も 4 km へ短縮）}',
        },
      ],
      answerSummary: '9 km（A→R: 3 km, B→P: 2 km, C→Q: 4 km。貪欲法 15 km より 6 km 短縮）',
      onApplyPreset: resetAssign,
    },
  ];

  const shadowLinearSaving = trRes.supplyShadowPrices[2] * expandC;
  const actualSaving =
    trExpanded.feasible && trRes.feasible ? trRes.totalCost - trExpanded.totalCost : 0;

  return (
    <div className="space-y-6">
      {/* 1. 理解パート */}
      <section className="app-surface rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <h2 className="text-base sm:text-lg font-bold">
            1. 理解：ネットワーク輸送計画と割当最適化（局所貪欲法の限界）
          </h2>
          <span className="rounded-md bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
            第5章：輸送問題と割当問題
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm leading-relaxed">
          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">輸送問題とシャドー・プライスの投資判断</h3>
            <p className="text-xs app-text-muted">
              各拠点 <MathFormula math="i" /> の供給上限 <MathFormula math="S_i" /> と需要地 <MathFormula math="j" /> の要求量 <MathFormula math="D_j" /> を満たしつつ総輸送費 <MathFormula math="\sum c_{ij} x_{ij}" /> を最小化する問題です。供給制約のシャドー・プライスは「能力を1単位増強したときに輸送費がいくら減るか」を示し、設備増強コストとの比較に直結します（ただし大幅増強時は基底が変化します）。
            </p>
          </div>

          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">割当問題：なぜ「近い順」は失敗するのか？</h3>
            <p className="text-xs app-text-muted">
              1対1の配車・割当で「最も近いペアを1組確定して次を選ぶ」<strong>貪欲法</strong>は、他の対象にとって重要な担い手を先に奪ってしまい、残された対象の距離が跳ね上がることがあります。全体最適ではすべての組合せを同時に評価します。
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-indigo-500/35 bg-indigo-500/10 p-4 space-y-1.5 text-xs leading-relaxed">
          <div className="font-bold text-indigo-800 dark:text-indigo-200">
            技術者倫理とモデル化の限界（効率性 vs 公平性・安全性・レジリエンス）
          </div>
          <p className="app-text-muted">
            数理計画における「最適解」は、設定した<strong>単一の目的関数と確定的な前提のもとでの最適</strong>に過ぎません。たとえば緊急点検配車では「総移動距離の最小化（効率性）」と「最も遅れる現場への最大到着時間の最小化・重要度の高い老朽橋梁の優先（公平性・安全性）」が対立し得ます。また、輸送計画でも費用だけでなく環境負荷（CO₂・騒音）、労務時間規制、需要変動や災害時の冗長能力（レジリエンス）を含めた総合的な技術的判断が求められます。
          </p>
        </div>
      </section>

      {/* 2A. 生コンクリート輸送計画シミュレーター */}
      <section className="app-surface rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <div>
            <h2 className="text-sm sm:text-base font-bold">
              2A. 想像：生コンクリート資材輸送ネットワーク＆能力増強シミュレーション
            </h2>
            <p className="text-xs app-text-muted">
              需要合計 {DEMAND.reduce((a, b) => a + b, 0)} 単位（現場1:25, 現場2:25, 現場3:30）。供給能力を変えると輸送ルートとシャドー・プライスが即時更新されます。
            </p>
          </div>
          <button
            type="button"
            onClick={resetTransport}
            className="interactive-btn app-surface-subtle inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            初期値へ戻す
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-5 space-y-3">
            {PLANT_NAMES.map((pName, idx) => (
              <SliderInput
                key={pName}
                label={`${pName} 出荷能力`}
                symbol={`S_${idx + 1}`}
                unit="台"
                value={supply[idx]}
                min={10}
                max={50}
                step={1}
                onChange={(v) => {
                  const next: [number, number, number] = [...supply] as [number, number, number];
                  next[idx] = v;
                  setSupply(next);
                }}
              />
            ))}

            <div className="app-surface-subtle rounded-lg p-3.5 space-y-2 border-t border-[var(--border-subtle)]">
              <SliderInput
                label="プラント丙 追加増強テスト"
                symbol="+ΔS₃"
                unit="台"
                value={expandC}
                min={1}
                max={15}
                step={1}
                onChange={setExpandC}
              />
              <div className="text-xs space-y-1 font-mono-num">
                <div>
                  シャドー・プライス線形予測（{formatRational(trRes.supplyShadowPrices[2])}×{expandC}）：
                  <strong> {formatRational(shadowLinearSaving)} 万円減</strong>
                </div>
                <div>
                  真のLP再最適化による削減額：
                  <strong className="text-blue-700 dark:text-blue-300">
                    {' '}
                    {formatRational(actualSaving)} 万円減
                  </strong>
                  {Math.abs(shadowLinearSaving - actualSaving) > 1e-5 && (
                    <span className="ml-1.5 text-amber-700 dark:text-amber-300 font-bold">
                      （基底変化あり！）
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {/* 二部グラフSVG */}
            <div className="app-surface-subtle rounded-xl p-3 flex flex-col items-center">
              <div className="w-full flex flex-wrap items-center justify-between gap-2 px-1 pb-2 text-xs">
                <span className="font-bold">最適輸送フロー図</span>
                <span className="font-mono-num font-bold text-emerald-700 dark:text-emerald-300">
                  {trRes.feasible
                    ? `最小総輸送費用: ${formatRational(trRes.totalCost)} 万円`
                    : '供給合計が需要合計(80)未満のため実行不能'}
                </span>
              </div>
              <svg
                viewBox="0 0 460 220"
                className="w-full max-w-[460px] h-auto select-none"
                role="img"
                aria-label="プラント甲乙丙から現場1・2・3への最適輸送フロー図"
              >
                {/* 辺（輸送量 > 0） */}
                {trRes.feasible &&
                  PLANT_NAMES.map((_, i) =>
                    SITE_NAMES.map((__, j) => {
                      const flow = trRes.shipments[i][j];
                      if (flow <= 1e-6) return null;
                      const x1 = 128;
                      const y1 = 42 + i * 68;
                      const x2 = 332;
                      const y2 = 42 + j * 68;
                      const mx = x1 + (x2 - x1) * (0.42 + (i - j) * 0.06);
                      const my = y1 + (y2 - y1) * (0.42 + (i - j) * 0.06);
                      return (
                        <g key={`edge-${i}-${j}`}>
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="var(--diagram-blue)"
                            strokeWidth={Math.max(1.8, Math.min(8, flow / 4.5))}
                            strokeOpacity="0.72"
                          />
                          <rect
                            x={mx - 18}
                            y={my - 9}
                            width={36}
                            height={18}
                            rx={4}
                            fill="var(--diagram-halo)"
                            stroke="var(--diagram-blue)"
                            strokeWidth="1"
                          />
                          <text
                            x={mx}
                            y={my + 4}
                            textAnchor="middle"
                            className="text-xs font-bold fill-current font-mono-num"
                          >
                            {round2(flow)}
                          </text>
                        </g>
                      );
                    })
                  )}

                {/* 供給ノード */}
                {PLANT_NAMES.map((name, i) => (
                  <g key={`p-${i}`}>
                    <rect
                      x={12}
                      y={22 + i * 68}
                      width={116}
                      height={40}
                      rx={8}
                      fill="var(--diagram-halo)"
                      stroke="var(--diagram-teal)"
                      strokeWidth="1.8"
                    />
                    <text x={70} y={39 + i * 68} textAnchor="middle" className="text-xs font-bold fill-current">
                      {name} ({supply[i]})
                    </text>
                    <text
                      x={70}
                      y={55 + i * 68}
                      textAnchor="middle"
                      className="text-xs fill-[var(--diagram-teal)] font-mono-num font-semibold"
                    >
                      SP: {formatRational(trRes.supplyShadowPrices[i])} 万円
                    </text>
                  </g>
                ))}

                {/* 需要ノード */}
                {SITE_NAMES.map((name, j) => (
                  <g key={`s-${j}`}>
                    <rect
                      x={332}
                      y={22 + j * 68}
                      width={116}
                      height={40}
                      rx={8}
                      fill="var(--diagram-halo)"
                      stroke="var(--diagram-indigo)"
                      strokeWidth="1.8"
                    />
                    <text x={390} y={40 + j * 68} textAnchor="middle" className="text-xs font-bold fill-current">
                      {name}
                    </text>
                    <text
                      x={390}
                      y={55 + j * 68}
                      textAnchor="middle"
                      className="text-xs fill-[var(--text-muted)] font-mono-num"
                    >
                      需要 {DEMAND[j]} 台
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* 輸送費＆最適輸送量テーブル */}
            <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
              <table className="w-full border-collapse text-xs font-mono-num">
                <thead>
                  <tr className="app-surface-subtle border-b border-[var(--border-subtle)]">
                    <th scope="col" className="px-2.5 py-2 text-left">拠点</th>
                    {SITE_NAMES.map((s) => (
                      <th key={s} scope="col" className="px-2.5 py-2 text-right">
                        {s}（費用/輸送量）
                      </th>
                    ))}
                    <th scope="col" className="px-2.5 py-2 text-right">シャドー・プライス</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {PLANT_NAMES.map((p, i) => (
                    <tr key={p}>
                      <th scope="row" className="px-2.5 py-2 text-left font-bold">
                        {p}
                      </th>
                      {SITE_NAMES.map((_, j) => (
                        <td key={`${i}-${j}`} className="px-2.5 py-2 text-right">
                          <span className="app-text-muted">{TRANSPORT_COSTS[i][j]}万円</span> /{' '}
                          <strong
                            className={
                              trRes.shipments[i][j] > 1e-6
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'app-text-muted'
                            }
                          >
                            {round2(trRes.shipments[i][j])}
                          </strong>
                        </td>
                      ))}
                      <td className="px-2.5 py-2 text-right font-bold text-emerald-700 dark:text-emerald-300">
                        {formatRational(trRes.supplyShadowPrices[i])} 万円/単位
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 2B. 緊急パトロール車割当シミュレーター */}
      <section className="app-surface rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <div>
            <h2 className="text-sm sm:text-base font-bold">
              2B. 想像：格子道路網での緊急パトロール車割当（全体最適 vs 貪欲法）
            </h2>
            <p className="text-xs app-text-muted">
              車両と橋梁のマンハッタン距離 |x₁−x₂| + |y₁−y₂| を使い、順番確定の貪欲法と全体最適の差を比較します。
            </p>
          </div>
          <button
            type="button"
            onClick={resetAssign}
            className="interactive-btn app-surface-subtle inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            初期座標へ戻す
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-5 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'both', label: '両方重ね比較' },
                  { id: 'optimal', label: '全体最適のみ' },
                  { id: 'greedy', label: '貪欲法のみ' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAssignMode(m.id)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold border cursor-pointer ${
                    assignMode === m.id
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'app-surface-subtle border-[var(--border-control)]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="app-surface-subtle rounded-lg p-3 space-y-2">
              <div className="text-xs font-bold">車C（橋梁Pに近い待機車両）の座標調整</div>
              <SliderInput
                label="車C の x 座標"
                symbol="x_C"
                unit="km"
                value={vehicles[2].x}
                min={0}
                max={8}
                step={1}
                onChange={(nx) =>
                  setVehicles((prev) =>
                    prev.map((v, idx) => (idx === 2 ? { ...v, x: nx } : v))
                  )
                }
              />
              <SliderInput
                label="車C の y 座標"
                symbol="y_C"
                unit="km"
                value={vehicles[2].y}
                min={0}
                max={8}
                step={1}
                onChange={(ny) =>
                  setVehicles((prev) =>
                    prev.map((v, idx) => (idx === 2 ? { ...v, y: ny } : v))
                  )
                }
              />
            </div>

            {/* マンハッタン距離表 */}
            <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
              <table className="w-full border-collapse text-xs font-mono-num">
                <thead>
                  <tr className="app-surface-subtle border-b border-[var(--border-subtle)]">
                    <th scope="col" className="px-3 py-1.5 text-left">マンハッタン距離 (km)</th>
                    {TARGET_BRIDGES.map((b) => (
                      <th key={b.id} scope="col" className="px-3 py-1.5 text-right">
                        {b.label} ({b.x},{b.y})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {vehicles.map((v, vi) => (
                    <tr key={v.id}>
                      <th scope="row" className="px-3 py-1.5 text-left font-bold">
                        {v.label} ({v.x},{v.y})
                      </th>
                      {TARGET_BRIDGES.map((b, ti) => (
                        <td key={`${v.id}-${b.id}`} className="px-3 py-1.5 text-right">
                          {assignRes.distanceMatrix[vi][ti]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 結果比較カード */}
            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono-num">
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 space-y-1">
                <div className="font-bold text-emerald-800 dark:text-emerald-200">
                  全体最適：{assignRes.optimal.totalDistance} km
                </div>
                {assignRes.optimal.pairs.map((p) => (
                  <div key={`op-${p.targetIndex}`}>
                    {p.vehicleLabel} → {p.targetLabel} ({p.distance} km)
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-1">
                <div className="font-bold text-amber-800 dark:text-amber-200">
                  貪欲法：{assignRes.greedy.totalDistance} km
                </div>
                {assignRes.greedy.pairs.map((p) => (
                  <div key={`gr-${p.targetIndex}`}>
                    {p.vehicleLabel} → {p.targetLabel} ({p.distance} km)
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 app-surface-subtle rounded-xl p-4 flex flex-col items-center">
            {(() => {
              const gw = 380;
              const gh = 340;
              const pad = 34;
              const stepPx = (gw - pad * 2) / 8;
              const gx = (x: number) => pad + x * stepPx;
              const gy = (y: number) => gh - pad - y * stepPx;

              return (
                <svg
                  viewBox={`0 0 ${gw} ${gh}`}
                  className="w-full max-w-[390px] h-auto select-none"
                  role="img"
                  aria-label="格子道路網における緊急パトロール車と橋梁の位置およびマンハッタン移動経路"
                >
                  {/* 格子 */}
                  {Array.from({ length: 9 }, (_, i) => (
                    <g key={`g-${i}`}>
                      <line
                        x1={gx(i)}
                        y1={gy(0)}
                        x2={gx(i)}
                        y2={gy(8)}
                        stroke="currentColor"
                        strokeOpacity="0.16"
                      />
                      <line
                        x1={gx(0)}
                        y1={gy(i)}
                        x2={gx(8)}
                        y2={gy(i)}
                        stroke="currentColor"
                        strokeOpacity="0.16"
                      />
                      <text x={gx(i)} y={gy(0) + 15} textAnchor="middle" className="text-xs fill-[var(--text-muted)] font-mono-num">
                        {i}
                      </text>
                      <text x={gx(0) - 10} y={gy(i) + 3} textAnchor="end" className="text-xs fill-[var(--text-muted)] font-mono-num">
                        {i}
                      </text>
                    </g>
                  ))}

                  {/* 貪欲法L字ルート */}
                  {(assignMode === 'both' || assignMode === 'greedy') &&
                    assignRes.greedy.pairs.map((p) => {
                      const v = vehicles[p.vehicleIndex];
                      const t = TARGET_BRIDGES[p.targetIndex];
                      return (
                        <polyline
                          key={`gr-line-${p.targetIndex}`}
                          points={`${gx(v.x)},${gy(v.y)} ${gx(v.x)},${gy(t.y)} ${gx(t.x)},${gy(t.y)}`}
                          fill="none"
                          stroke="var(--diagram-amber)"
                          strokeWidth="2.8"
                          strokeDasharray="6 4"
                        />
                      );
                    })}

                  {/* 全体最適L字ルート */}
                  {(assignMode === 'both' || assignMode === 'optimal') &&
                    assignRes.optimal.pairs.map((p) => {
                      const v = vehicles[p.vehicleIndex];
                      const t = TARGET_BRIDGES[p.targetIndex];
                      return (
                        <polyline
                          key={`opt-line-${p.targetIndex}`}
                          points={`${gx(v.x)},${gy(v.y)} ${gx(t.x)},${gy(v.y)} ${gx(t.x)},${gy(t.y)}`}
                          fill="none"
                          stroke="var(--diagram-emerald)"
                          strokeWidth="2.8"
                        />
                      );
                    })}

                  {/* 車両マーカー */}
                  {vehicles.map((v) => (
                    <g key={v.id}>
                      <circle
                        cx={gx(v.x)}
                        cy={gy(v.y)}
                        r="7"
                        fill="var(--diagram-blue)"
                        stroke="var(--diagram-halo)"
                        strokeWidth="2"
                      />
                      <text x={gx(v.x) + 10} y={gy(v.y) + 4} className="text-xs font-bold fill-current">
                        {v.label}
                      </text>
                    </g>
                  ))}

                  {/* 橋梁マーカー */}
                  {TARGET_BRIDGES.map((b) => (
                    <g key={b.id}>
                      <polygon
                        points={`${gx(b.x)},${gy(b.y) - 8} ${gx(b.x) + 8},${gy(b.y)} ${gx(b.x)},${gy(b.y) + 8} ${gx(b.x) - 8},${gy(b.y)}`}
                        fill="var(--diagram-red)"
                        stroke="var(--diagram-halo)"
                        strokeWidth="1.5"
                      />
                      <text x={gx(b.x) - 10} y={gy(b.y) - 10} textAnchor="end" className="text-xs font-bold fill-current">
                        {b.label}
                      </text>
                    </g>
                  ))}
                </svg>
              );
            })()}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs app-text-muted pt-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-[var(--diagram-emerald)] inline-block" aria-hidden="true" />
                全体最適 ({assignRes.optimal.totalDistance} km)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-[var(--diagram-amber)] inline-block" aria-hidden="true" />
                貪欲法 ({assignRes.greedy.totalDistance} km)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 演習パート */}
      <ChapterExercisePanel
        chapterTitle="第5章：輸送問題と割当問題（ネットワーク計画）"
        exercises={exercises}
        completedIds={completedIds}
        onToggleDone={onToggleDone}
        onMarkDone={onMarkDone}
      />
    </div>
  );
};
