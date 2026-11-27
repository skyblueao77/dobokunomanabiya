import React, { lazy } from 'react';
import { type UnitId } from '../../data/curriculum';
import { buildRoutePath } from '../../utils/router';
import {
  CourseModuleShell,
  type CourseChapterDescriptor,
} from '../CourseModuleShell';

const Ch1StressTensor = lazy(() =>
  import('../continuum/Ch1StressTensor').then((m) => ({ default: m.Ch1StressTensor }))
);
const Ch2CauchyTransform = lazy(() =>
  import('../continuum/Ch2CauchyTransform').then((m) => ({ default: m.Ch2CauchyTransform }))
);
const Ch3PrincipalInvariants = lazy(() =>
  import('../continuum/Ch3PrincipalInvariants').then((m) => ({
    default: m.Ch3PrincipalInvariants,
  }))
);
const Ch4MohrPole = lazy(() =>
  import('../continuum/Ch4MohrPole').then((m) => ({ default: m.Ch4MohrPole }))
);
const Ch5ElasticGroundStress = lazy(() =>
  import('../continuum/Ch5ElasticGroundStress').then((m) => ({
    default: m.Ch5ElasticGroundStress,
  }))
);
const Ch6ElasticDeformation = lazy(() =>
  import('../continuum/Ch6ElasticDeformation').then((m) => ({
    default: m.Ch6ElasticDeformation,
  }))
);

export type ChapterIndex = 1 | 2 | 3 | 4 | 5 | 6;

const CHAPTERS: readonly CourseChapterDescriptor<ChapterIndex>[] = [
  { id: 1, shortTitle: '1. 多次元応力の表現', exerciseIds: ['ch1-q1', 'ch1-q2'] },
  { id: 2, shortTitle: '2. コーシーの公式・変換', exerciseIds: ['ch2-q1', 'ch2-q2'] },
  { id: 3, shortTitle: '3. 主応力と不変量', exerciseIds: ['ch3-q1', 'ch3-q2'] },
  { id: 4, shortTitle: '4. モール円と用極法', exerciseIds: ['ch4-q1', 'ch4-q2'] },
  { id: 5, shortTitle: '5. 弾性地盤内の応力', exerciseIds: ['ch5-q1', 'ch5-q2'] },
  { id: 6, shortTitle: '6. 弾性地盤の応力と変形', exerciseIds: ['ch6-q1', 'ch6-q2'] },
];

const UNIT_PATH = buildRoutePath('geomechanics-continuum');

interface GeomechanicsCourseModuleProps {
  isCompleted: boolean;
  onToggleUnitComplete: () => void;
  completedExerciseIds: string[];
  onToggleExerciseDone: (id: string) => void;
  onMarkExerciseDone: (id: string) => void;
  onBackToPortal: () => void;
  onOpenUnit: (unitId: UnitId) => void;
}

export const GeomechanicsCourseModule: React.FC<GeomechanicsCourseModuleProps> = ({
  isCompleted,
  onToggleUnitComplete,
  completedExerciseIds,
  onToggleExerciseDone,
  onMarkExerciseDone,
  onBackToPortal,
  onOpenUnit,
}) => (
  <CourseModuleShell
    unitPath={UNIT_PATH}
    title="土質力学・地盤連続体｜応力テンソル〜弾性地盤の応力と変形"
    description="多次元応力・コーシーの公式・主応力と不変量・用極法・弾性地盤の応力（Boussinesq / 重ね合わせ）・変形を「理解 → 想像 → 演習」で体系的に学びます。"
    tablistAriaLabel="コースの学習ステップ（第1章〜第6章）"
    chapters={CHAPTERS}
    isCompleted={isCompleted}
    onToggleUnitComplete={onToggleUnitComplete}
    completedExerciseIds={completedExerciseIds}
    onBackToPortal={onBackToPortal}
    renderChapter={(chId) => {
      switch (chId) {
        case 1:
          return (
            <Ch1StressTensor
              completedIds={completedExerciseIds}
              onToggleDone={onToggleExerciseDone}
              onMarkDone={onMarkExerciseDone}
            />
          );
        case 2:
          return (
            <Ch2CauchyTransform
              completedIds={completedExerciseIds}
              onToggleDone={onToggleExerciseDone}
              onMarkDone={onMarkExerciseDone}
            />
          );
        case 3:
          return (
            <Ch3PrincipalInvariants
              completedIds={completedExerciseIds}
              onToggleDone={onToggleExerciseDone}
              onMarkDone={onMarkExerciseDone}
            />
          );
        case 4:
          return (
            <Ch4MohrPole
              completedIds={completedExerciseIds}
              onToggleDone={onToggleExerciseDone}
              onMarkDone={onMarkExerciseDone}
              onOpenUnit={onOpenUnit}
            />
          );
        case 5:
          return (
            <Ch5ElasticGroundStress
              completedIds={completedExerciseIds}
              onToggleDone={onToggleExerciseDone}
              onMarkDone={onMarkExerciseDone}
            />
          );
        case 6:
          return (
            <Ch6ElasticDeformation
              completedIds={completedExerciseIds}
              onToggleDone={onToggleExerciseDone}
              onMarkDone={onMarkExerciseDone}
            />
          );
      }
    }}
  />
);

export default GeomechanicsCourseModule;
