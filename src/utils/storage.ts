import { type UnitId } from '../data/curriculum';

const PROGRESS_KEY = 'dobokunomanabiya-progress-v1';
const LEGACY_PROGRESS_KEY = 'doboku-lab-progress-v1';

export interface StudyProgress {
  completedUnits: UnitId[];
  completedProblemIds: number[];
  lastVisitedUnit: UnitId | null;
}

const DEFAULT_PROGRESS: StudyProgress = {
  completedUnits: [],
  completedProblemIds: [],
  lastVisitedUnit: null,
};

export function loadStudyProgress(): StudyProgress {
  try {
    const raw =
      window.localStorage.getItem(PROGRESS_KEY) ??
      window.localStorage.getItem(LEGACY_PROGRESS_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<StudyProgress>;
    return {
      completedUnits: Array.isArray(parsed.completedUnits) ? parsed.completedUnits : [],
      completedProblemIds: Array.isArray(parsed.completedProblemIds)
        ? parsed.completedProblemIds
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
