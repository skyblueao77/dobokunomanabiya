import React from 'react';
import { ArrowLeft, Compass, FileQuestion } from 'lucide-react';
import { SUBJECTS, type SubjectId } from '../data/curriculum';
import { buildRoutePath, isPlainLeftClick, type AppRoute } from '../utils/router';

interface NotFoundPageProps {
  onNavigate: (route: AppRoute, subjectOverride?: SubjectId) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  return (
    <section className="app-surface rounded-2xl p-6 sm:p-10 max-w-2xl mx-auto my-6 space-y-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/35">
          <FileQuestion className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="space-y-1.5">
          <p className="text-xs font-mono-num font-bold app-text-muted">404 Not Found</p>
          <h1 id="main-content" tabIndex={-1} className="portal-h1 font-bold">
            お探しのページが見つかりませんでした
          </h1>
          <p className="text-sm app-text-muted leading-relaxed">
            URL が間違っているか、ページが移動・削除された可能性があります。ポータル一覧または各科目ページから学習単元をお選びください。
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <a
          href={buildRoutePath('home', 'all')}
          onClick={(e) => {
            if (isPlainLeftClick(e)) {
              e.preventDefault();
              onNavigate('home', 'all');
            }
          }}
          className="interactive-btn inline-flex items-center gap-1.5 rounded-lg bg-blue-700 text-white px-4 py-2 text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          ポータル一覧へ戻る
        </a>
      </div>

      <div className="border-t border-[var(--border-subtle)] pt-4 space-y-2.5">
        <h2 className="text-xs font-bold app-text-muted inline-flex items-center gap-1.5">
          <Compass className="h-3.5 w-3.5" aria-hidden="true" />
          収録科目から探す
        </h2>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((subject) => (
            <a
              key={subject.id}
              href={buildRoutePath('home', subject.id)}
              onClick={(e) => {
                if (isPlainLeftClick(e)) {
                  e.preventDefault();
                  onNavigate('home', subject.id);
                }
              }}
              className="interactive-btn app-surface-subtle rounded-lg px-3 py-1.5 text-xs font-semibold hover:underline cursor-pointer"
            >
              {subject.name}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NotFoundPage;
