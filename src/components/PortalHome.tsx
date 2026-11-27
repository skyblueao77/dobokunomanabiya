import React, { useId, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Clock, HelpCircle, Search } from 'lucide-react';
import seoHomeCatalog from '../data/seoHomeCatalog.json';
import {
  LEARNING_UNITS,
  SUBJECTS,
  getSubjectMeta,
  type SubjectId,
  type UnitId,
} from '../data/curriculum';
import { buildRoutePath, isPlainLeftClick } from '../utils/router';
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
  const tabBaseId = useId();
  const tabRefs = useRef<Partial<Record<SubjectId, HTMLButtonElement | null>>>({});

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

  const handleSubjectTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    }
    if (nextIndex !== null) {
      e.preventDefault();
      const nextTab = tabs[nextIndex];
      const el = tabRefs.current[nextTab.id];
      if (el) {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        el.focus();
      }
    }
  };

  const handleTabClick = (tabId: SubjectId) => {
    onSelectSubject(tabId);
    tabRefs.current[tabId]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  const activeSubjectMeta =
    selectedSubject === 'all' ? null : seoHomeCatalog.subjects[selectedSubject];

  return (
    <div className="space-y-8">
      {/* ポータル概要 + 進捗トラッカー */}
      <section className="app-surface rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-blue-700 dark:text-blue-400">
              {activeSubjectMeta
                ? `${activeSubjectMeta.name}（${activeSubjectMeta.englishName}）｜${seoHomeCatalog.siteName}`
                : '土木工学・数理計画 インタラクティブ学習ポータル'}
            </p>
            <h1 id="main-content" tabIndex={-1} className="portal-h1 font-bold tracking-tight">
              {activeSubjectMeta ? activeSubjectMeta.h1 : seoHomeCatalog.routes.home.h1}
            </h1>
            <p className="text-sm sm:text-base app-text-muted leading-relaxed">
              {activeSubjectMeta ? activeSubjectMeta.lead : seoHomeCatalog.routes.home.lead}
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
              <a
                href={buildRoutePath(progress.lastVisitedUnit)}
                onClick={(e) => {
                  if (isPlainLeftClick(e)) {
                    e.preventDefault();
                    onOpenUnit(progress.lastVisitedUnit!);
                  }
                }}
                className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                前回の続きを開く
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
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
            {tabs.map((tab, idx) => {
              const isSelected = selectedSubject === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  id={`${tabBaseId}-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => handleTabClick(tab.id)}
                  onKeyDown={(e) => handleSubjectTabKeyDown(e, idx)}
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
        <div role="tabpanel" aria-labelledby={`${tabBaseId}-tab-${selectedSubject}`}>
        {filteredUnits.length === 0 ? (
          <div className="app-surface rounded-xl p-8 text-center text-sm app-text-muted">
            一致する学習単元が見つかりませんでした。検索条件を変更してください。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredUnits.map((unit) => {
              const subject = getSubjectMeta(unit.subjectId);
              const isDone = progress.completedUnits.includes(unit.id);
              const unitHref = buildRoutePath(unit.id);

              return (
                <article
                  key={unit.id}
                  className="unit-card-wrapper app-surface rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
                >
                  <div className="unit-card-body">
                    <div className="unit-card-meta-row flex flex-wrap items-center justify-between gap-2 text-xs">
                      <a
                        href={buildRoutePath('home', subject.id)}
                        onClick={(e) => {
                          if (isPlainLeftClick(e)) {
                            e.preventDefault();
                            onSelectSubject(subject.id);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                      >
                        {subject.name}（{subject.englishName}）
                      </a>

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
                    <a
                      href={unitHref}
                      aria-label={`${unit.title}のシミュレーターを開く`}
                      onClick={(e) => {
                        if (isPlainLeftClick(e)) {
                          e.preventDefault();
                          onOpenUnit(unit.id);
                        }
                      }}
                      className="interactive-btn inline-flex items-center gap-1.5 rounded-lg bg-blue-700 text-white px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                    >
                      シミュレーターを開く
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        </div>
      </section>

      {/* AEO セクション1：収録4科目・主要公式リファレンス */}
      <section aria-labelledby="formula-reference-heading" className="app-surface rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <h2 id="formula-reference-heading" className="text-base sm:text-lg font-bold inline-flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-700 dark:text-blue-400" aria-hidden="true" />
            収録4科目・主要公式リファレンス
          </h2>
          <span className="text-xs app-text-muted">大学・高専標準カリキュラム対応</span>
        </div>

        <p className="text-xs sm:text-sm app-text-muted leading-relaxed">
          本ポータルでは、構造力学・水理学・土質力学・数理計画の重要単元について、日本の教科書規約（土質力学：圧縮正、BMD：下側引張正）に沿った図解と計算途中式を提供しています。
        </p>

        <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="app-surface-subtle border-b border-[var(--border-subtle)]">
                <th scope="col" className="px-3.5 py-2.5 text-left font-bold whitespace-nowrap">科目・対象</th>
                <th scope="col" className="px-3.5 py-2.5 text-left font-bold">収録単元</th>
                <th scope="col" className="px-3.5 py-2.5 text-left font-bold">代表的な公式・手法</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {SUBJECTS.map((subject) => {
                const sSeo = seoHomeCatalog.subjects[subject.id];
                const units = LEARNING_UNITS.filter((u) => u.subjectId === subject.id);
                return (
                  <tr key={subject.id} className="align-top">
                    <th scope="row" className="px-3.5 py-3 text-left whitespace-nowrap">
                      <a
                        href={buildRoutePath('home', subject.id)}
                        onClick={(e) => {
                          if (isPlainLeftClick(e)) {
                            e.preventDefault();
                            onSelectSubject(subject.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className="font-bold text-blue-700 dark:text-blue-400 hover:underline block"
                      >
                        {subject.name}
                      </a>
                      <span className="text-xs font-normal app-text-muted">{sSeo.educationalLevel}</span>
                    </th>
                    <td className="px-3.5 py-3">
                      <ul className="space-y-1">
                        {units.map((u) => (
                          <li key={u.id}>
                            <a
                              href={buildRoutePath(u.id)}
                              onClick={(e) => {
                                if (isPlainLeftClick(e)) {
                                  e.preventDefault();
                                  onOpenUnit(u.id);
                                }
                              }}
                              className="font-medium hover:underline text-[var(--text-primary)]"
                            >
                              {u.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-3.5 py-3 space-y-1.5">
                      {sSeo.keyFormulas.map((kf) => (
                        <div key={kf.name} className="text-xs">
                          <span className="font-semibold">{kf.name}：</span>
                          <code className="font-mono-num text-blue-700 dark:text-blue-300">{kf.formula}</code>
                        </div>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* AEO セクション2：よくある質問（JSON-LD FAQPage と 100% 同一テキスト） */}
      <section aria-labelledby="portal-faq-heading" className="app-surface rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <h2 id="portal-faq-heading" className="text-base sm:text-lg font-bold inline-flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-700 dark:text-blue-400" aria-hidden="true" />
            よくある質問（FAQ）
          </h2>
          <span className="text-xs app-text-muted">ご利用方法・符号規約・免責事項</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seoHomeCatalog.portalFaqs.map((faq) => (
            <article
              key={faq.question}
              className="app-surface-subtle rounded-xl p-4 space-y-1.5"
            >
              <h3 className="text-sm font-bold leading-snug">{faq.question}</h3>
              <p className="text-xs sm:text-sm app-text-muted leading-relaxed">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
