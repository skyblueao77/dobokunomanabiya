import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import {
  buildRoutePath,
  getSearchParamFromLocation,
  isPlainLeftClick,
  normalizePathname,
} from '../../utils/router';
import { CopyShareButton } from '../CopyShareButton';
import { LpCh1Graphical } from '../mathprog/LpCh1Graphical';
import { LpCh2Simplex } from '../mathprog/LpCh2Simplex';
import { LpCh3Duality } from '../mathprog/LpCh3Duality';
import { LpCh4Sensitivity } from '../mathprog/LpCh4Sensitivity';
import { LpCh5TransportAssign } from '../mathprog/LpCh5TransportAssign';

export type LpChapterIndex = 1 | 2 | 3 | 4 | 5;

const LP_CHAPTERS: {
  id: LpChapterIndex;
  shortTitle: string;
  exerciseIds: [string, string];
}[] = [
  { id: 1, shortTitle: '1. 定式化と図解法', exerciseIds: ['lp-ch1-q1', 'lp-ch1-q2'] },
  { id: 2, shortTitle: '2. シンプレックス法', exerciseIds: ['lp-ch2-q1', 'lp-ch2-q2'] },
  { id: 3, shortTitle: '3. 双対理論と相補性', exerciseIds: ['lp-ch3-q1', 'lp-ch3-q2'] },
  { id: 4, shortTitle: '4. 感度分析', exerciseIds: ['lp-ch4-q1', 'lp-ch4-q2'] },
  { id: 5, shortTitle: '5. 輸送問題と割当問題', exerciseIds: ['lp-ch5-q1', 'lp-ch5-q2'] },
];

const TOTAL_EXERCISE_COUNT = LP_CHAPTERS.length * 2;

const UNIT_PATH = buildRoutePath('lp-optimization');

function parseInitialChapter(): LpChapterIndex {
  try {
    const ch = Number(getSearchParamFromLocation('ch'));
    if (ch >= 1 && ch <= 5 && Number.isInteger(ch)) {
      return ch as LpChapterIndex;
    }
    return 1;
  } catch {
    return 1;
  }
}

interface LinearProgrammingCourseModuleProps {
  isCompleted: boolean;
  onToggleUnitComplete: () => void;
  completedExerciseIds: string[];
  onToggleExerciseDone: (id: string) => void;
  onMarkExerciseDone: (id: string) => void;
  onBackToPortal: () => void;
}

export const LinearProgrammingCourseModule: React.FC<LinearProgrammingCourseModuleProps> = ({
  isCompleted,
  onToggleUnitComplete,
  completedExerciseIds,
  onToggleExerciseDone,
  onMarkExerciseDone,
  onBackToPortal,
}) => {
  const [activeChapter, setActiveChapter] = useState<LpChapterIndex>(() => parseInitialChapter());
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

  const selectChapter = (ch: LpChapterIndex, focusTab = false) => {
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

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, current: LpChapterIndex) => {
    let next: LpChapterIndex | null = null;
    if (e.key === 'ArrowRight') {
      next = current === 5 ? 1 : ((current + 1) as LpChapterIndex);
    } else if (e.key === 'ArrowLeft') {
      next = current === 1 ? 5 : ((current - 1) as LpChapterIndex);
    } else if (e.key === 'Home') {
      next = 1;
    } else if (e.key === 'End') {
      next = 5;
    }
    if (next !== null) {
      e.preventDefault();
      selectChapter(next, true);
    }
  };

  const solvedTotal = LP_CHAPTERS.reduce(
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
            数理計画｜線形計画法（図解法〜シンプレックス・双対・感度分析・輸送計画）
          </h1>
          <p className="text-xs sm:text-sm app-text-muted">
            土木計画・資源配分で中核となる線形計画の原理を「図解 → タブロー掃き出し → 双対性・感度分析 → 輸送・割当」の5章で体感しながら学びます。
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
          aria-label="線形計画法コースの学習ステップ（第1章〜第5章）"
          className="tab-scroller border-b border-[var(--border-subtle)]"
        >
          {LP_CHAPTERS.map((ch) => {
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
        {LP_CHAPTERS.map((ch) => {
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
                  {ch.id === 1 && (
                    <LpCh1Graphical
                      completedIds={completedExerciseIds}
                      onToggleDone={onToggleExerciseDone}
                      onMarkDone={onMarkExerciseDone}
                    />
                  )}
                  {ch.id === 2 && (
                    <LpCh2Simplex
                      completedIds={completedExerciseIds}
                      onToggleDone={onToggleExerciseDone}
                      onMarkDone={onMarkExerciseDone}
                    />
                  )}
                  {ch.id === 3 && (
                    <LpCh3Duality
                      completedIds={completedExerciseIds}
                      onToggleDone={onToggleExerciseDone}
                      onMarkDone={onMarkExerciseDone}
                    />
                  )}
                  {ch.id === 4 && (
                    <LpCh4Sensitivity
                      completedIds={completedExerciseIds}
                      onToggleDone={onToggleExerciseDone}
                      onMarkDone={onMarkExerciseDone}
                    />
                  )}
                  {ch.id === 5 && (
                    <LpCh5TransportAssign
                      completedIds={completedExerciseIds}
                      onToggleDone={onToggleExerciseDone}
                      onMarkDone={onMarkExerciseDone}
                    />
                  )}

                  <div className="app-surface rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                    {ch.id > 1 ? (
                      <button
                        type="button"
                        onClick={() => selectChapter((ch.id - 1) as LpChapterIndex)}
                        className="interactive-btn app-surface-subtle inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        前の章へ（{LP_CHAPTERS[ch.id - 2].shortTitle}）
                      </button>
                    ) : (
                      <span />
                    )}

                    {ch.id < 5 ? (
                      <button
                        type="button"
                        onClick={() => selectChapter((ch.id + 1) as LpChapterIndex)}
                        className="interactive-btn inline-flex items-center gap-1.5 rounded-lg bg-blue-700 text-white px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        次の章へ（{LP_CHAPTERS[ch.id].shortTitle}）
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

export default LinearProgrammingCourseModule;
