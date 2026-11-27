import React, { lazy } from 'react';
import { buildRoutePath } from '../../utils/router';
import {
  CourseModuleShell,
  type CourseChapterDescriptor,
} from '../CourseModuleShell';

const LpCh1Graphical = lazy(() =>
  import('../mathprog/LpCh1Graphical').then((m) => ({ default: m.LpCh1Graphical }))
);
const LpCh2Simplex = lazy(() =>
  import('../mathprog/LpCh2Simplex').then((m) => ({ default: m.LpCh2Simplex }))
);
const LpCh3Duality = lazy(() =>
  import('../mathprog/LpCh3Duality').then((m) => ({ default: m.LpCh3Duality }))
);
const LpCh4Sensitivity = lazy(() =>
  import('../mathprog/LpCh4Sensitivity').then((m) => ({ default: m.LpCh4Sensitivity }))
);
const LpCh5TransportAssign = lazy(() =>
  import('../mathprog/LpCh5TransportAssign').then((m) => ({
    default: m.LpCh5TransportAssign,
  }))
);

export type LpChapterIndex = 1 | 2 | 3 | 4 | 5;

const LP_CHAPTERS: readonly CourseChapterDescriptor<LpChapterIndex>[] = [
  { id: 1, shortTitle: '1. 定式化と図解法', exerciseIds: ['lp-ch1-q1', 'lp-ch1-q2'] },
  { id: 2, shortTitle: '2. シンプレックス法', exerciseIds: ['lp-ch2-q1', 'lp-ch2-q2'] },
  { id: 3, shortTitle: '3. 双対理論と相補性', exerciseIds: ['lp-ch3-q1', 'lp-ch3-q2'] },
  { id: 4, shortTitle: '4. 感度分析', exerciseIds: ['lp-ch4-q1', 'lp-ch4-q2'] },
  { id: 5, shortTitle: '5. 輸送問題と割当問題', exerciseIds: ['lp-ch5-q1', 'lp-ch5-q2'] },
];

const UNIT_PATH = buildRoutePath('lp-optimization');

interface LinearProgrammingCourseModuleProps {
  isCompleted: boolean;
  onToggleUnitComplete: () => void;
  completedExerciseIds: string[];
  onToggleExerciseDone: (id: string) => void;
  onMarkExerciseDone: (id: string) => void;
  onBackToPortal: () => void;
}

export const LinearProgrammingCourseModule: React.FC<LinearProgrammingCourseModuleProps> = ({
  isCompleted,
  onToggleUnitComplete,
  completedExerciseIds,
  onToggleExerciseDone,
  onMarkExerciseDone,
  onBackToPortal,
}) => (
  <CourseModuleShell
    unitPath={UNIT_PATH}
    title="数理計画｜線形計画法（図解法〜シンプレックス・双対・感度分析・輸送計画）"
    description="土木計画・資源配分で中核となる線形計画の原理を「図解 → タブロー掃き出し → 双対性・感度分析 → 輸送・割当」の5章で体感しながら学びます。"
    tablistAriaLabel="線形計画法コースの学習ステップ（第1章〜第5章）"
    chapters={LP_CHAPTERS}
    isCompleted={isCompleted}
    onToggleUnitComplete={onToggleUnitComplete}
    completedExerciseIds={completedExerciseIds}
    onBackToPortal={onBackToPortal}
    renderChapter={(chId) => {
      switch (chId) {
        case 1:
          return (
            <LpCh1Graphical
              completedIds={completedExerciseIds}
              onToggleDone={onToggleExerciseDone}
              onMarkDone={onMarkExerciseDone}
            />
          );
        case 2:
          return (
            <LpCh2Simplex
              completedIds={completedExerciseIds}
              onToggleDone={onToggleExerciseDone}
              onMarkDone={onMarkExerciseDone}
            />
          );
        case 3:
          return (
            <LpCh3Duality
              completedIds={completedExerciseIds}
              onToggleDone={onToggleExerciseDone}
              onMarkDone={onMarkExerciseDone}
            />
          );
        case 4:
          return (
            <LpCh4Sensitivity
              completedIds={completedExerciseIds}
              onToggleDone={onToggleExerciseDone}
              onMarkDone={onMarkExerciseDone}
            />
          );
        case 5:
          return (
            <LpCh5TransportAssign
              completedIds={completedExerciseIds}
              onToggleDone={onToggleExerciseDone}
              onMarkDone={onMarkExerciseDone}
            />
          );
      }
    }}
  />
);

export default LinearProgrammingCourseModule;
