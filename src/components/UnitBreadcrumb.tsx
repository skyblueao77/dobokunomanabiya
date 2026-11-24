import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { getSubjectMeta, type SubjectId } from '../data/curriculum';
import { buildRoutePath, isPlainLeftClick, type AppRoute } from '../utils/router';

interface UnitBreadcrumbProps {
  subjectId: Exclude<SubjectId, 'all'>;
  unitTitle: string;
  onNavigate: (route: AppRoute, subjectOverride?: SubjectId) => void;
}

export const UnitBreadcrumb: React.FC<UnitBreadcrumbProps> = ({
  subjectId,
  unitTitle,
  onNavigate,
}) => {
  const subject = getSubjectMeta(subjectId);
  const homePath = buildRoutePath('home', 'all');
  const subjectPath = buildRoutePath('home', subjectId);

  return (
    <nav aria-label="パンくずリスト" className="text-xs app-text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <a
            href={homePath}
            onClick={(e) => {
              if (isPlainLeftClick(e)) {
                e.preventDefault();
                onNavigate('home', 'all');
              }
            }}
            className="inline-flex items-center gap-1 font-medium hover:text-[var(--text-primary)] hover:underline"
          >
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            <span>ホーム</span>
          </a>
        </li>
        <li aria-hidden="true" className="inline-flex items-center">
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        <li>
          <a
            href={subjectPath}
            onClick={(e) => {
              if (isPlainLeftClick(e)) {
                e.preventDefault();
                onNavigate('home', subjectId);
              }
            }}
            className="font-medium hover:text-[var(--text-primary)] hover:underline"
          >
            {subject.name}
          </a>
        </li>
        <li aria-hidden="true" className="inline-flex items-center">
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        <li aria-current="page" className="font-semibold text-[var(--text-primary)]">
          {unitTitle}
        </li>
      </ol>
    </nav>
  );
};
