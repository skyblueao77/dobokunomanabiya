import React, { Suspense, useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import {
  buildRoutePath,
  getSearchParamFromLocation,
  isPlainLeftClick,
  normalizePathname,
} from '../utils/router';
import { CopyShareButton } from './CopyShareButton';

export interface CourseChapterDescriptor<TChapter extends number> {
  id: TChapter;
  shortTitle: string;
  exerciseIds: readonly string[];
}

interface CourseModuleShellProps<TChapter extends number> {
  unitPath: string;
  title: string;
  description: string;
  tablistAriaLabel: string;
  chapters: readonly CourseChapterDescriptor<TChapter>[];
  isCompleted: boolean;
  onToggleUnitComplete: () => void;
  completedExerciseIds: string[];
  onBackToPortal: () => void;
  renderChapter: (chapterId: TChapter) => React.ReactNode;
}

export function CourseModuleShell<TChapter extends number>({
  unitPath,
  title,
  description,
  tablistAriaLabel,
  chapters,
  isCompleted,
  onToggleUnitComplete,
  completedExerciseIds,
  onBackToPortal,
  renderChapter,
}: CourseModuleShellProps<TChapter>) {
  const firstChapterId = chapters[0].id;
  const lastChapterId = chapters[chapters.length - 1].id;
  const validChapterIds = chapters.map((c) => c.id);

  const parseInitialChapter = (): TChapter => {
    try {
      const ch = Number(getSearchParamFromLocation('ch'));
      if (Number.isInteger(ch) && validChapterIds.includes(ch as TChapter)) {
        return ch as TChapter;
      }
      return firstChapterId;
    } catch {
      return firstChapterId;
    }
  };

  const [activeChapter, setActiveChapter] = useState<TChapter>(() => parseInitialChapter());
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitPath]);

  useEffect(() => {
    if (normalizePathname(window.location.pathname) !== unitPath) {
      return;
    }
    const nextUrl =
      activeChapter === firstChapterId ? unitPath : `${unitPath}?ch=${activeChapter}`;
    if (window.location.pathname + window.location.search !== nextUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [activeChapter, firstChapterId, unitPath]);

  const selectChapter = (ch: TChapter, focusTab = false) => {
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

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % chapters.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + chapters.length) % chapters.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = chapters.length - 1;
    }
    if (nextIndex !== null) {
      e.preventDefault();
      selectChapter(chapters[nextIndex].id, true);
    }
  };

  const totalExerciseCount = chapters.reduce((acc, ch) => acc + ch.exerciseIds.length, 0);
  const solvedTotal = chapters.reduce(
    (acc, ch) => acc + ch.exerciseIds.filter((id) => completedExerciseIds.includes(id)).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* コースヘッダー */}
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
            {title}
          </h1>
          <p className="text-xs sm:text-sm app-text-muted">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="app-surface-subtle rounded-lg px-3 py-1.5 text-xs font-semibold font-mono-num">
            コース演習: {solvedTotal} / {totalExerciseCount} 問
          </span>
          <CopyShareButton getTextToCopy={() => window.location.href} />
          <button
            type="button"
            aria-pressed={isCompleted}
            onClick={onToggleUnitComplete}
            className={`interactive-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border cursor-pointer ${
              isCompleted
                ? 'bg-emerald-700 text-white border-emerald-800 dark:border-emerald-500'
                : 'app-surface'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {isCompleted ? '単元完了済み' : 'この単元を完了にする'}
          </button>
        </div>
      </div>

      {/* 単一行スクロール対応 章タブナビゲーション */}
      <div className="app-surface rounded-xl px-2 pt-2 shadow-sm">
        <div
          role="tablist"
          aria-label={tablistAriaLabel}
          className="tab-scroller border-b border-[var(--border-subtle)]"
        >
          {chapters.map((ch, idx) => {
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
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                className="tab-item px-3.5 py-2.5 text-xs sm:text-sm whitespace-nowrap cursor-pointer hover:bg-[var(--surface-subtle)] rounded-t-lg transition-colors inline-flex items-center gap-1.5"
              >
                <span>{ch.shortTitle}</span>
                {ch.exerciseIds.length > 0 && chSolved === ch.exerciseIds.length && (
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

      {/* 章コンテンツパネル */}
      <div>
        {chapters.map((ch, idx) => {
          const isCurrent = activeChapter === ch.id;
          const prevChapter = idx > 0 ? chapters[idx - 1] : null;
          const nextChapter = idx < chapters.length - 1 ? chapters[idx + 1] : null;
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
                    {renderChapter(ch.id)}
                  </Suspense>

                  {/* 前後章ナビゲーション */}
                  <div className="app-surface rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                    {prevChapter ? (
                      <button
                        type="button"
                        onClick={() => selectChapter(prevChapter.id)}
                        className="interactive-btn app-surface-subtle inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        前の章へ（{prevChapter.shortTitle}）
                      </button>
                    ) : (
                      <span />
                    )}

                    {nextChapter ? (
                      <button
                        type="button"
                        onClick={() => selectChapter(nextChapter.id)}
                        className="interactive-btn inline-flex items-center gap-1.5 rounded-lg bg-blue-700 text-white px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        次の章へ（{nextChapter.shortTitle}）
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    ) : (
                      ch.id === lastChapterId && (
                        <button
                          type="button"
                          onClick={onToggleUnitComplete}
                          className="interactive-btn inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 text-white px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          {isCompleted ? '単元完了済み' : 'コース完了として記録する'}
                        </button>
                      )
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
}
