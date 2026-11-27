import React, { Suspense, lazy, useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import {
  buildRoutePath,
  getSearchParamFromLocation,
  isPlainLeftClick,
  normalizePathname,
} from '../../utils/router';
import { CopyShareButton } from '../CopyShareButton';

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

const NLP_CHAPTERS: {
  id: NlpChapterIndex;
  shortTitle: string;
  exerciseIds: [string, string];
}[] = [
  { id: 1, shortTitle: '1. 最適性条件とヘッセ行列', exerciseIds: ['nlp-ch1-q1', 'nlp-ch1-q2'] },
  { id: 2, shortTitle: '2. 狭義凸性と感度分析', exerciseIds: ['nlp-ch2-q1', 'nlp-ch2-q2'] },
  { id: 3, shortTitle: '3. ニュートン法と収束', exerciseIds: ['nlp-ch3-q1', 'nlp-ch3-q2'] },
];

const TOTAL_EXERCISE_COUNT = NLP_CHAPTERS.length * 2;

const UNIT_PATH = buildRoutePath('nlp-optimization');

function parseInitialChapter(): NlpChapterIndex {
  try {
    const ch = Number(getSearchParamFromLocation('ch'));
    if (ch >= 1 && ch <= 3 && Number.isInteger(ch)) {
      return ch as NlpChapterIndex;
    }
    return 1;
  } catch {
    return 1;
  }
}

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
}) => {
  const [activeChapter, setActiveChapter] = useState<NlpChapterIndex>(() => parseInitialChapter());
  const tabBaseId = useId();
  const tabRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  useEffect(() => {
    const onLocationChange = () => {
      const next = parseInitialChapter();
      setActiveChapter((prev) => (prev !== next ? next : prev));
    };
    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('hashchange', onLocationChange);
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('hashchange', onLocationChange);
    };
  }, []);

  useEffect(() => {
    if (normalizePathname(window.location.pathname) !== UNIT_PATH) {
      return;
    }
    const nextUrl = activeChapter === 1 ? UNIT_PATH : `${UNIT_PATH}?ch=${activeChapter}`;
    if (window.location.pathname + window.location.search !== nextUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [activeChapter]);

  const selectChapter = (ch: NlpChapterIndex, focusTab = false) => {
    setActiveChapter(ch);
    const el = tabRefs.current[ch];
    if (el) {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      if (focusTab) el.focus();
    }
    if (!focusTab) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, current: NlpChapterIndex) => {
    let next: NlpChapterIndex | null = null;
    if (e.key === 'ArrowRight') {
      next = current === 3 ? 1 : ((current + 1) as NlpChapterIndex);
    } else if (e.key === 'ArrowLeft') {
      next = current === 1 ? 3 : ((current - 1) as NlpChapterIndex);
    } else if (e.key === 'Home') {
      next = 1;
    } else if (e.key === 'End') {
      next = 3;
    }
    if (next !== null) {
      e.preventDefault();
      selectChapter(next, true);
    }
  };

  const solvedTotal = NLP_CHAPTERS.reduce(
    (acc, ch) =>
      acc + ch.exerciseIds.filter((id) => completedExerciseIds.includes(id)).length,
    0
  );

  return (
    <div className="space-y-6">
      <div className="app-surface rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1 max-w-2xl">
          <a
            href={buildRoutePath('home', 'all')}
            onClick={(e) => {
              if (isPlainLeftClick(e)) {
                e.preventDefault();
                onBackToPortal();
              }
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            ポータル一覧に戻る
          </a>
          <h1 id="main-content" tabIndex={-1} className="portal-h1 font-bold">
            数理計画｜非線形計画法（最適性条件・狭義凸性・包絡線定理・ニュートン法）
          </h1>
          <p className="text-xs sm:text-sm app-text-muted">
            制約なし非線形最適化の理論と計算手法を、等高線マップと勾配・ヘッセ行列のリアルタイム可視化で直感的に習得します。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="app-surface-subtle rounded-lg px-3 py-1.5 text-xs font-semibold font-mono-num">
            コース演習: {solvedTotal} / {TOTAL_EXERCISE_COUNT} 問
          </span>
          <CopyShareButton getTextToCopy={() => window.location.href} />
          <button
            type="button"
            aria-pressed={isCompleted}
            onClick={onToggleUnitComplete}
            className={`interactive-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border cursor-pointer ${
              isCompleted ? 'bg-emerald-700 text-white border-emerald-800 dark:border-emerald-500' : 'app-surface'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {isCompleted ? '単元完了済み' : 'この単元を完了にする'}
          </button>
        </div>
      </div>

      {/* 章タブ */}
      <div className="app-surface rounded-xl px-2 pt-2 shadow-sm">
        <div
          role="tablist"
          aria-label="非線形計画法コースの学習ステップ（第1章〜第3章）"
          className="tab-scroller border-b border-[var(--border-subtle)]"
        >
          {NLP_CHAPTERS.map((ch) => {
            const selected = activeChapter === ch.id;
            const chSolved = ch.exerciseIds.filter((id) =>
              completedExerciseIds.includes(id)
            ).length;
            return (
              <button
                key={ch.id}
                ref={(el) => {
                  tabRefs.current[ch.id] = el;
                }}
                id={`${tabBaseId}-tab-${ch.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectChapter(ch.id)}
                onKeyDown={(e) => handleTabKeyDown(e, ch.id)}
                className="tab-item px-3.5 py-2.5 text-xs sm:text-sm whitespace-nowrap cursor-pointer hover:bg-[var(--surface-subtle)] rounded-t-lg transition-colors inline-flex items-center gap-1.5"
              >
                <span>{ch.shortTitle}</span>
                {chSolved === 2 && (
                  <CheckCircle2
                    className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0"
                    aria-label="章演習完了"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 章コンテンツ */}
      <div>
        {NLP_CHAPTERS.map((ch) => {
          const isCurrent = activeChapter === ch.id;
          return (
            <div
              key={ch.id}
              role="tabpanel"
              aria-labelledby={`${tabBaseId}-tab-${ch.id}`}
              hidden={!isCurrent}
            >
              {isCurrent && (
                <div className="space-y-6">
                  <Suspense
                    fallback={
                      <div className="app-surface rounded-xl p-6 text-center text-sm app-text-muted">
                        <progress aria-label="章コンテンツを読み込み中" className="w-40 mb-2" />
                        <p>章コンテンツを読み込んでいます…</p>
                      </div>
                    }
                  >
                    {ch.id === 1 && (
                      <NlpCh1Optimality
                        completedIds={completedExerciseIds}
                        onToggleDone={onToggleExerciseDone}
                        onMarkDone={onMarkExerciseDone}
                      />
                    )}
                    {ch.id === 2 && (
                      <NlpCh2ConvexSensitivity
                        completedIds={completedExerciseIds}
                        onToggleDone={onToggleExerciseDone}
                        onMarkDone={onMarkExerciseDone}
                      />
                    )}
                    {ch.id === 3 && (
                      <NlpCh3Newton
                        completedIds={completedExerciseIds}
                        onToggleDone={onToggleExerciseDone}
                        onMarkDone={onMarkExerciseDone}
                      />
                    )}
                  </Suspense>

                  <div className="app-surface rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                    {ch.id > 1 ? (
                      <button
                        type="button"
                        onClick={() => selectChapter((ch.id - 1) as NlpChapterIndex)}
                        className="interactive-btn app-surface-subtle inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        前の章へ（{NLP_CHAPTERS[ch.id - 2].shortTitle}）
                      </button>
                    ) : (
                      <span />
                    )}

                    {ch.id < 3 ? (
                      <button
                        type="button"
                        onClick={() => selectChapter((ch.id + 1) as NlpChapterIndex)}
                        className="interactive-btn inline-flex items-center gap-1.5 rounded-lg bg-blue-700 text-white px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        次の章へ（{NLP_CHAPTERS[ch.id].shortTitle}）
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onToggleUnitComplete}
                        className="interactive-btn inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 text-white px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        {isCompleted ? '単元完了済み' : 'コース完了として記録する'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NonlinearProgrammingCourseModule;
