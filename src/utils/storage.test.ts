import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROGRESS,
  exportProgressJson,
  validateAndNormalizeProgress,
} from './storage';

describe('study progress storage validation & serialization', () => {
  it('validates and normalizes exported progress JSON cleanly', () => {
    const sample = {
      ...DEFAULT_PROGRESS,
      completedUnits: ['beam-sfd-bmd', 'mohr-circle'] as const,
      completedProblemIds: [1, 2, 2],
      completedBasicExerciseIds: ['beam-q1', 'channel-q2', 'beam-q1'],
      completedContinuumExerciseIds: ['ch1-q1'],
      completedMathProgExerciseIds: ['lp-ch1-q1'],
      lastVisitedUnit: 'beam-sfd-bmd' as const,
    };
    const json = exportProgressJson({
      ...sample,
      completedUnits: [...sample.completedUnits],
    });
    const parsed: unknown = JSON.parse(json);
    const normalized = validateAndNormalizeProgress(parsed);

    expect(normalized).toEqual({
      completedUnits: ['beam-sfd-bmd', 'mohr-circle'],
      completedProblemIds: [1, 2],
      completedBasicExerciseIds: ['beam-q1', 'channel-q2'],
      completedContinuumExerciseIds: ['ch1-q1'],
      completedMathProgExerciseIds: ['lp-ch1-q1'],
      lastVisitedUnit: 'beam-sfd-bmd',
    });
  });

  it('strips invalid unit IDs and rejects unrelated JSON payloads', () => {
    expect(validateAndNormalizeProgress(null)).toBeNull();
    expect(validateAndNormalizeProgress([])).toBeNull();
    expect(validateAndNormalizeProgress({ unrelated: true })).toBeNull();

    const sanitized = validateAndNormalizeProgress({
      completedUnits: ['beam-sfd-bmd', 'nonexistent-unit'],
      completedBasicExerciseIds: ['rankine-q1', '', 123],
      lastVisitedUnit: 'unknown-unit',
    });
    expect(sanitized).toEqual({
      completedUnits: ['beam-sfd-bmd'],
      completedProblemIds: [],
      completedContinuumExerciseIds: [],
      completedMathProgExerciseIds: [],
      completedBasicExerciseIds: ['rankine-q1'],
      lastVisitedUnit: null,
    });
  });
});
