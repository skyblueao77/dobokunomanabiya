import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { type UnitId } from '../../data/curriculum';
import {
  buildRoutePath,
  getSearchParamFromLocation,
  isPlainLeftClick,
  normalizePathname,
} from '../../utils/router';
import { CopyShareButton } from '../CopyShareButton';
import { Ch1StressTensor } from '../continuum/Ch1StressTensor';
import { Ch2CauchyTransform } from '../continuum/Ch2CauchyTransform';
import { Ch3PrincipalInvariants } from '../continuum/Ch3PrincipalInvariants';
import { Ch4MohrPole } from '../continuum/Ch4MohrPole';
import { Ch5ElasticGroundStress } from '../continuum/Ch5ElasticGroundStress';
import { Ch6ElasticDeformation } from '../continuum/Ch6ElasticDeformation';

export type ChapterIndex = 1 | 2 | 3 | 4 | 5 | 6;

const CHAPTERS: {
  id: ChapterIndex;
  shortTitle: string;
  fullTitle: string;
  exerciseIds: [string, string];
}[] = [
  {
    id: 1,
    shortTitle: '1. 多次元応力の表現',
    fullTitle: '第1章：多次元場での応力の表現',
    exerciseIds: ['ch1-q1', 'ch1-q2'],
  },
  {
    id: 2,
    shortTitle: '2. コーシーの公式・変換',
    fullTitle: '第2章：コーシーの公式・座標変換',
    exerciseIds: ['ch2-q1', 'ch2-q2'],
  },
  {
    id: 3,
    shortTitle: '3. 主応力と不変量',
    fullTitle: '第3章：主応力と応力の不変量',
    exerciseIds: ['ch3-q1', 'ch3-q2'],
  },
  {
    id: 4,
    shortTitle: '4. モール円と用極法',
    fullTitle: '第4章：モールの応力円と用極法',
    exerciseIds: ['ch4-q1', 'ch4-q2'],
  },
  {
    id: 5,
    shortTitle: '5. 弾性地盤内の応力',
    fullTitle: '第5章：弾性地盤内の応力',
    exerciseIds: ['ch5-q1', 'ch5-q2'],
  },
  {
    id: 6,
    shortTitle: '6. 弾性地盤の応力と変形',
    fullTitle: '第6章：弾性地盤内の応力と変形',
    exerciseIds: ['ch6-q1', 'ch6-q2'],
  },
];

const TOTAL_EXERCISE_COUNT = CHAPTERS.length * 2;

const UNIT_PATH = buildRoutePath('geomechanics-continuum');

function parseInitialChapter(): ChapterIndex {
  try {
    const ch = Number(getSearchParamFromLocation('ch'));
    if (ch >= 1 && ch <= 6 && Number.isInteger(ch)) {
      return ch as ChapterIndex;
    }
    return 1;
  } catch {
    return 1;
  }
}

interface GeomechanicsCourseModuleProps {
  isCompleted: boolean;
  onToggleUnitComplete: () => void;
  completedExerciseIds: string[];
  onToggleExerciseDone: (id: string) => void;
  onMarkExerciseDone: (id: string) => void;
  onBackToPortal: () => void;
  onOpenUnit: (unitId: UnitId) => void;
}

export const GeomechanicsCourseModule: React.FC<GeomechanicsCourseModuleProps> = ({
  isCompleted,
  onToggleUnitComplete,
  completedExerciseIds,
  onToggleExerciseDone,
  onMarkExerciseDone,
  onBackToPortal,
  onOpenUnit,
}) => {
  const [activeChapter, setActiveChapter] = useState<ChapterIndex>(() => parseInitialChapter());
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

  const selectChapter = (ch: ChapterIndex, focusTab = false) => {
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

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, current: ChapterIndex) => {
    let next: ChapterIndex | null = null;
    if (e.key === 'ArrowRight') {
      next = current === 6 ? 1 : ((current + 1) as ChapterIndex);
    } else if (e.key === 'ArrowLeft') {
      next = current === 1 ? 6 : ((current - 1) as ChapterIndex);
    } else if (e.key === 'Home') {
      next = 1;
    } else if (e.key === 'End') {
      next = 6;
    }
    if (next !== null) {
      e.preventDefault();
      selectChapter(next, true);
    }
  };

  const solvedTotal = CHAPTERS.reduce(
    (acc, ch) =>
      acc + ch.exerciseIds.filter((id) => completedExerciseIds.includes(id)).length,
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
            土質力学・地盤連続体｜応力テンソル〜弾性地盤の応力と変形
          </h1>
          <p className="text-xs sm:text-sm app-text-muted">
            多次元応力・コーシーの公式・主応力と不変量・用極法・弾性地盤の応力（Boussinesq / 重ね合わせ）・変形を「理解 → 想像 → 演習」で体系的に学びます。
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

      {/* 単一行スクロール対応 章タブナビゲーション */}
      <div className="app-surface rounded-xl px-2 pt-2 shadow-sm">
        <div
          role="tablist"
          aria-label="コースの学習ステップ（第1章〜第6章）"
          className="tab-scroller border-b border-[var(--border-subtle)]"
        >
          {CHAPTERS.map((ch) => {
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

      {/* 章コンテンツパネル */}
      <div>
        {CHAPTERS.map((ch) => {
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
                    <Ch1StressTensor
                      completedIds={completedExerciseIds}
                      onToggleDone={onToggleExerciseDone}
                      onMarkDone={onMarkExerciseDone}
                    />
                  )}
                  {ch.id === 2 && (
                    <Ch2CauchyTransform
                      completedIds={completedExerciseIds}
                      onToggleDone={onToggleExerciseDone}
                      onMarkDone={onMarkExerciseDone}
                    />
                  )}
                  {ch.id === 3 && (
                    <Ch3PrincipalInvariants
                      completedIds={completedExerciseIds}
                      onToggleDone={onToggleExerciseDone}
                      onMarkDone={onMarkExerciseDone}
                    />
                  )}
                  {ch.id === 4 && (
                    <Ch4MohrPole
                      completedIds={completedExerciseIds}
                      onToggleDone={onToggleExerciseDone}
                      onMarkDone={onMarkExerciseDone}
                      onOpenUnit={onOpenUnit}
                    />
                  )}
                  {ch.id === 5 && (
                    <Ch5ElasticGroundStress
                      completedIds={completedExerciseIds}
                      onToggleDone={onToggleExerciseDone}
                      onMarkDone={onMarkExerciseDone}
                    />
                  )}
                  {ch.id === 6 && (
                    <Ch6ElasticDeformation
                      completedIds={completedExerciseIds}
                      onToggleDone={onToggleExerciseDone}
                      onMarkDone={onMarkExerciseDone}
                    />
                  )}

                  {/* 前後章ナビゲーション */}
                  <div className="app-surface rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                    {ch.id > 1 ? (
                      <button
                        type="button"
                        onClick={() => selectChapter((ch.id - 1) as ChapterIndex)}
                        className="interactive-btn app-surface-subtle inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        前の章へ（{CHAPTERS[ch.id - 2].shortTitle}）
                      </button>
                    ) : (
                      <span />
                    )}

                    {ch.id < 6 ? (
                      <button
                        type="button"
                        onClick={() => selectChapter((ch.id + 1) as ChapterIndex)}
                        className="interactive-btn inline-flex items-center gap-1.5 rounded-lg bg-blue-700 text-white px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        次の章へ（{CHAPTERS[ch.id].shortTitle}）
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

export default GeomechanicsCourseModule;
