export type LpSense = 'max' | 'min';
export type ConstraintOp = '<=' | '>=' | '=';

export function round2(v: number): number {
  const r = Math.round(v * 100) / 100;
  return Math.abs(r) < 1e-12 ? 0 : r;
}

export function round3(v: number): number {
  const r = Math.round(v * 1000) / 1000;
  return Math.abs(r) < 1e-12 ? 0 : r;
}

export function round4(v: number): number {
  const r = Math.round(v * 10000) / 10000;
  return Math.abs(r) < 1e-12 ? 0 : r;
}

/**
 * 数値を分母24以下の既約分数（整数・有理数の場合は分数表記、それ以外は小数3桁）に整形
 */
export function formatRational(val: number): string {
  if (!Number.isFinite(val)) return String(val);
  if (Math.abs(val) < 1e-9) return '0';
  const nearestInt = Math.round(val);
  if (Math.abs(val - nearestInt) < 1e-7) {
    return String(nearestInt);
  }
  for (let d = 2; d <= 24; d++) {
    const num = Math.round(val * d);
    if (Math.abs(val - num / d) < 1e-7) {
      return `${num}/${d}`;
    }
  }
  return String(round3(val));
}

export function formatRationalLatex(val: number): string {
  const str = formatRational(val);
  const slashIdx = str.indexOf('/');
  if (slashIdx === -1) return str;
  const numStr = str.slice(0, slashIdx);
  const denStr = str.slice(slashIdx + 1);
  if (numStr.startsWith('-')) {
    return `-\\frac{${numStr.slice(1)}}{${denStr}}`;
  }
  return `\\frac{${numStr}}{${denStr}}`;
}

/* ==========================================================================
   1. 2変数線形計画 図解法ソルバー
   ========================================================================== */

export interface Lp2DConstraint {
  a1: number;
  a2: number;
  op: '<=' | '>=';
  b: number;
  label?: string;
}

export interface Lp2DInput {
  sense: LpSense;
  c1: number;
  c2: number;
  constraints: Lp2DConstraint[];
  maxX?: number;
  maxY?: number;
}

export interface Lp2DVertex {
  x1: number;
  x2: number;
  z: number;
  isOptimal: boolean;
}

export interface Lp2DResult {
  feasible: boolean;
  unbounded: boolean;
  vertices: Lp2DVertex[];
  polygon: { x1: number; x2: number }[];
  optimalPoint: { x1: number; x2: number } | null;
  optimalValue: number | null;
  boundX: number;
  boundY: number;
}

function intersectLines(
  a1: number,
  a2: number,
  b1: number,
  c1: number,
  c2: number,
  b2: number
): { x1: number; x2: number } | null {
  const det = a1 * c2 - a2 * c1;
  if (Math.abs(det) < 1e-10) return null;
  const x1 = (b1 * c2 - a2 * b2) / det;
  const x2 = (a1 * b2 - b1 * c1) / det;
  return { x1, x2 };
}

function satisfies2D(x1: number, x2: number, constraints: Lp2DConstraint[]): boolean {
  const eps = 1e-8;
  if (x1 < -eps || x2 < -eps) return false;
  for (const con of constraints) {
    const lhs = con.a1 * x1 + con.a2 * x2;
    if (con.op === '<=' && lhs > con.b + eps) return false;
    if (con.op === '>=' && lhs < con.b - eps) return false;
  }
  return true;
}

function dedupePoints(pts: { x1: number; x2: number }[]): { x1: number; x2: number }[] {
  const res: { x1: number; x2: number }[] = [];
  for (const p of pts) {
    const cx = Math.abs(p.x1) < 1e-9 ? 0 : p.x1;
    const cy = Math.abs(p.x2) < 1e-9 ? 0 : p.x2;
    if (!res.some((q) => Math.hypot(q.x1 - cx, q.x2 - cy) < 1e-6)) {
      res.push({ x1: cx, x2: cy });
    }
  }
  return res;
}

export function solveLP2D(input: Lp2DInput): Lp2DResult {
  const boundX = Math.max(10, input.maxX ?? 12);
  const boundY = Math.max(10, input.maxY ?? 12);

  // 真の実行可能頂点（クリップ境界を含めない）
  const trueLines: { a1: number; a2: number; b: number }[] = [
    { a1: 1, a2: 0, b: 0 },
    { a1: 0, a2: 1, b: 0 },
    ...input.constraints.map((c) => ({ a1: c.a1, a2: c.a2, b: c.b })),
  ];

  const candidateTrue: { x1: number; x2: number }[] = [];
  for (let i = 0; i < trueLines.length; i++) {
    for (let j = i + 1; j < trueLines.length; j++) {
      const pt = intersectLines(
        trueLines[i].a1,
        trueLines[i].a2,
        trueLines[i].b,
        trueLines[j].a1,
        trueLines[j].a2,
        trueLines[j].b
      );
      if (pt && satisfies2D(pt.x1, pt.x2, input.constraints)) {
        candidateTrue.push(pt);
      }
    }
  }
  const uniqueTrue = dedupePoints(candidateTrue);

  // 描画クリップ枠込みのポリゴン頂点
  const clipConstraints: Lp2DConstraint[] = [
    ...input.constraints,
    { a1: 1, a2: 0, op: '<=', b: boundX },
    { a1: 0, a2: 1, op: '<=', b: boundY },
  ];
  const clipLines: { a1: number; a2: number; b: number }[] = [
    ...trueLines,
    { a1: 1, a2: 0, b: boundX },
    { a1: 0, a2: 1, b: boundY },
  ];
  const candidatePoly: { x1: number; x2: number }[] = [];
  for (let i = 0; i < clipLines.length; i++) {
    for (let j = i + 1; j < clipLines.length; j++) {
      const pt = intersectLines(
        clipLines[i].a1,
        clipLines[i].a2,
        clipLines[i].b,
        clipLines[j].a1,
        clipLines[j].a2,
        clipLines[j].b
      );
      if (pt && satisfies2D(pt.x1, pt.x2, clipConstraints)) {
        candidatePoly.push(pt);
      }
    }
  }
  const uniquePoly = dedupePoints(candidatePoly);

  if (uniqueTrue.length === 0 && uniquePoly.length === 0) {
    return {
      feasible: false,
      unbounded: false,
      vertices: [],
      polygon: [],
      optimalPoint: null,
      optimalValue: null,
      boundX,
      boundY,
    };
  }

  // ポリゴンを重心周りの偏角でソート
  const cx = uniquePoly.reduce((s, p) => s + p.x1, 0) / Math.max(1, uniquePoly.length);
  const cy = uniquePoly.reduce((s, p) => s + p.x2, 0) / Math.max(1, uniquePoly.length);
  const polygon = [...uniquePoly].sort(
    (a, b) => Math.atan2(a.x2 - cy, a.x1 - cx) - Math.atan2(b.x2 - cy, b.x1 - cx)
  );

  // 非有界方向（recession cone）の判定
  const candidateDirs: { d1: number; d2: number }[] = [
    { d1: 1, d2: 0 },
    { d1: 0, d2: 1 },
  ];
  for (const con of input.constraints) {
    const norm = Math.hypot(con.a1, con.a2);
    if (norm > 1e-9) {
      candidateDirs.push({ d1: -con.a2 / norm, d2: con.a1 / norm });
      candidateDirs.push({ d1: con.a2 / norm, d2: -con.a1 / norm });
    }
  }
  let unbounded = false;
  for (const dir of candidateDirs) {
    if (dir.d1 < -1e-9 || dir.d2 < -1e-9) continue;
    let validDir = true;
    for (const con of input.constraints) {
      const val = con.a1 * dir.d1 + con.a2 * dir.d2;
      if (con.op === '<=' && val > 1e-8) {
        validDir = false;
        break;
      }
      if (con.op === '>=' && val < -1e-8) {
        validDir = false;
        break;
      }
    }
    if (validDir) {
      const rate = input.c1 * dir.d1 + input.c2 * dir.d2;
      if ((input.sense === 'max' && rate > 1e-8) || (input.sense === 'min' && rate < -1e-8)) {
        unbounded = true;
        break;
      }
    }
  }

  let bestVal = input.sense === 'max' ? -Infinity : Infinity;
  if (!unbounded) {
    for (const v of uniqueTrue) {
      const z = input.c1 * v.x1 + input.c2 * v.x2;
      if (input.sense === 'max' ? z > bestVal : z < bestVal) {
        bestVal = z;
      }
    }
  }

  const vertices: Lp2DVertex[] = uniqueTrue.map((v) => {
    const z = input.c1 * v.x1 + input.c2 * v.x2;
    const isOptimal = !unbounded && Math.abs(z - bestVal) < 1e-7;
    return { x1: v.x1, x2: v.x2, z, isOptimal };
  });

  const optVertex = vertices.find((v) => v.isOptimal) ?? null;

  return {
    feasible: true,
    unbounded,
    vertices,
    polygon,
    optimalPoint: optVertex ? { x1: optVertex.x1, x2: optVertex.x2 } : null,
    optimalValue: optVertex ? optVertex.z : null,
    boundX,
    boundY,
  };
}

/* ==========================================================================
   2. ピボット掃き出し法ステッパー（行交換なし）
   ========================================================================== */

export interface GaussJordanStep {
  stepIndex: number;
  matrix: number[][]; // 各行 [a_i1, ..., a_in, b_i]
  appliedPivot: [number, number] | null;
  nextPivot: [number, number] | null;
  rowVarMapping: (number | null)[];
  description: string;
}

export interface GaussJordanResult {
  steps: GaussJordanStep[];
  solution: number[];
  valid: boolean;
}

export function runGaussJordanCustomOrder(
  A: number[][],
  b: number[],
  pivotOrder: [number, number][]
): GaussJordanResult {
  const n = A.length;
  const mat = A.map((row, i) => [...row, b[i]]);
  const mapping: (number | null)[] = Array(n).fill(null);
  const steps: GaussJordanStep[] = [
    {
      stepIndex: 0,
      matrix: mat.map((r) => [...r]),
      appliedPivot: null,
      nextPivot: pivotOrder[0] ?? null,
      rowVarMapping: [...mapping],
      description: '初期拡大係数行列 [A | b]',
    },
  ];

  for (let s = 0; s < pivotOrder.length; s++) {
    const [pRow, pCol] = pivotOrder[s];
    const pivotVal = mat[pRow]?.[pCol] ?? 0;
    if (Math.abs(pivotVal) < 1e-10) {
      return { steps, solution: [], valid: false };
    }

    // ピボット行を正規化
    for (let j = 0; j <= n; j++) {
      mat[pRow][j] /= pivotVal;
    }

    // 他行からピボット列を掃き出す
    for (let r = 0; r < n; r++) {
      if (r === pRow) continue;
      const factor = mat[r][pCol];
      if (Math.abs(factor) < 1e-12) continue;
      for (let j = 0; j <= n; j++) {
        mat[r][j] -= factor * mat[pRow][j];
      }
    }

    mapping[pRow] = pCol;
    steps.push({
      stepIndex: s + 1,
      matrix: mat.map((r) => [...r]),
      appliedPivot: [pRow, pCol],
      nextPivot: pivotOrder[s + 1] ?? null,
      rowVarMapping: [...mapping],
      description: `第${pRow + 1}行・x${pCol + 1}列（ピボット値 ${formatRational(pivotVal)}）で掃き出し`,
    });
  }

  const solution = Array<number>(n).fill(0);
  for (let r = 0; r < n; r++) {
    const varIdx = mapping[r];
    if (varIdx !== null) {
      solution[varIdx] = mat[r][n];
    }
  }

  return { steps, solution, valid: true };
}

/* ==========================================================================
   3. 汎用シンプレックス法／二段階法ステッパー
   ========================================================================== */

export interface SimplexConstraintInput {
  a: number[];
  op: ConstraintOp;
  b: number;
}

export interface SimplexProblemInput {
  sense: LpSense;
  c: number[];
  constraints: SimplexConstraintInput[];
  varNames?: string[];
}

export type SimplexStatus = 'iterating' | 'optimal' | 'unbounded' | 'infeasible' | 'phase1-done';

export interface SimplexStep {
  phase: 1 | 2;
  iteration: number;
  varNames: string[];
  basis: number[]; // 各行の基底変数インデックス
  zRow: number[]; // z行の変数係数（最大化する z - Σc_j x_j = 0 の展開形）
  zValue: number; // 現在のタブローの z 値
  rows: number[][]; // 制約行の係数行列
  rhs: number[]; // 右辺（基底変数の値）
  enteringCol: number | null;
  ratios: (number | null)[]; // 最小比テスト (a_{i,enter} > 0 のみ計算、<=0 は null)
  leavingRow: number | null;
  status: SimplexStatus;
  note: string;
}

export interface SimplexRunResult {
  sense: LpSense;
  originalVarCount: number;
  constraintVarCols: number[]; // 各制約に対応するスラック/余剰変数の列インデックス
  constraintTypes: ConstraintOp[];
  flippedRows: boolean[];
  usedPhase1: boolean;
  steps: SimplexStep[];
  finalStatus: 'optimal' | 'unbounded' | 'infeasible';
  primalSolution: number[];
  optimalObjective: number | null; // 元の sense に戻した最適値
  dualSolution: number[]; // 双対変数の最適解（各制約に対応）
}

function selectPivotColumnsAndRows(
  zRow: number[],
  rows: number[][],
  rhs: number[],
  basis: number[],
  useBland: boolean
): {
  enteringCol: number | null;
  ratios: (number | null)[];
  leavingRow: number | null;
  unbounded: boolean;
} {
  const eps = 1e-8;
  let enteringCol: number | null = null;

  if (useBland) {
    for (let j = 0; j < zRow.length; j++) {
      if (zRow[j] < -eps) {
        enteringCol = j;
        break;
      }
    }
  } else {
    let minCoeff = -eps;
    for (let j = 0; j < zRow.length; j++) {
      if (zRow[j] < minCoeff - 1e-11) {
        minCoeff = zRow[j];
        enteringCol = j;
      }
    }
  }

  if (enteringCol === null) {
    return {
      enteringCol: null,
      ratios: rows.map(() => null),
      leavingRow: null,
      unbounded: false,
    };
  }

  const ratios: (number | null)[] = [];
  let minRatio = Infinity;
  let leavingRow: number | null = null;

  for (let r = 0; r < rows.length; r++) {
    const a = rows[r][enteringCol];
    if (a > eps) {
      const ratio = rhs[r] / a;
      const cleanRatio = Math.abs(ratio) < 1e-12 ? 0 : ratio;
      ratios.push(cleanRatio);
      if (
        cleanRatio < minRatio - 1e-10 ||
        (Math.abs(cleanRatio - minRatio) <= 1e-10 &&
          leavingRow !== null &&
          basis[r] < basis[leavingRow])
      ) {
        minRatio = cleanRatio;
        leavingRow = r;
      }
    } else {
      ratios.push(null);
    }
  }

  if (leavingRow === null) {
    return {
      enteringCol,
      ratios,
      leavingRow: null,
      unbounded: true,
    };
  }

  return { enteringCol, ratios, leavingRow, unbounded: false };
}

function performSimplexPivot(
  zRow: number[],
  zValueRef: { value: number },
  rows: number[][],
  rhs: number[],
  basis: number[],
  enteringCol: number,
  leavingRow: number
): void {
  const pivot = rows[leavingRow][enteringCol];
  const numCols = zRow.length;

  for (let j = 0; j < numCols; j++) {
    rows[leavingRow][j] /= pivot;
  }
  rhs[leavingRow] /= pivot;

  for (let r = 0; r < rows.length; r++) {
    if (r === leavingRow) continue;
    const factor = rows[r][enteringCol];
    if (Math.abs(factor) < 1e-12) continue;
    for (let j = 0; j < numCols; j++) {
      rows[r][j] -= factor * rows[leavingRow][j];
    }
    rhs[r] -= factor * rhs[leavingRow];
  }

  const zFactor = zRow[enteringCol];
  if (Math.abs(zFactor) > 1e-12) {
    for (let j = 0; j < numCols; j++) {
      zRow[j] -= zFactor * rows[leavingRow][j];
    }
    zValueRef.value -= zFactor * rhs[leavingRow];
  }

  basis[leavingRow] = enteringCol;
}

export function runSimplexSteps(problem: SimplexProblemInput): SimplexRunResult {
  const n = problem.c.length;
  const m = problem.constraints.length;
  const baseNames = problem.varNames ?? Array.from({ length: n }, (_, i) => `x${i + 1}`);
  const objMaxCoeffs = problem.sense === 'max' ? [...problem.c] : problem.c.map((v) => -v);

  // 右辺 b < 0 の制約は両辺 -1 倍して非負に揃える
  const normCons = problem.constraints.map((con) => {
    if (con.b < -1e-10) {
      const flippedOp: ConstraintOp =
        con.op === '<=' ? '>=' : con.op === '>=' ? '<=' : '=';
      return {
        a: con.a.map((v) => -v),
        op: flippedOp,
        b: -con.b,
        flipped: true,
      };
    }
    return {
      a: [...con.a],
      op: con.op,
      b: con.b,
      flipped: false,
    };
  });

  // 変数列のインデックス割り当て
  const varNames = [...baseNames];
  const slackCols: number[] = [];
  const artificialCols: number[] = [];
  const constraintSlackOrSurplusCol: number[] = [];
  const initialBasis: number[] = [];
  const rowMatrix: number[][] = Array.from({ length: m }, () => []);
  const rhs = normCons.map((c) => c.b);

  // 元変数列
  for (let r = 0; r < m; r++) {
    rowMatrix[r].push(...normCons[r].a);
  }

  // スラック / 余剰変数列
  for (let i = 0; i < m; i++) {
    if (normCons[i].op === '<=') {
      const col = varNames.length;
      varNames.push(`s${i + 1}`);
      slackCols.push(col);
      constraintSlackOrSurplusCol.push(col);
      for (let r = 0; r < m; r++) {
        rowMatrix[r].push(r === i ? 1 : 0);
      }
    } else if (normCons[i].op === '>=') {
      const col = varNames.length;
      varNames.push(`s${i + 1}`);
      slackCols.push(col);
      constraintSlackOrSurplusCol.push(col);
      for (let r = 0; r < m; r++) {
        rowMatrix[r].push(r === i ? -1 : 0);
      }
    } else {
      constraintSlackOrSurplusCol.push(-1);
    }
  }

  // 人為変数列（>= および = 制約）
  const artificialRowPairs: { row: number; col: number }[] = [];
  for (let i = 0; i < m; i++) {
    if (normCons[i].op === '<=') {
      initialBasis.push(constraintSlackOrSurplusCol[i]);
    } else {
      const col = varNames.length;
      varNames.push(`a${artificialCols.length + 1}`);
      artificialCols.push(col);
      initialBasis.push(col);
      artificialRowPairs.push({ row: i, col });
      for (let r = 0; r < m; r++) {
        rowMatrix[r].push(r === i ? 1 : 0);
      }
    }
  }

  const usedPhase1 = artificialCols.length > 0;
  const steps: SimplexStep[] = [];
  let basis = [...initialBasis];
  let rows = rowMatrix.map((r) => [...r]);
  let activeVarNames = [...varNames];
  let currentRhs = [...rhs];

  const MAX_ITER = 50;

  if (usedPhase1) {
    // Phase I: z_I = -Σ a_i の最大化（初期 z_I + Σ a_i = 0 から基底人為変数行を引く）
    const totalCols = activeVarNames.length;
    const z1Row = Array<number>(totalCols).fill(0);
    for (const aCol of artificialCols) {
      z1Row[aCol] = 1;
    }
    const z1Val = { value: 0 };
    for (const { row } of artificialRowPairs) {
      for (let j = 0; j < totalCols; j++) {
        z1Row[j] -= rows[row][j];
      }
      z1Val.value -= currentRhs[row];
    }

    let iter = 0;
    let phase1Ok = false;
    while (iter < MAX_ITER) {
      const sel = selectPivotColumnsAndRows(z1Row, rows, currentRhs, basis, iter > 15);
      if (sel.enteringCol === null) {
        const feasible = z1Val.value >= -1e-7;
        steps.push({
          phase: 1,
          iteration: iter,
          varNames: [...activeVarNames],
          basis: [...basis],
          zRow: [...z1Row],
          zValue: z1Val.value,
          rows: rows.map((r) => [...r]),
          rhs: [...currentRhs],
          enteringCol: null,
          ratios: sel.ratios,
          leavingRow: null,
          status: feasible ? 'phase1-done' : 'infeasible',
          note: feasible
            ? '第1段階完了：人為変数の和が 0 となり実行可能基底解に到達しました。'
            : '実行可能解が存在しません（第1段階の最適値が 0 未満）。',
        });
        phase1Ok = feasible;
        break;
      }

      if (sel.unbounded || sel.leavingRow === null) {
        steps.push({
          phase: 1,
          iteration: iter,
          varNames: [...activeVarNames],
          basis: [...basis],
          zRow: [...z1Row],
          zValue: z1Val.value,
          rows: rows.map((r) => [...r]),
          rhs: [...currentRhs],
          enteringCol: sel.enteringCol,
          ratios: sel.ratios,
          leavingRow: null,
          status: 'infeasible',
          note: '第1段階が異常終了しました。',
        });
        break;
      }

      steps.push({
        phase: 1,
        iteration: iter,
        varNames: [...activeVarNames],
        basis: [...basis],
        zRow: [...z1Row],
        zValue: z1Val.value,
        rows: rows.map((r) => [...r]),
        rhs: [...currentRhs],
        enteringCol: sel.enteringCol,
        ratios: sel.ratios,
        leavingRow: sel.leavingRow,
        status: 'iterating',
        note: `第1段階 反復${iter + 1}：${activeVarNames[sel.enteringCol]} が基底に入り、${activeVarNames[basis[sel.leavingRow]]} が基底から出ます。`,
      });

      performSimplexPivot(
        z1Row,
        z1Val,
        rows,
        currentRhs,
        basis,
        sel.enteringCol,
        sel.leavingRow
      );
      iter++;
    }

    if (!phase1Ok) {
      return {
        sense: problem.sense,
        originalVarCount: n,
        constraintVarCols: constraintSlackOrSurplusCol,
        constraintTypes: normCons.map((c) => c.op),
        flippedRows: normCons.map((c) => c.flipped),
        usedPhase1,
        steps,
        finalStatus: 'infeasible',
        primalSolution: Array(n).fill(0),
        optimalObjective: null,
        dualSolution: Array(m).fill(0),
      };
    }

    // 退化して基底に残った人為変数があれば非人為変数列でピボットして追い出す
    const artificialSet = new Set(artificialCols);
    for (let r = 0; r < rows.length; r++) {
      if (artificialSet.has(basis[r])) {
        let replacementCol = -1;
        for (let j = 0; j < activeVarNames.length; j++) {
          if (!artificialSet.has(j) && Math.abs(rows[r][j]) > 1e-8) {
            replacementCol = j;
            break;
          }
        }
        if (replacementCol !== -1) {
          performSimplexPivot(z1Row, z1Val, rows, currentRhs, basis, replacementCol, r);
        }
      }
    }

    // 人為変数列を除去し Phase II 用タブローを構築
    const nonArtCols = activeVarNames
      .map((_, idx) => idx)
      .filter((idx) => !artificialSet.has(idx));
    const colRemap = new Map<number, number>();
    nonArtCols.forEach((oldIdx, newIdx) => colRemap.set(oldIdx, newIdx));

    activeVarNames = nonArtCols.map((idx) => activeVarNames[idx]);
    rows = rows.map((row) => nonArtCols.map((idx) => row[idx]));
    basis = basis.map((bIdx) => colRemap.get(bIdx) ?? 0);
  }

  // Phase II: 本来の目的関数 z = Σ objMaxCoeffs[j] x_j の最大化
  const p2Cols = activeVarNames.length;
  const fullObj = Array<number>(p2Cols).fill(0);
  for (let j = 0; j < n; j++) {
    fullObj[j] = objMaxCoeffs[j];
  }
  const z2Row = fullObj.map((c) => -c);
  const z2Val = { value: 0 };

  // 基底変数列の z2Row 係数を 0 に掃き出す
  for (let r = 0; r < rows.length; r++) {
    const bCol = basis[r];
    const zCoeff = z2Row[bCol];
    if (Math.abs(zCoeff) > 1e-12) {
      for (let j = 0; j < p2Cols; j++) {
        z2Row[j] -= zCoeff * rows[r][j];
      }
      z2Val.value -= zCoeff * currentRhs[r];
    }
  }

  let iter2 = 0;
  let finalStatus: 'optimal' | 'unbounded' | 'infeasible' = 'optimal';
  while (iter2 < MAX_ITER) {
    const sel = selectPivotColumnsAndRows(z2Row, rows, currentRhs, basis, iter2 > 15);
    if (sel.enteringCol === null) {
      steps.push({
        phase: 2,
        iteration: iter2,
        varNames: [...activeVarNames],
        basis: [...basis],
        zRow: [...z2Row],
        zValue: z2Val.value,
        rows: rows.map((r) => [...r]),
        rhs: [...currentRhs],
        enteringCol: null,
        ratios: sel.ratios,
        leavingRow: null,
        status: 'optimal',
        note: 'すべての被約費用が 0 以上となり、最適解に到達しました。',
      });
      finalStatus = 'optimal';
      break;
    }

    if (sel.unbounded || sel.leavingRow === null) {
      steps.push({
        phase: 2,
        iteration: iter2,
        varNames: [...activeVarNames],
        basis: [...basis],
        zRow: [...z2Row],
        zValue: z2Val.value,
        rows: rows.map((r) => [...r]),
        rhs: [...currentRhs],
        enteringCol: sel.enteringCol,
        ratios: sel.ratios,
        leavingRow: null,
        status: 'unbounded',
        note: `${activeVarNames[sel.enteringCol]} 列の制約係数がすべて 0 以下のため、目的関数は非有界です。`,
      });
      finalStatus = 'unbounded';
      break;
    }

    steps.push({
      phase: 2,
      iteration: iter2,
      varNames: [...activeVarNames],
      basis: [...basis],
      zRow: [...z2Row],
      zValue: z2Val.value,
      rows: rows.map((r) => [...r]),
      rhs: [...currentRhs],
      enteringCol: sel.enteringCol,
      ratios: sel.ratios,
      leavingRow: sel.leavingRow,
      status: 'iterating',
      note: `反復${iter2 + 1}：${activeVarNames[sel.enteringCol]} が基底に入り、${activeVarNames[basis[sel.leavingRow]]}（最小比 ${formatRational(sel.ratios[sel.leavingRow] ?? 0)}）が退出します。`,
    });

    performSimplexPivot(
      z2Row,
      z2Val,
      rows,
      currentRhs,
      basis,
      sel.enteringCol,
      sel.leavingRow
    );
    iter2++;
  }

  const primalSolution = Array<number>(n).fill(0);
  if (finalStatus === 'optimal') {
    for (let r = 0; r < basis.length; r++) {
      if (basis[r] < n) {
        primalSolution[basis[r]] = currentRhs[r];
      }
    }
  }

  const optStep = steps[steps.length - 1];
  const dualSolution = normCons.map((con, i) => {
    const col = constraintSlackOrSurplusCol[i];
    if (col === -1 || !optStep || finalStatus !== 'optimal') return 0;
    // max(<=) や min(>=) では zRow[col] >= 0 がそのまま双対変数の大きさ
    const raw = optStep.zRow[col] ?? 0;
    return con.flipped ? -raw : raw;
  });

  const optimalObjective =
    finalStatus === 'optimal'
      ? problem.sense === 'max'
        ? z2Val.value
        : -z2Val.value
      : null;

  return {
    sense: problem.sense,
    originalVarCount: n,
    constraintVarCols: constraintSlackOrSurplusCol,
    constraintTypes: normCons.map((c) => c.op),
    flippedRows: normCons.map((c) => c.flipped),
    usedPhase1,
    steps,
    finalStatus,
    primalSolution,
    optimalObjective,
    dualSolution,
  };
}

/* ==========================================================================
   4. 双対理論・相補性条件・感度分析
   ========================================================================== */

export interface DualSummary {
  primalSense: LpSense;
  dualSense: LpSense;
  dualObjectiveCoeffs: number[]; // b
  dualConstraintMatrix: number[][]; // A^T
  dualConstraintOp: ConstraintOp;
  dualConstraintRhs: number[]; // c
  dualVarNames: string[];
}

export function buildDualSummary(problem: SimplexProblemInput): DualSummary {
  const n = problem.c.length;
  const m = problem.constraints.length;
  const dualConstraintMatrix: number[][] = Array.from({ length: n }, (_, j) =>
    Array.from({ length: m }, (_, i) => problem.constraints[i].a[j] ?? 0)
  );
  return {
    primalSense: problem.sense,
    dualSense: problem.sense === 'max' ? 'min' : 'max',
    dualObjectiveCoeffs: problem.constraints.map((c) => c.b),
    dualConstraintMatrix,
    dualConstraintOp: problem.sense === 'max' ? '>=' : '<=',
    dualConstraintRhs: [...problem.c],
    dualVarNames: Array.from({ length: m }, (_, i) => `y${i + 1}`),
  };
}

export interface ComplementarySlacknessRow {
  kind: 'primal-constraint' | 'dual-constraint';
  label: string;
  slackValue: number;
  multiplierValue: number;
  product: number;
  isSatisfied: boolean;
}

export function evaluateComplementarySlackness(
  problem: SimplexProblemInput,
  primalX: number[],
  dualY: number[]
): ComplementarySlacknessRow[] {
  const rows: ComplementarySlacknessRow[] = [];
  const eps = 1e-6;

  // 主制約余裕 × 双対変数 y_i = 0
  problem.constraints.forEach((con, i) => {
    const lhs = con.a.reduce((sum, aij, j) => sum + aij * (primalX[j] ?? 0), 0);
    const slack = con.op === '<=' ? con.b - lhs : lhs - con.b;
    const prod = slack * (dualY[i] ?? 0);
    rows.push({
      kind: 'primal-constraint',
      label: `主制約 ${i + 1} の余裕 × y${i + 1}`,
      slackValue: slack,
      multiplierValue: dualY[i] ?? 0,
      product: prod,
      isSatisfied: Math.abs(prod) < eps,
    });
  });

  // 双対制約余裕 × 主変数 x_j = 0
  const dual = buildDualSummary(problem);
  dual.dualConstraintMatrix.forEach((rowA, j) => {
    const lhs = rowA.reduce((sum, val, i) => sum + val * (dualY[i] ?? 0), 0);
    const rhs = dual.dualConstraintRhs[j];
    const slack = dual.dualConstraintOp === '>=' ? lhs - rhs : rhs - lhs;
    const prod = slack * (primalX[j] ?? 0);
    const name = problem.varNames?.[j] ?? `x${j + 1}`;
    rows.push({
      kind: 'dual-constraint',
      label: `双対制約 ${j + 1} の余裕 × ${name}`,
      slackValue: slack,
      multiplierValue: primalX[j] ?? 0,
      product: prod,
      isSatisfied: Math.abs(prod) < eps,
    });
  });

  return rows;
}

export interface RhsSensitivityResult {
  constraintIndex: number;
  deltaB: number;
  shadowPrice: number;
  minDelta: number; // -Infinity 可
  maxDelta: number; // +Infinity 可
  isBasisValid: boolean;
  updatedRhs: number[];
  updatedZValue: number;
}

export function analyzeRhsSensitivity(
  optStep: SimplexStep,
  slackColIndex: number,
  constraintIndex: number,
  deltaB: number
): RhsSensitivityResult {
  const eps = 1e-9;
  const shadowPrice = optStep.zRow[slackColIndex] ?? 0;
  let minDelta = -Infinity;
  let maxDelta = Infinity;

  const updatedRhs: number[] = [];
  for (let r = 0; r < optStep.rows.length; r++) {
    const alpha = optStep.rows[r][slackColIndex] ?? 0;
    const baseVal = optStep.rhs[r];
    if (alpha > eps) {
      minDelta = Math.max(minDelta, -baseVal / alpha);
    } else if (alpha < -eps) {
      maxDelta = Math.min(maxDelta, -baseVal / alpha);
    }
    updatedRhs.push(baseVal + alpha * deltaB);
  }

  const isBasisValid = updatedRhs.every((v) => v >= -1e-7);
  const updatedZValue = optStep.zValue + shadowPrice * deltaB;

  return {
    constraintIndex,
    deltaB,
    shadowPrice,
    minDelta,
    maxDelta,
    isBasisValid,
    updatedRhs,
    updatedZValue,
  };
}

export interface ObjSensitivityResult {
  varIndex: number;
  isBasic: boolean;
  basicRow: number | null;
  deltaC: number;
  minDelta: number;
  maxDelta: number;
  isBasisValid: boolean;
  updatedZRow: number[];
  updatedZValue: number;
}

export function analyzeObjSensitivity(
  optStep: SimplexStep,
  varIndex: number,
  deltaC: number
): ObjSensitivityResult {
  const eps = 1e-9;
  const basicRow = optStep.basis.indexOf(varIndex);
  const isBasic = basicRow !== -1;

  if (!isBasic) {
    // 非基底変数：zRow[varIndex] - Δc >= 0 -> Δc <= zRow[varIndex]
    const rc = optStep.zRow[varIndex] ?? 0;
    const minDelta = -Infinity;
    const maxDelta = rc;
    const updatedZRow = optStep.zRow.map((val, j) => (j === varIndex ? val - deltaC : val));
    return {
      varIndex,
      isBasic: false,
      basicRow: null,
      deltaC,
      minDelta,
      maxDelta,
      isBasisValid: deltaC <= maxDelta + 1e-7,
      updatedZRow,
      updatedZValue: optStep.zValue,
    };
  }

  // 基底変数（行 basicRow）：非基底列 k に対して zRow[k] + rows[basicRow][k] * Δc >= 0
  const basisSet = new Set(optStep.basis);
  let minDelta = -Infinity;
  let maxDelta = Infinity;
  const updatedZRow = optStep.zRow.map((val, k) => {
    if (basisSet.has(k)) return val;
    const a = optStep.rows[basicRow][k] ?? 0;
    if (a > eps) {
      minDelta = Math.max(minDelta, -val / a);
    } else if (a < -eps) {
      maxDelta = Math.min(maxDelta, -val / a);
    }
    return val + a * deltaC;
  });

  const isBasisValid = updatedZRow.every((v, k) => basisSet.has(k) || v >= -1e-7);
  const xVal = optStep.rhs[basicRow] ?? 0;
  const updatedZValue = optStep.zValue + xVal * deltaC;

  return {
    varIndex,
    isBasic: true,
    basicRow,
    deltaC,
    minDelta,
    maxDelta,
    isBasisValid,
    updatedZRow,
    updatedZValue,
  };
}

/* ==========================================================================
   5. 輸送問題・割当問題ソルバー
   ========================================================================== */

export interface TransportationResult {
  feasible: boolean;
  shipments: number[][];
  totalCost: number;
  supplyShadowPrices: number[]; // 供給能力+1で総費用がいくら減るか（>= 0）
  demandShadowPrices: number[]; // 需要+1で総費用がいくら増えるか（>= 0）
}

export function solveTransportation(
  costs: number[][],
  supply: number[],
  demand: number[]
): TransportationResult {
  const m = supply.length;
  const n = demand.length;
  const numVars = m * n;
  const c: number[] = [];
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      c.push(costs[i][j]);
    }
  }

  const constraints: SimplexConstraintInput[] = [];
  // 供給制約 Σ_j x_{ij} <= S_i
  for (let i = 0; i < m; i++) {
    const a = Array<number>(numVars).fill(0);
    for (let j = 0; j < n; j++) {
      a[i * n + j] = 1;
    }
    constraints.push({ a, op: '<=', b: supply[i] });
  }
  // 需要制約 Σ_i x_{ij} >= D_j
  for (let j = 0; j < n; j++) {
    const a = Array<number>(numVars).fill(0);
    for (let i = 0; i < m; i++) {
      a[i * n + j] = 1;
    }
    constraints.push({ a, op: '>=', b: demand[j] });
  }

  const sim = runSimplexSteps({
    sense: 'min',
    c,
    constraints,
  });

  if (sim.finalStatus !== 'optimal' || sim.optimalObjective === null) {
    return {
      feasible: false,
      shipments: Array.from({ length: m }, () => Array<number>(n).fill(0)),
      totalCost: Infinity,
      supplyShadowPrices: Array<number>(m).fill(0),
      demandShadowPrices: Array<number>(n).fill(0),
    };
  }

  const shipments: number[][] = Array.from({ length: m }, (_, i) =>
    Array.from({ length: n }, (_, j) => sim.primalSolution[i * n + j] ?? 0)
  );

  return {
    feasible: true,
    shipments,
    totalCost: sim.optimalObjective,
    supplyShadowPrices: sim.dualSolution.slice(0, m),
    demandShadowPrices: sim.dualSolution.slice(m, m + n),
  };
}

export interface GridPoint {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface AssignmentPair {
  vehicleIndex: number;
  targetIndex: number;
  vehicleLabel: string;
  targetLabel: string;
  distance: number;
}

export interface AssignmentComparisonResult {
  distanceMatrix: number[][];
  optimal: {
    pairs: AssignmentPair[];
    idleVehicleIndices: number[];
    totalDistance: number;
  };
  greedy: {
    pairs: AssignmentPair[];
    idleVehicleIndices: number[];
    totalDistance: number;
  };
  gap: number;
}

export function manhattanDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function solveAssignmentManhattan(
  vehicles: GridPoint[],
  targets: GridPoint[]
): AssignmentComparisonResult {
  const m = vehicles.length;
  const n = targets.length;
  const distanceMatrix: number[][] = vehicles.map((v) =>
    targets.map((t) => manhattanDistance(v, t))
  );

  // 全体最適解（m >= n を想定し、各ターゲットに異なる車両を1台ずつ割り当てる全探索）
  let bestDist = Infinity;
  let bestAssign: number[] = [];
  const used = Array<boolean>(m).fill(false);
  const current = Array<number>(n).fill(-1);

  const dfs = (targetIdx: number, accDist: number) => {
    if (accDist >= bestDist) return;
    if (targetIdx === n) {
      bestDist = accDist;
      bestAssign = [...current];
      return;
    }
    for (let v = 0; v < m; v++) {
      if (used[v]) continue;
      used[v] = true;
      current[targetIdx] = v;
      dfs(targetIdx + 1, accDist + distanceMatrix[v][targetIdx]);
      used[v] = false;
    }
  };
  if (m >= n) {
    dfs(0, 0);
  }

  const optUsed = new Set(bestAssign);
  const optimalPairs: AssignmentPair[] = bestAssign
    .map((vIdx, tIdx) => ({
      vehicleIndex: vIdx,
      targetIndex: tIdx,
      vehicleLabel: vehicles[vIdx].label,
      targetLabel: targets[tIdx].label,
      distance: distanceMatrix[vIdx][tIdx],
    }))
    .sort((a, b) => a.targetIndex - b.targetIndex);
  const optIdle = vehicles.map((_, i) => i).filter((i) => !optUsed.has(i));

  // 貪欲法：残っている組の中から最短距離の (vehicle, target) を順次確定
  const gUsedV = new Set<number>();
  const gUsedT = new Set<number>();
  const greedyPairs: AssignmentPair[] = [];
  while (greedyPairs.length < Math.min(m, n)) {
    let minD = Infinity;
    let pickV = -1;
    let pickT = -1;
    for (let v = 0; v < m; v++) {
      if (gUsedV.has(v)) continue;
      for (let t = 0; t < n; t++) {
        if (gUsedT.has(t)) continue;
        if (distanceMatrix[v][t] < minD) {
          minD = distanceMatrix[v][t];
          pickV = v;
          pickT = t;
        }
      }
    }
    if (pickV === -1 || pickT === -1) break;
    gUsedV.add(pickV);
    gUsedT.add(pickT);
    greedyPairs.push({
      vehicleIndex: pickV,
      targetIndex: pickT,
      vehicleLabel: vehicles[pickV].label,
      targetLabel: targets[pickT].label,
      distance: minD,
    });
  }
  greedyPairs.sort((a, b) => a.targetIndex - b.targetIndex);
  const greedyTotal = greedyPairs.reduce((s, p) => s + p.distance, 0);
  const greedyIdle = vehicles.map((_, i) => i).filter((i) => !gUsedV.has(i));

  return {
    distanceMatrix,
    optimal: {
      pairs: optimalPairs,
      idleVehicleIndices: optIdle,
      totalDistance: Number.isFinite(bestDist) ? bestDist : 0,
    },
    greedy: {
      pairs: greedyPairs,
      idleVehicleIndices: greedyIdle,
      totalDistance: greedyTotal,
    },
    gap: greedyTotal - (Number.isFinite(bestDist) ? bestDist : 0),
  };
}

/* ==========================================================================
   6. 非線形計画法・最適性条件・狭義凸性・包絡線定理・ニュートン法
   ========================================================================== */

export type NlpModelId =
  | 'quad-convex'
  | 'cubic-saddle'
  | 'double-well'
  | 'infra-cost'
  | 'log-quad';

export interface NlpModelMeta {
  id: NlpModelId;
  name: string;
  formulaLatex: string;
  domainMin: [number, number];
  domainMax: [number, number];
  positiveDomainOnly: boolean;
  defaultTheta: number;
  thetaMin: number;
  thetaMax: number;
  thetaStep: number;
  hasTheta: boolean;
  defaultX0: [number, number];
  stationaryPoints?: { label: string; x: [number, number]; kind: string }[];
  evaluate: (x1: number, x2: number, theta: number) => number;
  gradient: (x1: number, x2: number, theta: number) => [number, number];
  hessian: (x1: number, x2: number, theta: number) => [[number, number], [number, number]];
  dfDtheta?: (x1: number, x2: number, theta: number) => number;
  dGradDtheta?: (x1: number, x2: number, theta: number) => [number, number];
}

export const NLP_MODELS: Record<NlpModelId, NlpModelMeta> = {
  'quad-convex': {
    id: 'quad-convex',
    name: '狭義凸2次計画モデル',
    formulaLatex: 'f(x_1,x_2) = 2x_1^2 - 2x_1 x_2 + x_2^2 - 6x_1 + 2x_2 + 10',
    domainMin: [-1, -1.5],
    domainMax: [5, 4.5],
    positiveDomainOnly: false,
    defaultTheta: 1,
    thetaMin: 1,
    thetaMax: 1,
    thetaStep: 1,
    hasTheta: false,
    defaultX0: [0, 0],
    stationaryPoints: [{ label: '唯一の大域最小点 (2, 1)', x: [2, 1], kind: 'local-min' }],
    evaluate: (x1, x2) => 2 * x1 * x1 - 2 * x1 * x2 + x2 * x2 - 6 * x1 + 2 * x2 + 10,
    gradient: (x1, x2) => [4 * x1 - 2 * x2 - 6, -2 * x1 + 2 * x2 + 2],
    hessian: () => [
      [4, -2],
      [-2, 2],
    ],
  },
  'cubic-saddle': {
    id: 'cubic-saddle',
    name: '3次非凸関数（局所最小点と鞍点）',
    formulaLatex: 'f(x_1,x_2) = x_1^3 - 3x_1 + x_2^2 - 2x_2 + 5',
    domainMin: [-2.2, -1],
    domainMax: [2.2, 3],
    positiveDomainOnly: false,
    defaultTheta: 1,
    thetaMin: 1,
    thetaMax: 1,
    thetaStep: 1,
    hasTheta: false,
    defaultX0: [1.5, 2],
    stationaryPoints: [
      { label: '局所最小点 (1, 1)', x: [1, 1], kind: 'local-min' },
      { label: '鞍点 (-1, 1)', x: [-1, 1], kind: 'saddle' },
    ],
    evaluate: (x1, x2) => x1 * x1 * x1 - 3 * x1 + x2 * x2 - 2 * x2 + 5,
    gradient: (x1, x2) => [3 * x1 * x1 - 3, 2 * x2 - 2],
    hessian: (x1) => [
      [6 * x1, 0],
      [0, 2],
    ],
  },
  'double-well': {
    id: 'double-well',
    name: '二峰谷ポテンシャル（2つの最小点と鞍点）',
    formulaLatex:
      'f(x_1,x_2) = \\frac{1}{4}x_1^4 - \\frac{1}{2}x_1^2 + \\frac{1}{2}(x_2 - 1)^2 + 1',
    domainMin: [-2, -1],
    domainMax: [2, 3],
    positiveDomainOnly: false,
    defaultTheta: 1,
    thetaMin: 1,
    thetaMax: 1,
    thetaStep: 1,
    hasTheta: false,
    defaultX0: [0.5, 2],
    stationaryPoints: [
      { label: '最小点 (+1, 1)', x: [1, 1], kind: 'local-min' },
      { label: '最小点 (-1, 1)', x: [-1, 1], kind: 'local-min' },
      { label: '鞍点 (0, 1)', x: [0, 1], kind: 'saddle' },
    ],
    evaluate: (x1, x2) => 0.25 * Math.pow(x1, 4) - 0.5 * x1 * x1 + 0.5 * (x2 - 1) ** 2 + 1,
    gradient: (x1, x2) => [x1 * x1 * x1 - x1, x2 - 1],
    hessian: (x1) => [
      [3 * x1 * x1 - 1, 0],
      [0, 1],
    ],
  },
  'infra-cost': {
    id: 'infra-cost',
    name: 'インフラ維持・更新配分モデル（狭義凸）',
    formulaLatex:
      'f(x_1,x_2;\\theta) = \\theta x_1 + 2x_2 + \\frac{8}{x_1} + \\frac{8}{x_2} + (x_1 - x_2)^2',
    domainMin: [0.3, 0.3],
    domainMax: [4.2, 4.2],
    positiveDomainOnly: true,
    defaultTheta: 2,
    thetaMin: 0.5,
    thetaMax: 5.0,
    thetaStep: 0.1,
    hasTheta: true,
    defaultX0: [1, 1],
    evaluate: (x1, x2, theta) =>
      theta * x1 + 2 * x2 + 8 / x1 + 8 / x2 + (x1 - x2) * (x1 - x2),
    gradient: (x1, x2, theta) => [
      theta - 8 / (x1 * x1) + 2 * (x1 - x2),
      2 - 8 / (x2 * x2) - 2 * (x1 - x2),
    ],
    hessian: (x1, x2) => [
      [16 / (x1 * x1 * x1) + 2, -2],
      [-2, 16 / (x2 * x2 * x2) + 2],
    ],
    dfDtheta: (x1) => x1,
    dGradDtheta: () => [1, 0],
  },
  'log-quad': {
    id: 'log-quad',
    name: '対数障壁・2次配分モデル（狭義凸）',
    formulaLatex:
      'f(x_1,x_2;\\theta) = \\theta x_1^2 + 2x_2^2 - 6\\ln x_1 - 2\\ln x_2 - x_1 x_2',
    domainMin: [0.3, 0.3],
    domainMax: [3.8, 3.8],
    positiveDomainOnly: true,
    defaultTheta: 1,
    thetaMin: 0.5,
    thetaMax: 3.0,
    thetaStep: 0.1,
    hasTheta: true,
    defaultX0: [1, 1],
    evaluate: (x1, x2, theta) =>
      theta * x1 * x1 + 2 * x2 * x2 - 6 * Math.log(x1) - 2 * Math.log(x2) - x1 * x2,
    gradient: (x1, x2, theta) => [
      2 * theta * x1 - 6 / x1 - x2,
      4 * x2 - 2 / x2 - x1,
    ],
    hessian: (x1, x2, theta) => [
      [2 * theta + 6 / (x1 * x1), -1],
      [-1, 4 + 2 / (x2 * x2)],
    ],
    dfDtheta: (x1) => x1 * x1,
    dGradDtheta: (x1) => [2 * x1, 0],
  },
};

export type DefinitenessKind =
  | 'positive-definite'
  | 'negative-definite'
  | 'indefinite'
  | 'semi-definite-or-degenerate';

export interface NlpPointEvaluation {
  x1: number;
  x2: number;
  value: number;
  grad: [number, number];
  gradNorm: number;
  hessian: [[number, number], [number, number]];
  d1: number;
  d2: number;
  eigenvalues: [number, number];
  definiteness: DefinitenessKind;
  newtonStep: [number, number] | null;
}

export function evaluateNlpPoint(
  modelId: NlpModelId,
  x1: number,
  x2: number,
  thetaOverride?: number
): NlpPointEvaluation {
  const model = NLP_MODELS[modelId];
  const theta = thetaOverride ?? model.defaultTheta;
  const value = model.evaluate(x1, x2, theta);
  const grad = model.gradient(x1, x2, theta);
  const hessian = model.hessian(x1, x2, theta);
  const h11 = hessian[0][0];
  const h12 = hessian[0][1];
  const h22 = hessian[1][1];
  const d1 = h11;
  const d2 = h11 * h22 - h12 * h12;

  const trace = h11 + h22;
  const disc = Math.sqrt(Math.max(0, (h11 - h22) * (h11 - h22) + 4 * h12 * h12));
  const l1 = 0.5 * (trace + disc);
  const l2 = 0.5 * (trace - disc);

  const eps = 1e-8;
  let definiteness: DefinitenessKind;
  if (l1 > eps && l2 > eps) {
    definiteness = 'positive-definite';
  } else if (l1 < -eps && l2 < -eps) {
    definiteness = 'negative-definite';
  } else if (l1 > eps && l2 < -eps) {
    definiteness = 'indefinite';
  } else {
    definiteness = 'semi-definite-or-degenerate';
  }

  let newtonStep: [number, number] | null = null;
  if (Math.abs(d2) > 1e-10) {
    const s1 = -(h22 * grad[0] - h12 * grad[1]) / d2;
    const s2 = -(-h12 * grad[0] + h11 * grad[1]) / d2;
    newtonStep = [s1, s2];
  }

  return {
    x1,
    x2,
    value,
    grad,
    gradNorm: Math.hypot(grad[0], grad[1]),
    hessian,
    d1,
    d2,
    eigenvalues: [l1, l2],
    definiteness,
    newtonStep,
  };
}

export interface ParametricOptimumResult {
  theta: number;
  xStar: [number, number];
  fStar: number;
  gradAtOpt: [number, number];
  hessianAtOpt: [[number, number], [number, number]];
  dGradDtheta: [number, number];
  dxDtheta: [number, number];
  dFDtheta: number;
}

export function solveParametricOptimum(
  modelId: NlpModelId,
  theta: number
): ParametricOptimumResult {
  const model = NLP_MODELS[modelId];
  let [x1, x2] = model.defaultX0;
  if (modelId === 'infra-cost') {
    x1 = 1.6;
    x2 = 1.8;
  } else if (modelId === 'log-quad') {
    x1 = 1.6;
    x2 = 1.0;
  }

  for (let k = 0; k < 40; k++) {
    const ev = evaluateNlpPoint(modelId, x1, x2, theta);
    if (ev.gradNorm < 1e-12 || !ev.newtonStep) break;
    // 定義域 x > 0 内に保つ簡易バックトラック
    let alpha = 1;
    while (
      model.positiveDomainOnly &&
      (x1 + alpha * ev.newtonStep[0] <= 1e-4 || x2 + alpha * ev.newtonStep[1] <= 1e-4) &&
      alpha > 1e-4
    ) {
      alpha *= 0.5;
    }
    x1 += alpha * ev.newtonStep[0];
    x2 += alpha * ev.newtonStep[1];
  }

  const opt = evaluateNlpPoint(modelId, x1, x2, theta);
  const dGrad = model.dGradDtheta ? model.dGradDtheta(x1, x2, theta) : [0, 0] as [number, number];
  const dF = model.dfDtheta ? model.dfDtheta(x1, x2, theta) : 0;

  const h11 = opt.hessian[0][0];
  const h12 = opt.hessian[0][1];
  const h22 = opt.hessian[1][1];
  const det = opt.d2;

  const dx1 = -(h22 * dGrad[0] - h12 * dGrad[1]) / det;
  const dx2 = -(-h12 * dGrad[0] + h11 * dGrad[1]) / det;

  return {
    theta,
    xStar: [x1, x2],
    fStar: opt.value,
    gradAtOpt: opt.grad,
    hessianAtOpt: opt.hessian,
    dGradDtheta: dGrad,
    dxDtheta: [dx1, dx2],
    dFDtheta: dF,
  };
}

export interface NewtonIterRecord {
  k: number;
  x: [number, number];
  f: number;
  grad: [number, number];
  gradNorm: number;
  hessian: [[number, number], [number, number]];
  deltaX: [number, number] | null;
  nextX: [number, number] | null;
  domainWarning: boolean;
}

export function runNewtonMethod(
  modelId: NlpModelId,
  x0: [number, number],
  maxIter = 8,
  thetaOverride?: number
): NewtonIterRecord[] {
  const model = NLP_MODELS[modelId];
  const theta = thetaOverride ?? model.defaultTheta;
  const records: NewtonIterRecord[] = [];
  let [x1, x2] = x0;

  for (let k = 0; k <= maxIter; k++) {
    if (model.positiveDomainOnly && (x1 <= 1e-9 || x2 <= 1e-9)) {
      break;
    }
    const ev = evaluateNlpPoint(modelId, x1, x2, theta);
    const delta = ev.newtonStep;
    let nextX: [number, number] | null = null;
    let domainWarning = false;

    if (delta && k < maxIter && ev.gradNorm > 1e-11) {
      const nx1 = x1 + delta[0];
      const nx2 = x2 + delta[1];
      if (model.positiveDomainOnly && (nx1 <= 1e-6 || nx2 <= 1e-6)) {
        domainWarning = true;
      } else {
        nextX = [nx1, nx2];
      }
    }

    records.push({
      k,
      x: [x1, x2],
      f: ev.value,
      grad: ev.grad,
      gradNorm: ev.gradNorm,
      hessian: ev.hessian,
      deltaX: delta,
      nextX,
      domainWarning,
    });

    if (!nextX || domainWarning || ev.gradNorm <= 1e-11) {
      break;
    }
    x1 = nextX[0];
    x2 = nextX[1];
  }

  return records;
}

export function runGradientDescent(
  modelId: NlpModelId,
  x0: [number, number],
  stepSize = 0.08,
  maxIter = 20,
  thetaOverride?: number
): [number, number][] {
  const model = NLP_MODELS[modelId];
  const theta = thetaOverride ?? model.defaultTheta;
  const pts: [number, number][] = [[x0[0], x0[1]]];
  let [x1, x2] = x0;

  for (let k = 0; k < maxIter; k++) {
    if (model.positiveDomainOnly && (x1 <= 1e-6 || x2 <= 1e-6)) break;
    const g = model.gradient(x1, x2, theta);
    const gNorm = Math.hypot(g[0], g[1]);
    if (gNorm < 1e-6) break;
    // Armijo風の簡易バックトラックで発散を防ぐ
    let alpha = stepSize;
    const curF = model.evaluate(x1, x2, theta);
    while (alpha > 1e-5) {
      const nx1 = x1 - alpha * g[0];
      const nx2 = x2 - alpha * g[1];
      if (
        (!model.positiveDomainOnly || (nx1 > 0.05 && nx2 > 0.05)) &&
        model.evaluate(nx1, nx2, theta) <= curF - 1e-4 * alpha * gNorm * gNorm
      ) {
        x1 = nx1;
        x2 = nx2;
        break;
      }
      alpha *= 0.5;
    }
    pts.push([x1, x2]);
  }
  return pts;
}
