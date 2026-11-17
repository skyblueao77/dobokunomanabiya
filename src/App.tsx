import { Suspense, lazy, useEffect, useState } from 'react';
import { LEARNING_UNITS, type UnitId } from './data/curriculum';
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

const MohrCircleModule = lazy(() => import('./components/modules/MohrCircleModule'));
const RankineEarthModule = lazy(() => import('./components/modules/RankineEarthModule'));
const BeamDiagramModule = lazy(() => import('./components/modules/BeamDiagramModule'));
const OpenChannelModule = lazy(() => import('./components/modules/OpenChannelModule'));
const LegalPage = lazy(() => import('./components/LegalPage'));

type Route = 'home' | 'legal' | UnitId;

function parseRouteFromHash(): Route {
  const hash = window.location.hash;
  if (hash === '#/legal' || hash.startsWith('#/legal?')) {
    return 'legal';
  }
  if (hash.startsWith('#/unit/')) {
    const rawId = hash.slice('#/unit/'.length).split('?')[0] as UnitId;
    if (LEARNING_UNITS.some((u) => u.id === rawId)) {
      return rawId;
    }
  }
  return 'home';
}

export function App() {
  const [route, setRoute] = useState<Route>(() => parseRouteFromHash());
  const [progress, setProgress] = useState<StudyProgress>(() => loadStudyProgress());
  const [themePref, setThemePref] = useState<ThemePreference>(() => getThemePreference());

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRouteFromHash());
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
      document.title = '土木の学び舎｜土木工学インタラクティブ学習ポータル';
    } else if (route === 'legal') {
      document.title = '利用規約・免責事項・プライバシーポリシー｜土木の学び舎';
    } else {
      const unit = LEARNING_UNITS.find((u) => u.id === route);
      document.title = unit
        ? `${unit.title}｜土木の学び舎`
        : '土木の学び舎｜土木工学インタラクティブ学習ポータル';
    }
  }, [route]);

  const navigate = (nextRoute: Route) => {
    setRoute(nextRoute);
    if (nextRoute === 'home') {
      window.location.hash = '#/';
    } else if (nextRoute === 'legal') {
      window.location.hash = '#/legal';
    } else {
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

  return (
    <div className="min-h-screen flex flex-col">
      <PortalHeader
        activeRoute={route}
        onNavigate={navigate}
        themePref={themePref}
        onChangeTheme={handleChangeTheme}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6">
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
              <PortalHome progress={progress} onOpenUnit={(id) => navigate(id)} />
            )}
            {route === 'mohr-circle' && (
              <MohrCircleModule
                isCompleted={progress.completedUnits.includes('mohr-circle')}
                onToggleUnitComplete={() => toggleUnitComplete('mohr-circle')}
                completedProblemIds={progress.completedProblemIds}
                onToggleProblemDone={toggleProblemDone}
                onBackToPortal={() => navigate('home')}
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
          <span>土木の学び舎 — 土木工学インタラクティブ学習ポータル（クライアント完結型・Cloudflare 対応）</span>
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
