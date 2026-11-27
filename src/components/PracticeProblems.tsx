import React, { useMemo } from 'react';
import { type MohrInputs } from '../utils/mohrPhysics';
import {
  ChapterExercisePanel,
  type ContinuumExercise,
} from './continuum/ChapterExercisePanel';

interface PracticeProblemsProps {
  onLoadPreset: (preset: Partial<MohrInputs>) => void;
  completedIds: number[];
  onToggleProblemDone: (id: number) => void;
  onMarkProblemDone: (id: number) => void;
}

export const PracticeProblems: React.FC<PracticeProblemsProps> = ({
  onLoadPreset,
  completedIds,
  onToggleProblemDone,
  onMarkProblemDone,
}) => {
  const completedStringIds = useMemo(() => completedIds.map((id) => `mohr-q${id}`), [completedIds]);

  const exercises = useMemo<ContinuumExercise[]>(
    () => [
      {
        id: 'mohr-q1',
        category: '基本の応力計算',
        title: '問1：主応力から任意面の垂直応力・せん断応力を求める',
        statement:
          'ある土要素に最大主応力 σ₁ = 220 kPa、最小主応力 σ₃ = 100 kPa が作用している。最大主応力面（水平面）から反時計回りに θ = 30° 傾いた面における垂直応力 σ_θ（kPa）を求めよ（せん断応力 τ_θ も解説で確認しよう）。',
        kind: 'numeric',
        expectedValue: 190,
        tolerance: 0.5,
        unit: 'kPa',
        inputHint: '例: 190',
        hint: '中心 C = (σ₁ + σ₃)/2 = 160 kPa、半径 R = (σ₁ − σ₃)/2 = 60 kPa、円上の角度は 2θ = 60° です。',
        steps: [
          {
            label: 'モール円の中心 C と半径 R を求める',
            math: 'C = \\frac{220 + 100}{2} = 160\\text{ kPa},\\quad R = \\frac{220 - 100}{2} = 60\\text{ kPa}',
          },
          {
            label: '円上の回転角 2θ = 60° を用いて σ_θ を計算する',
            math: '\\sigma_{30^\\circ} = 160 + 60\\cos(60^\\circ) = 160 + 30 = 190\\text{ kPa}',
          },
          {
            label: 'せん断応力 τ_θ',
            math: '\\tau_{30^\\circ} = 60\\sin(60^\\circ) = 60 \\times \\frac{\\sqrt{3}}{2} \\approx 51.96\\text{ kPa}',
          },
        ],
        answerSummary: 'σ_θ = 190 kPa, τ_θ = 51.96 kPa',
        onApplyPreset: () =>
          onLoadPreset({
            sigma1: 220,
            sigma3: 100,
            theta: 30,
            u: 0,
            useEffectiveStress: false,
          }),
      },
      {
        id: 'mohr-q2',
        category: '有効応力と間隙水圧',
        title: '問2：間隙水圧が作用するときの有効応力円の中心 C\'',
        statement:
          "飽和粘土地盤において、全応力で σ₁ = 260 kPa、σ₃ = 120 kPa が作用しており、間隙水圧が u = 50 kPa 測定された。有効応力円の中心 C'（kPa）を求めよ。",
        kind: 'numeric',
        expectedValue: 140,
        tolerance: 0.5,
        unit: 'kPa',
        inputHint: '例: 140',
        hint: "全応力円の中心 C = (260 + 120)/2 から間隙水圧 u = 50 kPa を差し引いた値が C' = C − u です。",
        steps: [
          {
            label: "テルツァーギの有効応力の原理 σ' = σ - u を適用する",
            math: "\\sigma'_1 = 260 - 50 = 210\\text{ kPa},\\quad \\sigma'_3 = 120 - 50 = 70\\text{ kPa}",
          },
          {
            label: "有効応力円の中心 C' と半径 R' を求める",
            math: "C' = \\frac{210 + 70}{2} = 140\\text{ kPa},\\quad R' = \\frac{210 - 70}{2} = 70\\text{ kPa}",
          },
          {
            label: 'ポイント：間隙水圧 u により円は左へ平行移動するが、半径 R は変化しない',
            math: "C' = C - u = 190 - 50 = 140\\text{ kPa},\\quad R' = R = 70\\text{ kPa}",
          },
        ],
        answerSummary: "C' = 140 kPa（σ'₁ = 210 kPa, σ'₃ = 70 kPa, R' = 70 kPa）",
        onApplyPreset: () =>
          onLoadPreset({
            sigma1: 260,
            sigma3: 120,
            theta: 45,
            u: 50,
            useEffectiveStress: true,
          }),
      },
      {
        id: 'mohr-q3',
        category: '三軸圧縮試験の破壊判定',
        title: '問3：モール・クーロンの破壊規準と破壊時最大主応力 σ\'₁',
        statement:
          "粘着力 c = 15 kPa、内部摩擦角 φ = 30° の土に対して、有効拘束圧 σ'₃ = 100 kPa で三軸圧縮試験を行った。破壊時の有効最大主応力 σ'₁（kPa、小数第2位または整数近似）を求めよ。",
        kind: 'numeric',
        expectedValue: 351.96,
        tolerance: 1.0,
        unit: 'kPa',
        inputHint: '例: 352',
        hint: "σ'₁ = σ'₃ tan²(45°+φ/2) + 2c tan(45°+φ/2) に tan(60°) = √3 ≈ 1.732 を代入します。",
        steps: [
          {
            label: '破壊時の主応力関係式（Rankine / Mohr-Coulomb 式）を用いる',
            math: "\\sigma'_1 = \\sigma'_3 \\tan^2\\left(45^\\circ + \\frac{\\phi}{2}\\right) + 2c\\tan\\left(45^\\circ + \\frac{\\phi}{2}\\right)",
          },
          {
            label: 'φ = 30° より tan(45° + 15°) = tan(60°) = √3 ≈ 1.732 を代入する',
            math: "\\sigma'_1 = 100 \\times (\\sqrt{3})^2 + 2 \\times 15 \\times \\sqrt{3} = 300 + 30\\sqrt{3} \\approx 351.96\\text{ kPa}",
          },
          {
            label: '理論上のせん断面角度 θ_f',
            math: '\\theta_f = 45^\\circ + \\frac{30^\\circ}{2} = 60^\\circ',
          },
        ],
        answerSummary: "σ'₁ ≈ 351.96 kPa, θ_f = 60°",
        onApplyPreset: () =>
          onLoadPreset({
            sigma1: 352,
            sigma3: 100,
            theta: 60,
            c: 15,
            phi: 30,
            u: 0,
            useEffectiveStress: false,
          }),
      },
    ],
    [onLoadPreset]
  );

  const parseNumericId = (id: string) => Number(id.replace('mohr-q', ''));

  return (
    <ChapterExercisePanel
      chapterTitle="モールの応力円・破壊規準"
      heading="テスト対策・オリジナル演習問題（全3問・自動採点対応）"
      progressLabel="演習達成"
      exercises={exercises}
      completedIds={completedStringIds}
      onToggleDone={(id) => onToggleProblemDone(parseNumericId(id))}
      onMarkDone={(id) => onMarkProblemDone(parseNumericId(id))}
    />
  );
};
