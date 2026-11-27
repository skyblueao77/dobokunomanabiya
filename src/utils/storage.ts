import { LEARNING_UNITS, type UnitId } from '../data/curriculum';

const PROGRESS_KEY = 'dobokunomanabiya-progress-v1';
const VALID_UNIT_IDS = new Set<string>(LEARNING_UNITS.map((u) => u.id));

export interface StudyProgress {
  completedUnits: UnitId[];
  completedProblemIds: number[];
  completedContinuumExerciseIds: string[];
  completedMathProgExerciseIds: string[];
  completedBasicExerciseIds: string[];
  lastVisitedUnit: UnitId | null;
}

export const DEFAULT_PROGRESS: StudyProgress = {
  completedUnits: [],
  completedProblemIds: [],
  completedContinuumExerciseIds: [],
  completedMathProgExerciseIds: [],
  completedBasicExerciseIds: [],
  lastVisitedUnit: null,
};

function sanitizeStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  const unique = new Set<string>();
  for (const item of val) {
    if (typeof item === 'string' && item.trim().length > 0 && item.length <= 64) {
      unique.add(item);
    }
  }
  return Array.from(unique);
}

function sanitizeNumberArray(val: unknown): number[] {
  if (!Array.isArray(val)) return [];
  const unique = new Set<number>();
  for (const item of val) {
    if (typeof item === 'number' && Number.isInteger(item) && item >= 0 && item <= 10_000) {
      unique.add(item);
    }
  }
  return Array.from(unique);
}

export function validateAndNormalizeProgress(raw: unknown): StudyProgress | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  const hasKnownKey =
    'completedUnits' in obj ||
    'completedProblemIds' in obj ||
    'completedContinuumExerciseIds' in obj ||
    'completedMathProgExerciseIds' in obj ||
    'completedBasicExerciseIds' in obj ||
    'lastVisitedUnit' in obj;
  if (!hasKnownKey) {
    return null;
  }

  const completedUnits = sanitizeStringArray(obj.completedUnits).filter((id): id is UnitId =>
    VALID_UNIT_IDS.has(id)
  );
  const lastVisitedUnit =
    typeof obj.lastVisitedUnit === 'string' && VALID_UNIT_IDS.has(obj.lastVisitedUnit)
      ? (obj.lastVisitedUnit as UnitId)
      : null;

  return {
    completedUnits,
    completedProblemIds: sanitizeNumberArray(obj.completedProblemIds),
    completedContinuumExerciseIds: sanitizeStringArray(obj.completedContinuumExerciseIds),
    completedMathProgExerciseIds: sanitizeStringArray(obj.completedMathProgExerciseIds),
    completedBasicExerciseIds: sanitizeStringArray(obj.completedBasicExerciseIds),
    lastVisitedUnit,
  };
}

export function loadStudyProgress(): StudyProgress {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed: unknown = JSON.parse(raw);
    return validateAndNormalizeProgress(parsed) ?? DEFAULT_PROGRESS;
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

export function resetStudyProgress(): void {
  try {
    window.localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // Graceful no-op when storage is unavailable
  }
}

export function exportProgressJson(progress: StudyProgress): string {
  return JSON.stringify(
    {
      schema: 'dobokunomanabiya-progress-v1',
      exportedAt: new Date().toISOString(),
      ...progress,
    },
    null,
    2
  );
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
