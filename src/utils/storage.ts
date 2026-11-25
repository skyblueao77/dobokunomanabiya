import { type UnitId } from '../data/curriculum';

const PROGRESS_KEY = 'dobokunomanabiya-progress-v1';

export interface StudyProgress {
  completedUnits: UnitId[];
  completedProblemIds: number[];
  completedContinuumExerciseIds: string[];
  completedMathProgExerciseIds: string[];
  lastVisitedUnit: UnitId | null;
}

export const DEFAULT_PROGRESS: StudyProgress = {
  completedUnits: [],
  completedProblemIds: [],
  completedContinuumExerciseIds: [],
  completedMathProgExerciseIds: [],
  lastVisitedUnit: null,
};

export function loadStudyProgress(): StudyProgress {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<StudyProgress>;
    return {
      completedUnits: Array.isArray(parsed.completedUnits) ? parsed.completedUnits : [],
      completedProblemIds: Array.isArray(parsed.completedProblemIds)
        ? parsed.completedProblemIds
        : [],
      completedContinuumExerciseIds: Array.isArray(parsed.completedContinuumExerciseIds)
        ? parsed.completedContinuumExerciseIds
        : [],
      completedMathProgExerciseIds: Array.isArray(parsed.completedMathProgExerciseIds)
        ? parsed.completedMathProgExerciseIds
        : [],
      lastVisitedUnit: parsed.lastVisitedUnit ?? null,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveStudyProgress(progress: StudyProgress): void {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Graceful no-op when storage is unavailable
  }
}

export type ThemePreference = 'system' | 'light' | 'dark';

export function getThemePreference(): ThemePreference {
  try {
    const val = window.localStorage.getItem('color-scheme');
    if (val === 'light' || val === 'dark') return val;
    return 'system';
  } catch {
    return 'system';
  }
}

export function applyThemePreference(pref: ThemePreference): void {
  const meta = document.querySelector('meta[name="color-scheme"]');
  const content = pref === 'system' ? 'light dark' : pref;
  if (meta) {
    meta.setAttribute('content', content);
  }
  try {
    if (pref === 'system') {
      window.localStorage.removeItem('color-scheme');
    } else {
      window.localStorage.setItem('color-scheme', pref);
    }
  } catch {
    // Ignore storage restriction
  }
}
