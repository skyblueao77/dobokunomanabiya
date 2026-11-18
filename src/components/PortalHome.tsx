import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock, Search } from 'lucide-react';
import {
  LEARNING_UNITS,
  SUBJECTS,
  getSubjectMeta,
  type SubjectId,
  type UnitId,
} from '../data/curriculum';
import { type StudyProgress } from '../utils/storage';

interface PortalHomeProps {
  progress: StudyProgress;
  selectedSubject: SubjectId;
  onSelectSubject: (subject: SubjectId) => void;
  onOpenUnit: (unitId: UnitId) => void;
}

export const PortalHome: React.FC<PortalHomeProps> = ({
  progress,
  selectedSubject,
  onSelectSubject,
  onOpenUnit,
}) => {
  const [query, setQuery] = useState('');

  const filteredUnits = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LEARNING_UNITS.filter((unit) => {
      const subjectMatch = selectedSubject === 'all' || unit.subjectId === selectedSubject;
      if (!subjectMatch) return false;
      if (!q) return true;
      return (
        unit.title.toLowerCase().includes(q) ||
        unit.subtitle.toLowerCase().includes(q) ||
        unit.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [selectedSubject, query]);

  const completionRatio = Math.round(
    (progress.completedUnits.length / LEARNING_UNITS.length) * 100
  );

  const tabs: { id: SubjectId; label: string }[] = [
    { id: 'all', label: `すべて (${LEARNING_UNITS.length})` },
    ...SUBJECTS.map((s) => ({
      id: s.id,
      label: `${s.name} (${LEARNING_UNITS.filter((u) => u.subjectId === s.id).length})`,
    })),
  ];

  return (
    <div className="space-y-8">
      {/* ポータル概要 + 進捗トラッカー */}
      <section className="app-surface rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-blue-700 dark:text-blue-400">
              土木工学インタラクティブ学習ポータル
            </p>
            <h1 id="main-content" tabIndex={-1} className="portal-h1 font-bold tracking-tight">
              土木の学び舎
            </h1>
            <p className="text-sm sm:text-base app-text-muted leading-relaxed">
              日本の大学・高専の土木系カリキュラム（圧縮正規約の土質力学・構造力学・水理学）に準拠した、ブラウザ完結型の図解・計算シミュレーター集です。URL共有と学習進捗保存に対応し、オフライン環境でも動作します。
            </p>
          </div>

          <div className="app-surface-subtle rounded-xl p-4 min-w-[240px] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>単元マスター進捗</span>
              <span className="font-mono-num">
                {progress.completedUnits.length} / {LEARNING_UNITS.length} ({completionRatio}%)
              </span>
            </div>
            <progress
              value={progress.completedUnits.length}
              max={LEARNING_UNITS.length}
              aria-label="学習進捗"
              className="w-full h-2.5 rounded-full overflow-hidden"
            />
            {progress.lastVisitedUnit && (
              <button
                type="button"
                onClick={() => onOpenUnit(progress.lastVisitedUnit!)}
                className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                前回の続きを開く
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 科目フィルタータブ & 単元検索 */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-2">
          <div
            role="tablist"
            aria-label="土木科目フィルター"
            className="tab-scroller"
          >
            {tabs.map((tab) => {
              const isSelected = selectedSubject === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onSelectSubject(tab.id)}
                  className="tab-item px-4 py-2 text-xs sm:text-sm whitespace-nowrap cursor-pointer hover:bg-[var(--surface-subtle)] rounded-t-lg transition-colors"
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative sm:w-64">
            <label htmlFor="unit-search" className="visually-hidden">
              単元・キーワード検索
            </label>
            <Search
              className="h-4 w-4 app-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="unit-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="単元・公式を検索..."
              className="app-surface w-full rounded-lg pl-9 pr-3 py-1.5 text-sm"
            />
          </div>
        </div>

        <p role="status" aria-live="polite" className="text-xs app-text-muted">
          表示中の単元：<span className="font-mono-num font-semibold">{filteredUnits.length}</span> 件
          {query.trim() ? `（「${query.trim()}」で絞り込み中）` : ''}
        </p>

        {/* 単元カードグリッド */}
        {filteredUnits.length === 0 ? (
          <div className="app-surface rounded-xl p-8 text-center text-sm app-text-muted">
            一致する学習単元が見つかりませんでした。検索条件を変更してください。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredUnits.map((unit) => {
              const subject = getSubjectMeta(unit.subjectId);
              const isDone = progress.completedUnits.includes(unit.id);

              return (
                <article
                  key={unit.id}
                  className="unit-card-wrapper app-surface rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
                >
                  <div className="unit-card-body">
                    <div className="unit-card-meta-row flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-400">
                        {subject.name}（{subject.englishName}）
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="app-surface-subtle rounded-md px-2 py-0.5 text-xs font-medium">
                          {unit.level}
                        </span>
                        {isDone && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            学習済み
                          </span>
                        )}
                      </div>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold leading-snug">{unit.title}</h2>
                    <p className="text-sm app-text-muted leading-relaxed">{unit.subtitle}</p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {unit.tags.map((tag) => (
                        <span
                          key={tag}
                          className="app-surface-subtle rounded px-2 py-0.5 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                    <span className="inline-flex items-center gap-1 text-xs app-text-muted font-mono-num">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      目安 {unit.estimatedMinutes}分
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenUnit(unit.id)}
                      className="interactive-btn inline-flex items-center gap-1.5 rounded-lg bg-blue-700 text-white px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                    >
                      シミュレーターを開く
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
