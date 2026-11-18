import React, { useMemo, useState } from 'react';
import {
  flipTensorSign,
  round2,
  type SignConvention,
  type StressTensor3D,
} from '../../utils/continuumPhysics';
import { SliderInput } from '../SliderInput';
import { MathFormula } from '../MathFormula';
import { ChapterExercisePanel, type ContinuumExercise } from './ChapterExercisePanel';

interface Ch1Props {
  completedIds: string[];
  onToggleDone: (id: string) => void;
  onMarkDone: (id: string) => void;
}

const DEFAULT_TENSOR: StressTensor3D = {
  sxx: 120,
  syy: 80,
  szz: 200,
  txy: 35,
  tyz: -15,
  tzx: 25,
};

export const Ch1StressTensor: React.FC<Ch1Props> = ({
  completedIds,
  onToggleDone,
  onMarkDone,
}) => {
  const [tensor, setTensor] = useState<StressTensor3D>(DEFAULT_TENSOR);
  const [convention, setConvention] = useState<SignConvention>('compression');

  const handleToggleConvention = (next: SignConvention) => {
    if (next === convention) return;
    setConvention(next);
    setTensor((prev) => flipTensorSign(prev));
  };

  // 物理的な圧縮量（>0 が圧縮、<0 が引張）を矢印向き決定用に統一算出
  const physicalComp = useMemo(
    () => (convention === 'compression' ? tensor : flipTensorSign(tensor)),
    [tensor, convention]
  );

  const update = (k: keyof StressTensor3D, v: number) =>
    setTensor((prev) => ({ ...prev, [k]: v }));

  const exercises: ContinuumExercise[] = [
    {
      id: 'ch1-q1',
      title: '問1：応力テンソルの独立成分が6個になる物理的理由',
      category: '対称性・つり合い',
      statement:
        '3次元空間の応力テンソルは 3×3 の9成分で表されるが、独立な成分は6個に減る（τ_xy = τ_yx など）。その理由として正しいものはどれか。',
      kind: 'choice',
      choices: [
        { id: 'a', label: '微小要素まわりの力のモーメントのつり合いが成り立つため' },
        { id: 'b', label: '地盤が等方弾性体でありポアソン比が 0.5 であるため' },
        { id: 'c', label: '体積力（自重）が鉛直方向にしか働かないため' },
        { id: 'd', label: '主応力座標系では垂直応力がすべて等しくなるため' },
      ],
      correctChoiceId: 'a',
      hint: '微小立方体の中心まわりの回転（角運動量のつり合い）を考えます。体積力や慣性モーメントは辺長の高次の微小量として消えます。',
      steps: [
        {
          label: '微小立方体 (dx, dy, dz) の中心まわりのモーメントのつり合い式を立てる',
          math: '\\sum M_z = (\\tau_{xy}\\,dy\\,dz)\\cdot dx - (\\tau_{yx}\\,dx\\,dz)\\cdot dy = 0',
        },
        {
          label: '体積 dx·dy·dz で割ると対称性が導かれる',
          math: '\\tau_{xy} = \\tau_{yx},\\quad \\tau_{yz} = \\tau_{zy},\\quad \\tau_{zx} = \\tau_{xz}',
        },
      ],
      answerSummary: '微小要素まわりのモーメントのつり合い（対称性 τ_ij = τ_ji）',
    },
    {
      id: 'ch1-q2',
      title: '問2：圧縮正規約と引張正規約の変換',
      category: '符号規約',
      statement:
        '連続体力学（引張正）の解析で、ある土要素の応力状態が σ_z = -180 kPa, σ_x = -90 kPa, τ_zx = 30 kPa と得られた。日本の土質力学教科書（圧縮正）の規約に読み替えたときの鉛直応力 σ_z の値はいくらか。',
      kind: 'numeric',
      expectedValue: 180,
      tolerance: 0.5,
      unit: 'kPa',
      inputHint: '圧縮を正（＋）として数値を入力してください。',
      hint: '引張正で負（−）の値は圧縮状態を表します。圧縮正の規約では符号を反転します。',
      steps: [
        {
          label: '符号規約の変換式を適用する',
          math: '\\sigma^{(\\text{圧縮正})} = -\\sigma^{(\\text{引張正})}',
        },
        {
          label: 'σ_z = -180 kPa を圧縮正へ変換する',
          math: '\\sigma_z^{(\\text{圧縮正})} = -(-180) = +180\\text{ kPa}',
        },
      ],
      answerSummary: '180 kPa（圧縮）',
      onApplyPreset: () => {
        setConvention('compression');
        setTensor({ sxx: 90, syy: 90, szz: 180, txy: 0, tyz: 0, tzx: -30 });
      },
    },
  ];

  // アイソメトリック座標投影 (x: 右下, y: 左下, z: 上)
  const cx = 180;
  const cy = 148;
  const iso = (x: number, y: number, z: number): [number, number] => [
    cx + (x - y) * 0.866,
    cy + (x + y) * 0.5 - z,
  ];
  const s = 54;
  const p000 = iso(0, 0, 0);
  const p100 = iso(s, 0, 0);
  const p110 = iso(s, s, 0);
  const p010 = iso(0, s, 0);
  const p001 = iso(0, 0, s);
  const p101 = iso(s, 0, s);
  const p111 = iso(s, s, s);
  const p011 = iso(0, s, s);
  const pts = (arr: [number, number][]) => arr.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

  // 各面中心
  const topC = iso(s / 2, s / 2, s); // +z 面
  const frontRightC = iso(s, s / 2, s / 2); // +x 面
  const frontLeftC = iso(s / 2, s, s / 2); // +y 面

  const arrowScale = (val: number) => Math.max(14, Math.min(34, (Math.abs(val) / 250) * 32));
  const zLen = arrowScale(physicalComp.szz);
  const xLen = arrowScale(physicalComp.sxx);
  const yLen = arrowScale(physicalComp.syy);

  const zIsComp = physicalComp.szz >= 0;
  const xIsComp = physicalComp.sxx >= 0;
  const yIsComp = physicalComp.syy >= 0;

  return (
    <div className="space-y-6">
      {/* 1. 理解パート */}
      <section className="app-surface rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <h2 className="text-base sm:text-lg font-bold">
            1. 理解：なぜ「応力」はベクトルではなく 3×3 テンソルなのか？
          </h2>
          <span className="rounded-md bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
            第1章：多次元場での応力の表現
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm leading-relaxed">
          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">2つの方向情報（面の向き × 力の向き）</h3>
            <p className="app-text-muted text-xs sm:text-sm">
              地盤内の1点でも、<strong>「どの向きの面を切るか（法線 <MathFormula math="i" />）」</strong>と<strong>「その面に働く力の成分方向（軸 <MathFormula math="j" />）」</strong>の2つの添字が必要なため、応力は 9成分を持つ2階テンソル <MathFormula math="\sigma_{ij}" /> で表されます。
            </p>
            <MathFormula
              block
              math={`\\boldsymbol{\\sigma} = \\begin{pmatrix} \\sigma_x & \\tau_{xy} & \\tau_{xz} \\\\ \\tau_{yx} & \\sigma_y & \\tau_{yz} \\\\ \\tau_{zx} & \\tau_{zy} & \\sigma_z \\end{pmatrix}`}
            />
          </div>

          <div className="app-surface-subtle rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm">対称性と符号規約の使い分け</h3>
            <ul className="text-xs sm:text-sm app-text-muted space-y-1.5 list-disc pl-4">
              <li>
                <strong>対称テンソル（独立成分は6個）</strong>：微小立方体の回転つり合いから <MathFormula math="\tau_{xy}=\tau_{yx},\ \tau_{yz}=\tau_{zy},\ \tau_{zx}=\tau_{xz}" /> が必ず成立します。
              </li>
              <li>
                <strong>土質力学は「圧縮正」</strong>：土は引張に弱く常に自重で圧縮されているため、圧縮を正（＋）とします（構造力学・弾性論の「引張正」とは符号が逆です）。
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 2. 想像パート（シミュレーター） */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-5 app-surface rounded-xl p-4 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2">
            <h3 className="text-sm font-bold">2. 想像：3次元応力テンソル操作</h3>
            <div className="inline-flex rounded-lg border border-[var(--border-control)] overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => handleToggleConvention('compression')}
                className={`px-2.5 py-1 font-semibold cursor-pointer ${
                  convention === 'compression'
                    ? 'bg-blue-700 text-white'
                    : 'app-surface-subtle'
                }`}
              >
                圧縮正 (土質)
              </button>
              <button
                type="button"
                onClick={() => handleToggleConvention('tension')}
                className={`px-2.5 py-1 font-semibold cursor-pointer ${
                  convention === 'tension'
                    ? 'bg-amber-700 text-white'
                    : 'app-surface-subtle'
                }`}
              >
                引張正 (連続体)
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              {
                label: '初期値 (一般3D)',
                v: DEFAULT_TENSOR,
              },
              {
                label: '等方圧縮',
                v: { sxx: 150, syy: 150, szz: 150, txy: 0, tyz: 0, tzx: 0 },
              },
              {
                label: '静止土圧 (K0=0.5)',
                v: { sxx: 100, syy: 100, szz: 200, txy: 0, tyz: 0, tzx: 0 },
              },
              {
                label: '純粋せん断',
                v: { sxx: 0, syy: 0, szz: 0, txy: 60, tyz: 0, tzx: 0 },
              },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() =>
                  setTensor(convention === 'compression' ? p.v : flipTensorSign(p.v))
                }
                className="interactive-btn app-surface-subtle rounded-md px-2.5 py-1 text-[11px] font-semibold cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <SliderInput
              label="x面垂直応力"
              symbol="σ_x"
              unit="kPa"
              value={tensor.sxx}
              min={-250}
              max={250}
              step={5}
              onChange={(v) => update('sxx', v)}
            />
            <SliderInput
              label="y面垂直応力"
              symbol="σ_y"
              unit="kPa"
              value={tensor.syy}
              min={-250}
              max={250}
              step={5}
              onChange={(v) => update('syy', v)}
            />
            <SliderInput
              label="z面垂直応力 (鉛直)"
              symbol="σ_z"
              unit="kPa"
              value={tensor.szz}
              min={-250}
              max={250}
              step={5}
              onChange={(v) => update('szz', v)}
            />
            <SliderInput
              label="xy せん断応力"
              symbol="τ_xy = τ_yx"
              unit="kPa"
              value={tensor.txy}
              min={-100}
              max={100}
              step={5}
              onChange={(v) => update('txy', v)}
            />
            <SliderInput
              label="yz せん断応力"
              symbol="τ_yz = τ_zy"
              unit="kPa"
              value={tensor.tyz}
              min={-100}
              max={100}
              step={5}
              onChange={(v) => update('tyz', v)}
            />
            <SliderInput
              label="zx せん断応力"
              symbol="τ_zx = τ_xz"
              unit="kPa"
              value={tensor.tzx}
              min={-100}
              max={100}
              step={5}
              onChange={(v) => update('tzx', v)}
            />
          </div>
        </aside>

        <div className="lg:col-span-7 space-y-4">
          <div className="app-surface rounded-xl overflow-hidden shadow-sm">
            <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm font-semibold">
                微小土要素の3次元応力イメージ（矢印は実際の力の向き）
              </span>
              <span className="text-xs app-text-muted">
                現在: <strong>{convention === 'compression' ? '圧縮正（＋が内向き）' : '引張正（＋が外向き）'}</strong>
              </span>
            </div>

            <div className="p-4 flex flex-col items-center">
              <svg
                viewBox="0 0 360 270"
                className="w-full max-w-[420px] h-auto select-none"
                role="img"
                aria-label="3次元微小立方体要素に作用する垂直応力とせん断応力の向き"
              >
                <defs>
                  <marker id="c1-arr-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--diagram-blue)" />
                  </marker>
                  <marker id="c1-arr-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--diagram-red)" />
                  </marker>
                  <marker id="c1-arr-teal" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--diagram-teal)" />
                  </marker>
                </defs>

                {/* 座標軸ミニガイド */}
                <g className="text-[10px] font-bold fill-[var(--text-muted)]">
                  <line x1="36" y1="225" x2="66" y2="242" stroke="var(--text-muted)" strokeWidth="1.5" />
                  <text x="70" y="246">x</text>
                  <line x1="36" y1="225" x2="10" y2="240" stroke="var(--text-muted)" strokeWidth="1.5" />
                  <text x="4" y="250">y</text>
                  <line x1="36" y1="225" x2="36" y2="192" stroke="var(--text-muted)" strokeWidth="1.5" />
                  <text x="33" y="186">z</text>
                </g>

                {/* 立方体 3面 (+z 上面, +x 右前面, +y 左前面) */}
                <polygon points={pts([p001, p101, p111, p011])} fill="var(--diagram-blue)" fillOpacity="0.14" stroke="currentColor" strokeOpacity="0.78" strokeWidth="1.6" />
                <polygon points={pts([p100, p110, p111, p101])} fill="var(--diagram-blue)" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.78" strokeWidth="1.6" />
                <polygon points={pts([p010, p110, p111, p011])} fill="var(--diagram-blue)" fillOpacity="0.20" stroke="currentColor" strokeOpacity="0.78" strokeWidth="1.6" />
                <polygon points={pts([p000, p100, p110, p010])} fill="none" stroke="currentColor" strokeOpacity="0.35" strokeDasharray="3 3" />

                {/* σ_z 矢印 (+z面) */}
                {Math.abs(physicalComp.szz) > 1 && (
                  <line
                    x1={zIsComp ? topC[0] : topC[0]}
                    y1={zIsComp ? topC[1] - zLen : topC[1]}
                    x2={topC[0]}
                    y2={zIsComp ? topC[1] : topC[1] - zLen}
                    stroke={zIsComp ? 'var(--diagram-blue)' : 'var(--diagram-red)'}
                    strokeWidth="2.5"
                    markerEnd={`url(#${zIsComp ? 'c1-arr-blue' : 'c1-arr-red'})`}
                  />
                )}
                <text x={topC[0] + 6} y={topC[1] - zLen - 4} className="text-[11px] font-bold fill-current font-mono-num">
                  σ_z={round2(tensor.szz)}
                </text>

                {/* σ_x 矢印 (+x面 = 右側面、法線方向は (+0.866, +0.5)) */}
                {Math.abs(physicalComp.sxx) > 1 && (
                  <line
                    x1={xIsComp ? frontRightC[0] + xLen * 0.866 : frontRightC[0]}
                    y1={xIsComp ? frontRightC[1] + xLen * 0.5 : frontRightC[1]}
                    x2={xIsComp ? frontRightC[0] : frontRightC[0] + xLen * 0.866}
                    y2={xIsComp ? frontRightC[1] : frontRightC[1] + xLen * 0.5}
                    stroke={xIsComp ? 'var(--diagram-blue)' : 'var(--diagram-red)'}
                    strokeWidth="2.5"
                    markerEnd={`url(#${xIsComp ? 'c1-arr-blue' : 'c1-arr-red'})`}
                  />
                )}
                <text x={frontRightC[0] + xLen * 0.866 + 6} y={frontRightC[1] + xLen * 0.5 + 4} className="text-[11px] font-bold fill-current font-mono-num">
                  σ_x={round2(tensor.sxx)}
                </text>

                {/* σ_y 矢印 (+y面 = 左前面、法線方向は (-0.866, +0.5)) */}
                {Math.abs(physicalComp.syy) > 1 && (
                  <line
                    x1={yIsComp ? frontLeftC[0] - yLen * 0.866 : frontLeftC[0]}
                    y1={yIsComp ? frontLeftC[1] + yLen * 0.5 : frontLeftC[1]}
                    x2={yIsComp ? frontLeftC[0] : frontLeftC[0] - yLen * 0.866}
                    y2={yIsComp ? frontLeftC[1] : frontLeftC[1] + yLen * 0.5}
                    stroke={yIsComp ? 'var(--diagram-blue)' : 'var(--diagram-red)'}
                    strokeWidth="2.5"
                    markerEnd={`url(#${yIsComp ? 'c1-arr-blue' : 'c1-arr-red'})`}
                  />
                )}
                <text x={frontLeftC[0] - yLen * 0.866 - 6} y={frontLeftC[1] + yLen * 0.5 + 12} textAnchor="end" className="text-[11px] font-bold fill-current font-mono-num">
                  σ_y={round2(tensor.syy)}
                </text>

                {/* せん断矢印の例 (τ_zx 上面x方向, τ_xy 前面) */}
                {Math.abs(tensor.tzx) > 1 && (
                  <line
                    x1={topC[0] - Math.sign(physicalComp.tzx) * 14}
                    y1={topC[1] - Math.sign(physicalComp.tzx) * 8}
                    x2={topC[0] + Math.sign(physicalComp.tzx) * 14}
                    y2={topC[1] + Math.sign(physicalComp.tzx) * 8}
                    stroke="var(--diagram-teal)"
                    strokeWidth="2"
                    markerEnd="url(#c1-arr-teal)"
                  />
                )}
                {Math.abs(tensor.txy) > 1 && (
                  <line
                    x1={frontRightC[0] + Math.sign(physicalComp.txy) * 12}
                    y1={frontRightC[1] - Math.sign(physicalComp.txy) * 7}
                    x2={frontRightC[0] - Math.sign(physicalComp.txy) * 12}
                    y2={frontRightC[1] + Math.sign(physicalComp.txy) * 7}
                    stroke="var(--diagram-teal)"
                    strokeWidth="2"
                    markerEnd="url(#c1-arr-teal)"
                  />
                )}
                {Math.abs(tensor.tyz) > 1 && (
                  <line
                    x1={frontLeftC[0]}
                    y1={frontLeftC[1] + Math.sign(physicalComp.tyz) * 14}
                    x2={frontLeftC[0]}
                    y2={frontLeftC[1] - Math.sign(physicalComp.tyz) * 14}
                    stroke="var(--diagram-teal)"
                    strokeWidth="2"
                    markerEnd="url(#c1-arr-teal)"
                  />
                )}
              </svg>

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs app-text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--diagram-blue)] inline-block" aria-hidden="true" />
                  圧縮応力（内向き）
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--diagram-red)] inline-block" aria-hidden="true" />
                  引張応力（外向き）
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--diagram-teal)] inline-block" aria-hidden="true" />
                  せん断応力成分
                </span>
              </div>
            </div>
          </div>

          <div className="app-surface rounded-xl p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-bold app-text-muted">
              現在の 3×3 対称応力テンソル行列（{convention === 'compression' ? '圧縮正' : '引張正'}・kPa）
            </h3>
            <MathFormula
              block
              math={`\\boldsymbol{\\sigma} = \\begin{pmatrix} ${round2(tensor.sxx)} & ${round2(tensor.txy)} & ${round2(tensor.tzx)} \\\\ ${round2(tensor.txy)} & ${round2(tensor.syy)} & ${round2(tensor.tyz)} \\\\ ${round2(tensor.tzx)} & ${round2(tensor.tyz)} & ${round2(tensor.szz)} \\end{pmatrix}`}
            />
            <p className="text-xs app-text-muted">
              対角成分（<MathFormula math="\sigma_x, \sigma_y, \sigma_z" />）が垂直応力、非対角成分（<MathFormula math="\tau_{xy}=\tau_{yx}" /> 等）が対称なせん断応力です。
            </p>
          </div>
        </div>
      </section>

      {/* 3. 演習パート */}
      <ChapterExercisePanel
        chapterTitle="第1章：多次元場での応力の表現"
        exercises={exercises}
        completedIds={completedIds}
        onToggleDone={onToggleDone}
        onMarkDone={onMarkDone}
      />
    </div>
  );
};
