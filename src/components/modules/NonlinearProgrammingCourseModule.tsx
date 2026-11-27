import React, { lazy } from 'react';
import { buildRoutePath } from '../../utils/router';
import {
  CourseModuleShell,
  type CourseChapterDescriptor,
} from '../CourseModuleShell';

const NlpCh1Optimality = lazy(() =>
  import('../mathprog/NlpCh1Optimality').then((m) => ({ default: m.NlpCh1Optimality }))
);
const NlpCh2ConvexSensitivity = lazy(() =>
  import('../mathprog/NlpCh2ConvexSensitivity').then((m) => ({
    default: m.NlpCh2ConvexSensitivity,
  }))
);
const NlpCh3Newton = lazy(() =>
  import('../mathprog/NlpCh3Newton').then((m) => ({ default: m.NlpCh3Newton }))
);

export type NlpChapterIndex = 1 | 2 | 3;

const NLP_CHAPTERS: readonly CourseChapterDescriptor<NlpChapterIndex>[] = [
  { id: 1, shortTitle: '1. 最適性条件とヘッセ行列', exerciseIds: ['nlp-ch1-q1', 'nlp-ch1-q2'] },
  { id: 2, shortTitle: '2. 狭義凸性と感度分析', exerciseIds: ['nlp-ch2-q1', 'nlp-ch2-q2'] },
  { id: 3, shortTitle: '3. ニュートン法と収束', exerciseIds: ['nlp-ch3-q1', 'nlp-ch3-q2'] },
];

const UNIT_PATH = buildRoutePath('nlp-optimization');

interface NonlinearProgrammingCourseModuleProps {
  isCompleted: boolean;
  onToggleUnitComplete: () => void;
  completedExerciseIds: string[];
  onToggleExerciseDone: (id: string) => void;
  onMarkExerciseDone: (id: string) => void;
  onBackToPortal: () => void;
}

export const NonlinearProgrammingCourseModule: React.FC<NonlinearProgrammingCourseModuleProps> = ({
  isCompleted,
  onToggleUnitComplete,
  completedExerciseIds,
  onToggleExerciseDone,
  onMarkExerciseDone,
  onBackToPortal,
}) => (
  <CourseModuleShell
    unitPath={UNIT_PATH}
    title="数理計画｜非線形計画法（最適性条件・狭義凸性・包絡線定理・ニュートン法）"
    description="制約なし非線形最適化の理論と計算手法を、等高線マップと勾配・ヘッセ行列のリアルタイム可視化で直感的に習得します。"
    tablistAriaLabel="非線形計画法コースの学習ステップ（第1章〜第3章）"
    chapters={NLP_CHAPTERS}
    isCompleted={isCompleted}
    onToggleUnitComplete={onToggleUnitComplete}
    completedExerciseIds={completedExerciseIds}
    onBackToPortal={onBackToPortal}
    renderChapter={(chId) => {
      switch (chId) {
        case 1:
          return (
            <NlpCh1Optimality
              completedIds={completedExerciseIds}
              onToggleDone={onToggleExerciseDone}
              onMarkDone={onMarkExerciseDone}
            />
          );
        case 2:
          return (
            <NlpCh2ConvexSensitivity
              completedIds={completedExerciseIds}
              onToggleDone={onToggleExerciseDone}
              onMarkDone={onMarkExerciseDone}
            />
          );
        case 3:
          return (
            <NlpCh3Newton
              completedIds={completedExerciseIds}
              onToggleDone={onToggleExerciseDone}
              onMarkDone={onMarkExerciseDone}
            />
          );
      }
    }}
  />
);

export default NonlinearProgrammingCourseModule;
