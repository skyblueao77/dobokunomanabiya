import type React from 'react';
import { LEARNING_UNITS, SUBJECTS, type SubjectId, type UnitId } from '../data/curriculum';

export type AppRoute = 'home' | 'legal' | 'reference' | 'not-found' | UnitId;

export interface ParsedLocation {
  route: AppRoute;
  subject: SubjectId;
  search: string;
  legacyHashRedirectPath: string | null;
}

export function normalizePathname(pathname: string): string {
  if (!pathname) return '/';
  const collapsed = pathname.replace(/\/+/g, '/');
  if (collapsed.length > 1 && collapsed.endsWith('/')) {
    return collapsed.slice(0, -1);
  }
  return collapsed;
}

export function buildRoutePath(
  route: AppRoute,
  subject: SubjectId = 'all',
  search = ''
): string {
  const normalizedSearch = search
    ? search.startsWith('?')
      ? search
      : `?${search}`
    : '';
  if (route === 'legal') {
    return '/legal';
  }
  if (route === 'reference') {
    return '/reference';
  }
  if (route === 'home' || route === 'not-found') {
    if (route === 'home' && subject !== 'all') {
      return `/subject/${subject}`;
    }
    return '/';
  }
  return `/unit/${route}${normalizedSearch}`;
}

function parseRawPathAndQuery(
  rawPath: string,
  rawQuery: string
): { route: AppRoute; subject: SubjectId; search: string } {
  const cleanPath = normalizePathname(rawPath);
  const normalizedSearch = rawQuery
    ? rawQuery.startsWith('?')
      ? rawQuery
      : `?${rawQuery}`
    : '';

  if (cleanPath === '/' || cleanPath === '/index.html') {
    return { route: 'home', subject: 'all', search: '' };
  }

  if (cleanPath === '/legal') {
    return { route: 'legal', subject: 'all', search: '' };
  }

  if (cleanPath === '/reference') {
    return { route: 'reference', subject: 'all', search: '' };
  }

  if (cleanPath.startsWith('/subject/')) {
    const rawSubject = cleanPath.slice('/subject/'.length) as Exclude<SubjectId, 'all'>;
    if (SUBJECTS.some((s) => s.id === rawSubject)) {
      return { route: 'home', subject: rawSubject, search: '' };
    }
    return { route: 'not-found', subject: 'all', search: '' };
  }

  if (cleanPath.startsWith('/unit/')) {
    const rawId = cleanPath.slice('/unit/'.length) as UnitId;
    const matched = LEARNING_UNITS.find((u) => u.id === rawId);
    if (matched) {
      return { route: rawId, subject: matched.subjectId, search: normalizedSearch };
    }
    return { route: 'not-found', subject: 'all', search: '' };
  }

  return { route: 'not-found', subject: 'all', search: '' };
}

/**
 * URL の pathname / search / hash から現在ルートを解決する。
 * `#/` で始まる旧ハッシュURLのみ後方互換で解析し、正規パスへの置換先を返す。
 * `#main-content` や `#disclaimer` 等のページ内アンカーは無視して現在ルートを保持する。
 */
export function parseLocation(
  pathname: string,
  search: string,
  hash: string
): ParsedLocation {
  if (hash && hash.startsWith('#/')) {
    const withoutPrefix = hash.slice(1); // "/unit/..." or "/" or "/legal"
    const qIdx = withoutPrefix.indexOf('?');
    const hashPath = qIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, qIdx);
    const hashSearch = qIdx === -1 ? '' : withoutPrefix.slice(qIdx);
    const parsed = parseRawPathAndQuery(hashPath, hashSearch);
    const redirectPath = buildRoutePath(parsed.route, parsed.subject, parsed.search);
    return {
      ...parsed,
      legacyHashRedirectPath: redirectPath,
    };
  }

  const parsed = parseRawPathAndQuery(pathname, search);
  return {
    ...parsed,
    legacyHashRedirectPath: null,
  };
}

export function isPlainLeftClick(e: React.MouseEvent): boolean {
  return (
    !e.defaultPrevented &&
    e.button === 0 &&
    !e.metaKey &&
    !e.ctrlKey &&
    !e.shiftKey &&
    !e.altKey
  );
}

/**
 * 現在の URL からクエリパラメータを取得する（History API 優先、旧ハッシュクエリにもフォールバック）。
 */
export function getSearchParamFromLocation(key: string): string | null {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has(key)) {
      return searchParams.get(key);
    }
    const hash = window.location.hash;
    if (hash.startsWith('#/')) {
      const qIdx = hash.indexOf('?');
      if (qIdx !== -1) {
        return new URLSearchParams(hash.slice(qIdx + 1)).get(key);
      }
    }
    return null;
  } catch {
    return null;
  }
}
