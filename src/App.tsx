import { Suspense, lazy, useEffect, useState } from 'react';
import {
  LEARNING_UNITS,
  SUBJECTS,
  getSubjectMeta,
  type SubjectId,
  type UnitId,
} from './data/curriculum';
import {
  applyThemePreference,
  getThemePreference,
  loadStudyProgress,
  saveStudyProgress,
  type StudyProgress,
  type ThemePreference,
} from './utils/storage';
import { PortalHeader } from './components/PortalHeader';
import { PortalHome } from './components/PortalHome';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WipNoticeBanner } from './components/WipNoticeBanner';

const GeomechanicsCourseModule = lazy(
  () => import('./components/modules/GeomechanicsCourseModule')
);
const MohrCircleModule = lazy(() => import('./components/modules/MohrCircleModule'));
const RankineEarthModule = lazy(() => import('./components/modules/RankineEarthModule'));
const BeamDiagramModule = lazy(() => import('./components/modules/BeamDiagramModule'));
const OpenChannelModule = lazy(() => import('./components/modules/OpenChannelModule'));
const LegalPage = lazy(() => import('./components/LegalPage'));

type Route = 'home' | 'legal' | UnitId;

interface ParsedHash {
  route: Route;
  subject: SubjectId;
}

function parseRouteFromHash(): ParsedHash {
  const hash = window.location.hash;
  if (hash === '#/legal' || hash.startsWith('#/legal?')) {
    return { route: 'legal', subject: 'all' };
  }
  if (hash.startsWith('#/subject/')) {
    const rawSubject = hash.slice('#/subject/'.length).split('?')[0] as Exclude<SubjectId, 'all'>;
    if (SUBJECTS.some((s) => s.id === rawSubject)) {
      return { route: 'home', subject: rawSubject };
    }
  }
  if (hash.startsWith('#/unit/')) {
    const rawId = hash.slice('#/unit/'.length).split('?')[0] as UnitId;
    const matched = LEARNING_UNITS.find((u) => u.id === rawId);
    if (matched) {
      return { route: rawId, subject: matched.subjectId };
    }
  }
  return { route: 'home', subject: 'all' };
}

export function App() {
  const initialParsed = parseRouteFromHash();
  const [route, setRoute] = useState<Route>(initialParsed.route);
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>(initialParsed.subject);
  const [progress, setProgress] = useState<StudyProgress>(() => loadStudyProgress());
  const [themePref, setThemePref] = useState<ThemePreference>(() => getThemePreference());

  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseRouteFromHash();
      setRoute(parsed.route);
      setSelectedSubject(parsed.subject);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Cross-tab sync for color-scheme override
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'color-scheme') {
        const next = getThemePreference();
        setThemePref(next);
        applyThemePreference(next);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // SPA document title update on route change (WCAG 2.4.2)
  useEffect(() => {
    if (route === 'home') {
      if (selectedSubject !== 'all') {
        const subjectMeta = getSubjectMeta(selectedSubject);
        document.title = `${subjectMeta.name}｜土木の学び舎`;
      } else {
        document.title = '土木の学び舎｜土木工学インタラクティブ学習ポータル';
      }
    } else if (route === 'legal') {
      document.title = '利用規約・免責事項・プライバシーポリシー｜土木の学び舎';
    } else {
      const unit = LEARNING_UNITS.find((u) => u.id === route);
      document.title = unit
        ? `${unit.title}｜土木の学び舎`
        : '土木の学び舎｜土木工学インタラクティブ学習ポータル';
    }
  }, [route, selectedSubject]);

  const navigate = (nextRoute: Route, subjectOverride?: SubjectId) => {
    setRoute(nextRoute);
    if (nextRoute === 'home') {
      const nextSubject = subjectOverride ?? 'all';
      setSelectedSubject(nextSubject);
      window.location.hash = nextSubject === 'all' ? '#/' : `#/subject/${nextSubject}`;
    } else if (nextRoute === 'legal') {
      setSelectedSubject('all');
      window.location.hash = '#/legal';
    } else {
      const matched = LEARNING_UNITS.find((u) => u.id === nextRoute);
      if (matched) {
        setSelectedSubject(matched.subjectId);
      }
      if (!window.location.hash.startsWith(`#/unit/${nextRoute}`)) {
        window.location.hash = `#/unit/${nextRoute}`;
      }
      setProgress((prev) => {
        const updated: StudyProgress = { ...prev, lastVisitedUnit: nextRoute };
        saveStudyProgress(updated);
        return updated;
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.requestAnimationFrame(() => {
      document.getElementById('main-content')?.focus({ preventScroll: true });
    });
  };

  const handleSelectSubjectOnHome = (subject: SubjectId) => {
    setSelectedSubject(subject);
    const nextHash = subject === 'all' ? '#/' : `#/subject/${subject}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash);
    }
  };

  const handleChangeTheme = (pref: ThemePreference) => {
    setThemePref(pref);
    applyThemePreference(pref);
  };

  const toggleUnitComplete = (unitId: UnitId) => {
    setProgress((prev) => {
      const exists = prev.completedUnits.includes(unitId);
      const completedUnits = exists
        ? prev.completedUnits.filter((id) => id !== unitId)
        : [...prev.completedUnits, unitId];
      const updated = { ...prev, completedUnits };
      saveStudyProgress(updated);
      return updated;
    });
  };

  const toggleProblemDone = (problemId: number) => {
    setProgress((prev) => {
      const exists = prev.completedProblemIds.includes(problemId);
      const completedProblemIds = exists
        ? prev.completedProblemIds.filter((id) => id !== problemId)
        : [...prev.completedProblemIds, problemId];
      const updated = { ...prev, completedProblemIds };
      saveStudyProgress(updated);
      return updated;
    });
  };

  const toggleContinuumExerciseDone = (exerciseId: string) => {
    setProgress((prev) => {
      const exists = prev.completedContinuumExerciseIds.includes(exerciseId);
      const completedContinuumExerciseIds = exists
        ? prev.completedContinuumExerciseIds.filter((id) => id !== exerciseId)
        : [...prev.completedContinuumExerciseIds, exerciseId];
      const updated = { ...prev, completedContinuumExerciseIds };
      saveStudyProgress(updated);
      return updated;
    });
  };

  const markContinuumExerciseDone = (exerciseId: string) => {
    setProgress((prev) => {
      if (prev.completedContinuumExerciseIds.includes(exerciseId)) return prev;
      const updated = {
        ...prev,
        completedContinuumExerciseIds: [...prev.completedContinuumExerciseIds, exerciseId],
      };
      saveStudyProgress(updated);
      return updated;
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PortalHeader
        activeRoute={route}
        activeSubject={selectedSubject}
        onNavigate={navigate}
        themePref={themePref}
        onChangeTheme={handleChangeTheme}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6">
        <WipNoticeBanner
          showDisclaimerLink={route !== 'legal'}
          onOpenDisclaimer={() => navigate('legal')}
        />
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
                onOpenContinuumCourse={() => {
                  window.location.hash = '#/unit/geomechanics-continuum?ch=4';
                  navigate('geomechanics-continuum');
                }}
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
            {route === 'legal' && <LegalPage onBackToPortal={() => navigate('home')} />}
          </Suspense>
        </ErrorBoundary>
      </main>

      <footer className="border-t border-[var(--border-subtle)] py-5 px-4 sm:px-6 text-xs app-text-muted">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
          <span>
            土木の学び舎 — 土木工学インタラクティブ学習ポータル（現在開発中・多くの誤りを含む可能性あり）
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <span>日本の大学・高専 教科書準拠（土質力学：圧縮正）</span>
            <button
              type="button"
              onClick={() => navigate('legal')}
              className="underline hover:text-[var(--text-primary)] cursor-pointer"
            >
              利用規約・免責事項・プライバシーポリシー・技術者倫理
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
