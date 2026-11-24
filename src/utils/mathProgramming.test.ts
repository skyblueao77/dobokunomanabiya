import { describe, expect, it } from 'vitest';
import {
  NLP_MODELS,
  analyzeObjSensitivity,
  analyzeRhsSensitivity,
  buildDualSummary,
  evaluateComplementarySlackness,
  evaluateNlpPoint,
  formatRational,
  formatRationalLatex,
  runGaussJordanCustomOrder,
  runGradientDescent,
  runNewtonMethod,
  runSimplexSteps,
  solveAssignmentManhattan,
  solveLP2D,
  solveParametricOptimum,
  solveTransportation,
} from './mathProgramming';

describe('mathProgramming', () => {
  it('分数・有理数フォーマットを正しく整形する', () => {
    expect(formatRational(0)).toBe('0');
    expect(formatRational(-0)).toBe('0');
    expect(formatRational(0.75)).toBe('3/4');
    expect(formatRational(-1.25)).toBe('-5/4');
    expect(formatRational(1 / 3)).toBe('1/3');
    expect(formatRationalLatex(-3 / 4)).toBe('-\\frac{3}{4}');
    expect(formatRationalLatex(5)).toBe('5');
  });

  it('2変数LP図解法ソルバー：最大化問題と最小化問題の最適解・端点を求める', () => {
    // コンクリート二次製品の生産配分（最大化）
    const maxRes = solveLP2D({
      sense: 'max',
      c1: 5,
      c2: 4,
      constraints: [
        { a1: 2, a2: 1, op: '<=', b: 18 },
        { a1: 1, a2: 2, op: '<=', b: 18 },
        { a1: 1, a2: 0, op: '<=', b: 7 },
      ],
    });
    expect(maxRes.feasible).toBe(true);
    expect(maxRes.unbounded).toBe(false);
    expect(maxRes.optimalPoint?.x1).toBeCloseTo(6, 6);
    expect(maxRes.optimalPoint?.x2).toBeCloseTo(6, 6);
    expect(maxRes.optimalValue).toBeCloseTo(54, 6);

    // 軟弱地盤改良固化材の配合（最小化）
    const minRes = solveLP2D({
      sense: 'min',
      c1: 4,
      c2: 5,
      constraints: [
        { a1: 3, a2: 1, op: '>=', b: 9 },
        { a1: 1, a2: 2, op: '>=', b: 8 },
        { a1: 0, a2: 1, op: '>=', b: 1 },
      ],
    });
    expect(minRes.feasible).toBe(true);
    expect(minRes.unbounded).toBe(false);
    expect(minRes.optimalPoint?.x1).toBeCloseTo(2, 6);
    expect(minRes.optimalPoint?.x2).toBeCloseTo(3, 6);
    expect(minRes.optimalValue).toBeCloseTo(23, 6);
  });

  it('ピボット掃き出し法（行交換なし）：基底変数の値を直接読み取れる', () => {
    const res = runGaussJordanCustomOrder(
      [
        [2, 0, 1],
        [0, 4, 0],
        [1, 2, 0],
      ],
      [11, 12, 9],
      [
        [1, 1],
        [2, 0],
        [0, 2],
      ]
    );
    expect(res.valid).toBe(true);
    expect(res.steps.length).toBe(4);
    expect(res.solution[0]).toBeCloseTo(3, 6);
    expect(res.solution[1]).toBeCloseTo(3, 6);
    expect(res.solution[2]).toBeCloseTo(5, 6);
  });

  it('シンプレックス法：標準3変数最大化・負係数（最小比除外）・二段階法を解く', () => {
    // 1. 標準3変数最大化
    const sim1 = runSimplexSteps({
      sense: 'max',
      c: [5, 3, 7],
      constraints: [
        { a: [2, 1, 2], op: '<=', b: 24 },
        { a: [1, 2, 3], op: '<=', b: 30 },
      ],
    });
    expect(sim1.finalStatus).toBe('optimal');
    expect(sim1.usedPhase1).toBe(false);
    expect(sim1.primalSolution[0]).toBeCloseTo(3, 6);
    expect(sim1.primalSolution[1]).toBeCloseTo(0, 6);
    expect(sim1.primalSolution[2]).toBeCloseTo(9, 6);
    expect(sim1.optimalObjective).toBeCloseTo(78, 6);
    expect(sim1.dualSolution[0]).toBeCloseTo(2, 6);
    expect(sim1.dualSolution[1]).toBeCloseTo(1, 6);
    expect(sim1.steps[0].varNames).toContain('s1');
    expect(sim1.steps[0].varNames).toContain('s2');

    // 2. 負係数あり・最小比テストの非正係数行除外
    const sim2 = runSimplexSteps({
      sense: 'max',
      c: [2, 5],
      constraints: [
        { a: [-1, 1], op: '<=', b: 4 },
        { a: [1, 2], op: '<=', b: 14 },
        { a: [3, -1], op: '<=', b: 15 },
      ],
    });
    expect(sim2.finalStatus).toBe('optimal');
    expect(sim2.steps[0].enteringCol).toBe(1); // x2 が進入
    expect(sim2.steps[0].ratios[2]).toBeNull(); // 第3制約の x2 係数は -1 <= 0 のため除外
    expect(sim2.primalSolution[0]).toBeCloseTo(2, 6);
    expect(sim2.primalSolution[1]).toBeCloseTo(6, 6);
    expect(sim2.optimalObjective).toBeCloseTo(34, 6);

    // 3. 原点が非実行可能な最小化問題（二段階法）
    const sim3 = runSimplexSteps({
      sense: 'min',
      c: [2, 5],
      constraints: [
        { a: [1, 2], op: '>=', b: 6 },
        { a: [2, 1], op: '>=', b: 6 },
      ],
    });
    expect(sim3.usedPhase1).toBe(true);
    expect(sim3.finalStatus).toBe('optimal');
    expect(sim3.primalSolution[0]).toBeCloseTo(6, 6);
    expect(sim3.primalSolution[1]).toBeCloseTo(0, 6);
    expect(sim3.optimalObjective).toBeCloseTo(12, 6);
  });

  it('双対理論・相補性条件・感度分析の数値と範囲が厳密に一致する', () => {
    // 生産配分問題の双対解・相補性条件
    const prodProb = {
      sense: 'max' as const,
      c: [5, 4],
      constraints: [
        { a: [2, 1], op: '<=' as const, b: 18 },
        { a: [1, 2], op: '<=' as const, b: 18 },
        { a: [1, 0], op: '<=' as const, b: 7 },
      ],
    };
    const simProd = runSimplexSteps(prodProb);
    expect(simProd.dualSolution[0]).toBeCloseTo(2, 6);
    expect(simProd.dualSolution[1]).toBeCloseTo(1, 6);
    expect(simProd.dualSolution[2]).toBeCloseTo(0, 6);

    const dualSum = buildDualSummary(prodProb);
    expect(dualSum.dualSense).toBe('min');
    expect(dualSum.dualConstraintOp).toBe('>=');

    const csRows = evaluateComplementarySlackness(
      prodProb,
      simProd.primalSolution,
      simProd.dualSolution
    );
    expect(csRows.every((r) => r.isSatisfied)).toBe(true);

    // 配合最小化問題の双対解（Δb2 = 0.5 -> 1.1万円増）
    const mixProb = {
      sense: 'min' as const,
      c: [4, 5],
      constraints: [
        { a: [3, 1], op: '>=' as const, b: 9 },
        { a: [1, 2], op: '>=' as const, b: 8 },
        { a: [0, 1], op: '>=' as const, b: 1 },
      ],
    };
    const simMix = runSimplexSteps(mixProb);
    expect(simMix.dualSolution[0]).toBeCloseTo(0.6, 6);
    expect(simMix.dualSolution[1]).toBeCloseTo(2.2, 6);
    expect(simMix.dualSolution[2]).toBeCloseTo(0, 6);
    expect(simMix.dualSolution[1] * 0.5).toBeCloseTo(1.1, 6);

    // 感度分析：基準3変数最大化問題
    const simBase = runSimplexSteps({
      sense: 'max',
      c: [5, 3, 7],
      constraints: [
        { a: [2, 1, 2], op: '<=', b: 24 },
        { a: [1, 2, 3], op: '<=', b: 30 },
      ],
    });
    const optStep = simBase.steps[simBase.steps.length - 1];
    // 第2制約の右辺 Δb2 の許容範囲 [-18, 6]
    const rhsSens = analyzeRhsSensitivity(optStep, simBase.constraintVarCols[1], 1, 4);
    expect(rhsSens.shadowPrice).toBeCloseTo(1, 6);
    expect(rhsSens.minDelta).toBeCloseTo(-18, 6);
    expect(rhsSens.maxDelta).toBeCloseTo(6, 6);
    expect(rhsSens.isBasisValid).toBe(true);
    expect(rhsSens.updatedZValue).toBeCloseTo(82, 6);

    // 基底変数 x1 の目的係数 Δc1 の許容範囲 [-8/3, 2]
    const objSensX1 = analyzeObjSensitivity(optStep, 0, 1.5);
    expect(objSensX1.isBasic).toBe(true);
    expect(objSensX1.minDelta).toBeCloseTo(-8 / 3, 6);
    expect(objSensX1.maxDelta).toBeCloseTo(2, 6);
    expect(objSensX1.isBasisValid).toBe(true);
    expect(objSensX1.updatedZValue).toBeCloseTo(82.5, 6);

    // 非基底変数 x2 の許容範囲 (-∞, 1]
    const objSensX2 = analyzeObjSensitivity(optStep, 1, 0.5);
    expect(objSensX2.isBasic).toBe(false);
    expect(objSensX2.maxDelta).toBeCloseTo(1, 6);
    expect(objSensX2.isBasisValid).toBe(true);
  });

  it('輸送問題と割当問題ソルバーが計画通りの厳密解・シャドー・プライス・貪欲法比較を返す', () => {
    const tr = solveTransportation(
      [
        [4, 7, 11],
        [6, 5, 8],
        [9, 6, 3],
      ],
      [40, 28, 22],
      [25, 25, 30]
    );
    expect(tr.feasible).toBe(true);
    expect(tr.totalCost).toBeCloseTo(365, 6);
    expect(tr.supplyShadowPrices[0]).toBeCloseTo(0, 6);
    expect(tr.supplyShadowPrices[1]).toBeCloseTo(2, 6);
    expect(tr.supplyShadowPrices[2]).toBeCloseTo(7, 6);

    // プラント丙を +1 した場合は費用がちょうど 7 減るが、+8 すると基底が変わり 56 より減り方が小さくなる
    const trPlus1 = solveTransportation(
      [
        [4, 7, 11],
        [6, 5, 8],
        [9, 6, 3],
      ],
      [40, 28, 23],
      [25, 25, 30]
    );
    expect(tr.totalCost - trPlus1.totalCost).toBeCloseTo(7, 6);

    const trPlus8 = solveTransportation(
      [
        [4, 7, 11],
        [6, 5, 8],
        [9, 6, 3],
      ],
      [40, 28, 30],
      [25, 25, 30]
    );
    expect(trPlus8.totalCost).toBeCloseTo(315, 6);
    expect(tr.totalCost - trPlus8.totalCost).toBeCloseTo(50, 6);

    // プラント乙を +1 (28->29) した場合は費用が 2 減って 363 になる
    const trEtaPlus1 = solveTransportation(
      [
        [4, 7, 11],
        [6, 5, 8],
        [9, 6, 3],
      ],
      [40, 29, 22],
      [25, 25, 30]
    );
    expect(trEtaPlus1.totalCost).toBeCloseTo(363, 6);

    // マンハッタン距離による緊急パトロール車 3x3 正方割当
    const assign = solveAssignmentManhattan(
      [
        { id: 'A', label: '車A', x: 1, y: 1 },
        { id: 'B', label: '車B', x: 2, y: 5 },
        { id: 'C', label: '車C', x: 5, y: 5 },
      ],
      [
        { id: 'P', label: '橋梁P', x: 4, y: 5 },
        { id: 'Q', label: '橋梁Q', x: 7, y: 7 },
        { id: 'R', label: '橋梁R', x: 1, y: 4 },
      ]
    );
    expect(assign.optimal.totalDistance).toBe(9);
    expect(assign.greedy.totalDistance).toBe(15);
    expect(assign.gap).toBe(6);
  });

  it('非線形計画モデル：最適性条件・定値性・狭義凸性・感度・包絡線定理・ニュートン法を検証する', () => {
    // 1. 狭義凸2次計画モデルの最適点 (2, 1) と最小値 5
    const evQuad = evaluateNlpPoint('quad-convex', 2, 1);
    expect(evQuad.value).toBeCloseTo(5, 6);
    expect(evQuad.gradNorm).toBeCloseTo(0, 6);
    expect(evQuad.definiteness).toBe('positive-definite');

    // 2. 3次非凸関数：局所最小点 (1,1) vs 鞍点 (-1,1)
    const evMin = evaluateNlpPoint('cubic-saddle', 1, 1);
    expect(evMin.gradNorm).toBeCloseTo(0, 6);
    expect(evMin.definiteness).toBe('positive-definite');
    const evSaddle = evaluateNlpPoint('cubic-saddle', -1, 1);
    expect(evSaddle.gradNorm).toBeCloseTo(0, 6);
    expect(evSaddle.definiteness).toBe('indefinite');

    // 3. インフラ維持モデル θ=2 の厳密解・感度・包絡線・ニュートン1回目
    const optInfra = solveParametricOptimum('infra-cost', 2);
    expect(optInfra.xStar[0]).toBeCloseTo(2, 6);
    expect(optInfra.xStar[1]).toBeCloseTo(2, 6);
    expect(optInfra.fStar).toBeCloseTo(16, 6);
    expect(optInfra.dxDtheta[0]).toBeCloseTo(-1 / 3, 6);
    expect(optInfra.dxDtheta[1]).toBeCloseTo(-1 / 6, 6);
    expect(optInfra.dFDtheta).toBeCloseTo(2, 6);

    const newtonInfra = runNewtonMethod('infra-cost', [1, 1], 6, 2);
    expect(newtonInfra[0].nextX?.[0]).toBeCloseTo(1.375, 6);
    expect(newtonInfra[0].nextX?.[1]).toBeCloseTo(1.375, 6);
    expect(newtonInfra[newtonInfra.length - 1].x[0]).toBeCloseTo(2, 5);
    expect(newtonInfra[newtonInfra.length - 1].x[1]).toBeCloseTo(2, 5);

    // 4. 対数障壁・2次モデル θ=1 の厳密解・感度・包絡線定理
    const optLog = solveParametricOptimum('log-quad', 1);
    expect(optLog.xStar[0]).toBeCloseTo(2, 6);
    expect(optLog.xStar[1]).toBeCloseTo(1, 6);
    expect(optLog.dxDtheta[0]).toBeCloseTo(-1.2, 6);
    expect(optLog.dxDtheta[1]).toBeCloseTo(-0.2, 6);
    expect(optLog.dFDtheta).toBeCloseTo(4, 6);

    // 数値中心差分による包絡線定理のクロスチェック
    const eps = 1e-4;
    const fPlus = solveParametricOptimum('log-quad', 1 + eps).fStar;
    const fMinus = solveParametricOptimum('log-quad', 1 - eps).fStar;
    expect((fPlus - fMinus) / (2 * eps)).toBeCloseTo(optLog.dFDtheta, 4);

    // 最急降下法も定義域を保ちながら降下する
    const gd = runGradientDescent('infra-cost', [1, 1], 0.05, 10, 2);
    expect(gd.length).toBeGreaterThan(2);
    const lastGd = gd[gd.length - 1];
    expect(NLP_MODELS['infra-cost'].evaluate(lastGd[0], lastGd[1], 2)).toBeLessThan(
      NLP_MODELS['infra-cost'].evaluate(1, 1, 2)
    );
  });
});
