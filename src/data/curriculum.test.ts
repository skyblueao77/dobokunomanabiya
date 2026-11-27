import { describe, expect, it } from 'vitest';
import {
  LEARNING_UNITS,
  SUBJECTS,
  UNIT_EXERCISE_IDS,
  getSubjectMeta,
  getTotalExerciseProgress,
  getUnitExerciseProgress,
  getUnitsBySubject,
} from './curriculum';

describe('curriculum', () => {
  it('orders top-bar subjects as 構造力学, 水理学, 土質力学, 数理計画', () => {
    expect(SUBJECTS.map((s) => s.id)).toEqual(['structural', 'hydraulics', 'soil', 'math-programming']);
    expect(SUBJECTS.map((s) => s.name)).toEqual(['構造力学', '水理学', '土質力学', '数理計画']);
  });

  it('returns learning units grouped by subject without gaps', () => {
    const totalGrouped = SUBJECTS.reduce(
      (sum, subject) => sum + getUnitsBySubject(subject.id).length,
      0
    );
    expect(totalGrouped).toBe(LEARNING_UNITS.length);
    expect(getUnitsBySubject('structural').map((u) => u.id)).toEqual([
      'beam-sfd-bmd',
      'cantilever-beam',
    ]);
    expect(getUnitsBySubject('hydraulics').map((u) => u.id)).toEqual([
      'open-channel-flow',
      'specific-energy-jump',
    ]);
    expect(getUnitsBySubject('soil').map((u) => u.id)).toEqual([
      'geomechanics-continuum',
      'mohr-circle',
      'rankine-earth-pressure',
    ]);
    expect(getUnitsBySubject('math-programming').map((u) => u.id)).toEqual([
      'lp-optimization',
      'nlp-optimization',
    ]);
  });

  it('resolves subject metadata for every subject id', () => {
    for (const s of SUBJECTS) {
      expect(getSubjectMeta(s.id)).toEqual(s);
    }
  });

  it('enables practice sets on all 9 units and aggregates 46 total exercises accurately', () => {
    expect(LEARNING_UNITS).toHaveLength(9);
    for (const unit of LEARNING_UNITS) {
      expect(unit.hasPracticeSet).toBe(true);
      expect(unit.exerciseCount).toBe(UNIT_EXERCISE_IDS[unit.id].length);
    }
    const snapshot = {
      completedProblemIds: [1, 3],
      completedContinuumExerciseIds: ['ch1-q1', 'ch2-q2'],
      completedMathProgExerciseIds: ['lp-ch1-q1', 'nlp-ch1-q1'],
      completedBasicExerciseIds: ['beam-q1', 'cantilever-q1', 'channel-q1', 'energy-q1', 'rankine-q1'],
    };
    expect(getUnitExerciseProgress('beam-sfd-bmd', snapshot)).toEqual({ solved: 1, total: 3 });
    expect(getUnitExerciseProgress('cantilever-beam', snapshot)).toEqual({ solved: 1, total: 3 });
    expect(getUnitExerciseProgress('specific-energy-jump', snapshot)).toEqual({ solved: 1, total: 3 });
    expect(getUnitExerciseProgress('mohr-circle', snapshot)).toEqual({ solved: 2, total: 3 });
    expect(getTotalExerciseProgress(snapshot)).toEqual({ solved: 11, total: 46 });
  });
});
