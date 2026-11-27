import { Suspense, lazy, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  LEARNING_UNITS,
  type SubjectId,
  type UnitId,
} from './data/curriculum';
import {
  DEFAULT_PROGRESS,
  applyThemePreference,
  getThemePreference,
  loadStudyProgress,
  saveStudyProgress,
  type StudyProgress,
  type ThemePreference,
} from './utils/storage';
import {
  buildRoutePath,
  isPlainLeftClick,
  parseLocation,
  type AppRoute,
} from './utils/router';
import { PortalHeader } from './components/PortalHeader';
import { PortalHome } from './components/PortalHome';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WipNoticeBanner } from './components/WipNoticeBanner';
import { UpdateAvailableBanner } from './components/UpdateAvailableBanner';
import { initPwaUpdateWatcher, refreshAppAndClearCaches } from './utils/pwaUpdater';

const emptySubscribe = () => () => {};

const UnitBreadcrumb = lazy(() =>
  import('./components/UnitBreadcrumb').then((m) => ({ default: m.UnitBreadcrumb }))
);
const UnitFaqSection = lazy(() =>
  import('./components/UnitFaqSection').then((m) => ({ default: m.UnitFaqSection }))
);
const GeomechanicsCourseModule = lazy(
  () => import('./components/modules/GeomechanicsCourseModule')
);
const MohrCircleModule = lazy(() => import('./components/modules/MohrCircleModule'));
const RankineEarthModule = lazy(() => import('./components/modules/RankineEarthModule'));
const BeamDiagramModule = lazy(() => import('./components/modules/BeamDiagramModule'));
const OpenChannelModule = lazy(() => import('./components/modules/OpenChannelModule'));
const LinearProgrammingCourseModule = lazy(
  () => import('./components/modules/LinearProgrammingCourseModule')
);
const NonlinearProgrammingCourseModule = lazy(
  () => import('./components/modules/NonlinearProgrammingCourseModule')
);
const LegalPage = lazy(() => import('./components/LegalPage'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));

export interface AppProps {
  initialLocation?: {
    pathname: string;
    search: string;
    hash: string;
  };
}

export function App({ initialLocation }: AppProps = {}) {
  const [initialParsed] = useState(() => {
    if (initialLocation) {
      return parseLocation(
        initialLocation.pathname,
        initialLocation.search,
        initialLocation.hash
      );
    }
    if (typeof window !== 'undefined') {
      return parseLocation(
        window.location.pathname,
        window.location.search,
        window.location.hash
      );
    }
    return parseLocation('/', '', '');
  });
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const storedProgress = useMemo(
    () => (isHydrated ? loadStudyProgress() : DEFAULT_PROGRESS),
    [isHydrated]
  );
  const storedTheme = useMemo(
    () => (isHydrated ? getThemePreference() : 'system'),
    [isHydrated]
  );
  const [route, setRoute] = useState<AppRoute>(initialParsed.route);
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>(initialParsed.subject);
  const [progressOverride, setProgressOverride] = useState<StudyProgress | null>(null);
  const [themeOverride, setThemeOverride] = useState<ThemePreference | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const progress = progressOverride ?? storedProgress;
  const themePref = themeOverride ?? storedTheme;
  const hasMountedSeoRef = useRef(false);
  const mainRef = useRef<HTMLElement | null>(null);
  const pendingFocusRef = useRef(false);

  useEffect(() => initPwaUpdateWatcher(() => setUpdateAvailable(true)), []);

  // Ensure #main-content receives focus even when target route resolves asynchronously via Suspense
  useEffect(() => {
    if (!pendingFocusRef.current) return;

    const focusTarget = (): boolean => {
      const target = document.getElementById('main-content');
      if (!target) return false;
      pendingFocusRef.current = false;
      target.focus({ preventScroll: true });
      return true;
    };

    if (focusTarget()) return;

    const container = mainRef.current ?? document.body;
    const observer = new MutationObserver(() => {
      if (focusTarget()) {
        observer.disconnect();
      }
    });
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [route, selectedSubject]);

  useEffect(() => {
    if (initialParsed.legacyHashRedirectPath) {
      window.history.replaceState(null, '', initialParsed.legacyHashRedirectPath);
    }
  }, [initialParsed.legacyHashRedirectPath]);

  useEffect(() => {
    const syncFromLocation = () => {
      const parsed = parseLocation(
        window.location.pathname,
        window.location.search,
        window.location.hash
      );
      if (parsed.legacyHashRedirectPath) {
        window.history.replaceState(null, '', parsed.legacyHashRedirectPath);
      }
      setRoute(parsed.route);
      setSelectedSubject(parsed.subject);
    };

    const onHashChange = () => {
      if (window.location.hash.startsWith('#/')) {
        syncFromLocation();
      }
    };

    window.addEventListener('popstate', syncFromLocation);
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('popstate', syncFromLocation);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  // Cross-tab sync for color-scheme override
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'color-scheme') {
        const next = getThemePreference();
        setThemeOverride(next);
        applyThemePreference(next);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Dynamic title, canonical, OGP and JSON-LD update on route change (skip initial SSR-matched render)
  useEffect(() => {
    if (!hasMountedSeoRef.current) {
      hasMountedSeoRef.current = true;
      if (!initialParsed.legacyHashRedirectPath) {
        return;
      }
    }
    void import('./utils/seoHead').then((m) => m.applyRouteSeoToDocument(route, selectedSubject));
  }, [route, selectedSubject, initialParsed.legacyHashRedirectPath]);

  const updateProgress = (updater: (current: StudyProgress) => StudyProgress) => {
    setProgressOverride((prev) => {
      const current = prev ?? storedProgress;
      const updated = updater(current);
      if (updated !== current) {
        saveStudyProgress(updated);
      }
      return updated;
    });
  };

  const navigate = (nextRoute: AppRoute, subjectOverride?: SubjectId, search = '') => {
    pendingFocusRef.current = true;
    setRoute(nextRoute);
    if (nextRoute === 'home' || nextRoute === 'not-found') {
      const nextSubject = nextRoute === 'home' ? (subjectOverride ?? 'all') : 'all';
      setSelectedSubject(nextSubject);
      const nextPath = buildRoutePath('home', nextSubject);
      if (window.location.pathname + window.location.search !== nextPath) {
        window.history.pushState(null, '', nextPath);
      }
    } else if (nextRoute === 'legal') {
      setSelectedSubject('all');
      const nextPath = buildRoutePath('legal');
      if (window.location.pathname + window.location.search !== nextPath) {
        window.history.pushState(null, '', nextPath);
      }
    } else {
      const matched = LEARNING_UNITS.find((u) => u.id === nextRoute);
      if (matched) {
        setSelectedSubject(matched.subjectId);
      }
      const nextPath = buildRoutePath(nextRoute, 'all', search);
      if (window.location.pathname + window.location.search !== nextPath) {
        window.history.pushState(null, '', nextPath);
      }
      updateProgress((prev) => ({ ...prev, lastVisitedUnit: nextRoute }));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSubjectOnHome = (subject: SubjectId) => {
    setSelectedSubject(subject);
    const nextPath = buildRoutePath('home', subject);
    if (window.location.pathname + window.location.search !== nextPath) {
      window.history.replaceState(null, '', nextPath);
    }
  };

  const handleChangeTheme = (pref: ThemePreference) => {
    setThemeOverride(pref);
    applyThemePreference(pref);
  };

  const toggleUnitComplete = (unitId: UnitId) => {
    updateProgress((prev) => {
      const exists = prev.completedUnits.includes(unitId);
      const completedUnits = exists
        ? prev.completedUnits.filter((id) => id !== unitId)
        : [...prev.completedUnits, unitId];
      return { ...prev, completedUnits };
    });
  };

  const toggleProblemDone = (problemId: number) => {
    updateProgress((prev) => {
      const exists = prev.completedProblemIds.includes(problemId);
      const completedProblemIds = exists
        ? prev.completedProblemIds.filter((id) => id !== problemId)
        : [...prev.completedProblemIds, problemId];
      return { ...prev, completedProblemIds };
    });
  };

  const toggleContinuumExerciseDone = (exerciseId: string) => {
    updateProgress((prev) => {
      const exists = prev.completedContinuumExerciseIds.includes(exerciseId);
      const completedContinuumExerciseIds = exists
        ? prev.completedContinuumExerciseIds.filter((id) => id !== exerciseId)
        : [...prev.completedContinuumExerciseIds, exerciseId];
      return { ...prev, completedContinuumExerciseIds };
    });
  };

  const markContinuumExerciseDone = (exerciseId: string) => {
    updateProgress((prev) => {
      if (prev.completedContinuumExerciseIds.includes(exerciseId)) return prev;
      return {
        ...prev,
        completedContinuumExerciseIds: [...prev.completedContinuumExerciseIds, exerciseId],
      };
    });
  };

  const toggleMathProgExerciseDone = (exerciseId: string) => {
    updateProgress((prev) => {
      const exists = prev.completedMathProgExerciseIds.includes(exerciseId);
      const completedMathProgExerciseIds = exists
        ? prev.completedMathProgExerciseIds.filter((id) => id !== exerciseId)
        : [...prev.completedMathProgExerciseIds, exerciseId];
      return { ...prev, completedMathProgExerciseIds };
    });
  };

  const markMathProgExerciseDone = (exerciseId: string) => {
    updateProgress((prev) => {
      if (prev.completedMathProgExerciseIds.includes(exerciseId)) return prev;
      return {
        ...prev,
        completedMathProgExerciseIds: [...prev.completedMathProgExerciseIds, exerciseId],
      };
    });
  };

  const activeUnit =
    route !== 'home' && route !== 'legal' && route !== 'not-found'
      ? LEARNING_UNITS.find((u) => u.id === route)
      : undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <PortalHeader
        activeRoute={route}
        activeSubject={selectedSubject}
        onNavigate={navigate}
        themePref={themePref}
        onChangeTheme={handleChangeTheme}
        onRefreshApp={refreshAppAndClearCaches}
      />

      <main ref={mainRef} className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6">
        {updateAvailable && (
          <UpdateAvailableBanner
            onReload={() => window.location.reload()}
            onDismiss={() => setUpdateAvailable(false)}
          />
        )}
        <WipNoticeBanner
          showDisclaimerLink={route !== 'legal'}
          onOpenDisclaimer={() => navigate('legal')}
        />
        {activeUnit && (
          <div className="mb-4">
            <Suspense fallback={null}>
              <UnitBreadcrumb
                subjectId={activeUnit.subjectId}
                unitTitle={activeUnit.title}
                onNavigate={navigate}
              />
            </Suspense>
          </div>
        )}
        <ErrorBoundary onReset={() => navigate('home')}>
          <Suspense
            fallback={
              <div className="app-surface rounded-xl p-8 text-center text-sm app-text-muted">
                <progress aria-label="学習モジュールを読み込み中" className="w-48 mb-2" />
                <p>学習モジュールを読み込んでいます…</p>
              </div>
            }
          >
            {route === 'home' && (
              <PortalHome
                progress={progress}
                selectedSubject={selectedSubject}
                onSelectSubject={handleSelectSubjectOnHome}
                onOpenUnit={(id) => navigate(id)}
              />
            )}
            {route === 'geomechanics-continuum' && (
              <GeomechanicsCourseModule
                isCompleted={progress.completedUnits.includes('geomechanics-continuum')}
                onToggleUnitComplete={() => toggleUnitComplete('geomechanics-continuum')}
                completedExerciseIds={progress.completedContinuumExerciseIds}
                onToggleExerciseDone={toggleContinuumExerciseDone}
                onMarkExerciseDone={markContinuumExerciseDone}
                onBackToPortal={() => navigate('home')}
                onOpenUnit={(id) => navigate(id)}
              />
            )}
            {route === 'mohr-circle' && (
              <MohrCircleModule
                isCompleted={progress.completedUnits.includes('mohr-circle')}
                onToggleUnitComplete={() => toggleUnitComplete('mohr-circle')}
                completedProblemIds={progress.completedProblemIds}
                onToggleProblemDone={toggleProblemDone}
                onBackToPortal={() => navigate('home')}
                onOpenContinuumCourse={() => navigate('geomechanics-continuum', undefined, '?ch=4')}
              />
            )}
            {route === 'rankine-earth-pressure' && (
              <RankineEarthModule
                isCompleted={progress.completedUnits.includes('rankine-earth-pressure')}
                onToggleUnitComplete={() => toggleUnitComplete('rankine-earth-pressure')}
                onBackToPortal={() => navigate('home')}
              />
            )}
            {route === 'beam-sfd-bmd' && (
              <BeamDiagramModule
                isCompleted={progress.completedUnits.includes('beam-sfd-bmd')}
                onToggleUnitComplete={() => toggleUnitComplete('beam-sfd-bmd')}
                onBackToPortal={() => navigate('home')}
              />
            )}
            {route === 'open-channel-flow' && (
              <OpenChannelModule
                isCompleted={progress.completedUnits.includes('open-channel-flow')}
                onToggleUnitComplete={() => toggleUnitComplete('open-channel-flow')}
                onBackToPortal={() => navigate('home')}
              />
            )}
            {route === 'lp-optimization' && (
              <LinearProgrammingCourseModule
                isCompleted={progress.completedUnits.includes('lp-optimization')}
                onToggleUnitComplete={() => toggleUnitComplete('lp-optimization')}
                completedExerciseIds={progress.completedMathProgExerciseIds}
                onToggleExerciseDone={toggleMathProgExerciseDone}
                onMarkExerciseDone={markMathProgExerciseDone}
                onBackToPortal={() => navigate('home')}
              />
            )}
            {route === 'nlp-optimization' && (
              <NonlinearProgrammingCourseModule
                isCompleted={progress.completedUnits.includes('nlp-optimization')}
                onToggleUnitComplete={() => toggleUnitComplete('nlp-optimization')}
                completedExerciseIds={progress.completedMathProgExerciseIds}
                onToggleExerciseDone={toggleMathProgExerciseDone}
                onMarkExerciseDone={markMathProgExerciseDone}
                onBackToPortal={() => navigate('home')}
              />
            )}
            {route === 'legal' && <LegalPage onBackToPortal={() => navigate('home')} />}
            {route === 'not-found' && <NotFoundPage onNavigate={navigate} />}
          </Suspense>
        </ErrorBoundary>
        {activeUnit && (
          <div className="mt-6">
            <Suspense fallback={null}>
              <UnitFaqSection unitId={activeUnit.id} />
            </Suspense>
          </div>
        )}
      </main>

      <footer className="border-t border-[var(--border-subtle)] py-5 px-4 sm:px-6 text-xs app-text-muted">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
          <span>
            土木の学び舎 — 土木工学・数理計画インタラクティブ学習ポータル（現在開発中・多くの誤りを含む可能性あり）
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <span>日本の大学・高専 教科書準拠（土質力学：圧縮正）</span>
            <a
              href={buildRoutePath('legal')}
              onClick={(e) => {
                if (isPlainLeftClick(e)) {
                  e.preventDefault();
                  navigate('legal');
                }
              }}
              className="underline hover:text-[var(--text-primary)] cursor-pointer"
            >
              利用規約・免責事項・プライバシーポリシー・技術者倫理
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
