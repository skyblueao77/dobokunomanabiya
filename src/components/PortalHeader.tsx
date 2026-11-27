import React, { useEffect, useId, useRef, useState } from 'react';
import {
  ChevronDown,
  Compass,
  Download,
  Menu,
  Monitor,
  Moon,
  RefreshCw,
  SlidersHorizontal,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  SUBJECTS,
  getUnitsBySubject,
  type SubjectId,
} from '../data/curriculum';
import { buildRoutePath, isPlainLeftClick, type AppRoute } from '../utils/router';
import {
  exportProgressJson,
  validateAndNormalizeProgress,
  type StudyProgress,
  type ThemePreference,
} from '../utils/storage';

type NavSubjectId = Exclude<SubjectId, 'all'>;

const WIDE_HEADER_MEDIA_QUERY = '(min-width: 62rem)';

interface PortalHeaderProps {
  activeRoute: AppRoute;
  activeSubject: SubjectId;
  onNavigate: (route: AppRoute, subjectOverride?: SubjectId) => void;
  themePref: ThemePreference;
  onChangeTheme: (pref: ThemePreference) => void;
  onRefreshApp: () => Promise<{ status: 'reloading' | 'offline' }>;
  progress: StudyProgress;
  onImportProgress: (next: StudyProgress) => void;
  onResetProgress: () => void;
}

function isPopoverOpen(el: HTMLElement | null): boolean {
  if (!el) return false;
  try {
    return el.matches(':popover-open') || el.classList.contains(':popover-open');
  } catch {
    return el.classList.contains(':popover-open');
  }
}

function showPopoverSafe(el: HTMLElement | null, source?: HTMLElement | null): void {
  if (!el) return;
  const popEl = el as HTMLElement & {
    showPopover?: (options?: { source?: HTMLElement }) => void;
  };
  if (!popEl.showPopover) return;
  try {
    if (source) {
      popEl.showPopover({ source });
    } else {
      popEl.showPopover();
    }
  } catch {
    try {
      popEl.showPopover();
    } catch {
      // Ignore if already open or unsupported
    }
  }
}

function hidePopoverSafe(el: HTMLElement | null): void {
  if (!el) return;
  const popEl = el as HTMLElement & { hidePopover?: () => void };
  if (!popEl.hidePopover) return;
  try {
    popEl.hidePopover();
  } catch {
    // Ignore if not open
  }
}

function positionPopoverFallback(
  popoverEl: HTMLElement,
  triggerEl: HTMLElement,
  alignEnd = false
): void {
  if (typeof CSS !== 'undefined' && CSS.supports?.('position-area', 'block-end')) {
    return;
  }
  const triggerRect = triggerEl.getBoundingClientRect();
  const popRect = popoverEl.getBoundingClientRect();
  const margin = 8;
  let top = triggerRect.bottom + margin;
  if (top + popRect.height > window.innerHeight - margin) {
    top = Math.max(margin, triggerRect.top - popRect.height - margin);
  }
  const rawLeft = alignEnd ? triggerRect.right - popRect.width : triggerRect.left;
  const left = Math.max(
    margin,
    Math.min(rawLeft, window.innerWidth - popRect.width - margin)
  );
  popoverEl.style.top = `${top}px`;
  popoverEl.style.left = `${left}px`;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  activeRoute,
  activeSubject,
  onNavigate,
  themePref,
  onChangeTheme,
  onRefreshApp,
  progress,
  onImportProgress,
  onResetProgress,
}) => {
  const baseId = useId();
  const menuId = `${baseId}-site-menu`;
  const settingsId = `${baseId}-settings`;
  const resetDialogTitleId = `${baseId}-reset-dialog-title`;

  const [isWide, setIsWide] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState('');
  const [progressNotice, setProgressNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resetDialogRef = useRef<HTMLDialogElement | null>(null);

  const handleExportProgress = () => {
    try {
      const json = exportProgressJson(progress);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dobokunomanabiya-progress.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setProgressNotice({ kind: 'ok', text: '学習進捗を JSON ファイルとして保存しました。' });
    } catch {
      setProgressNotice({ kind: 'err', text: '進捗の書き出しに失敗しました。' });
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const normalized = validateAndNormalizeProgress(parsed);
      if (!normalized) {
        setProgressNotice({ kind: 'err', text: '進捗データの形式が正しくありません。' });
        return;
      }
      onImportProgress(normalized);
      setProgressNotice({ kind: 'ok', text: '学習進捗をファイルから復元しました。' });
    } catch {
      setProgressNotice({ kind: 'err', text: 'JSON ファイルの読み込みに失敗しました。' });
    }
  };

  const handleOpenResetDialog = () => {
    hidePopoverSafe(settingsPopRef.current);
    const dialog = resetDialogRef.current;
    if (dialog && !dialog.open) {
      dialog.returnValue = '';
      dialog.showModal();
    }
  };

  const handleResetDialogClose = () => {
    const dialog = resetDialogRef.current;
    if (!dialog) return;
    const choice = dialog.returnValue;
    dialog.returnValue = '';
    if (choice === 'reset') {
      onResetProgress();
      setProgressNotice({ kind: 'ok', text: '学習進捗を初期化しました。' });
    }
  };

  const handleRefreshClick = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshNotice('');
    try {
      const res = await onRefreshApp();
      if (res.status === 'offline') {
        setRefreshNotice('現在オフラインのため更新できません。通信環境を確認してください。');
        setIsRefreshing(false);
      }
    } catch {
      setRefreshNotice('更新の確認に失敗しました。ページを再読み込みしてください。');
      setIsRefreshing(false);
    }
  };

  const menuRef = useRef<HTMLUListElement | null>(null);
  const settingsBtnRef = useRef<HTMLButtonElement | null>(null);
  const settingsPopRef = useRef<HTMLDivElement | null>(null);

  const triggerRefs = useRef<Record<NavSubjectId, HTMLButtonElement | null>>({
    structural: null,
    hydraulics: null,
    soil: null,
    'math-programming': null,
  });
  const submenuRefs = useRef<Record<NavSubjectId, HTMLUListElement | null>>({
    structural: null,
    hydraulics: null,
    soil: null,
    'math-programming': null,
  });

  const isWideRef = useRef(isWide);
  const hoverPreviewRef = useRef<Set<NavSubjectId>>(new Set());

  const closeAllNavigationPopovers = () => {
    hoverPreviewRef.current.clear();
    if (isWideRef.current) {
      for (const s of SUBJECTS) {
        hidePopoverSafe(submenuRefs.current[s.id]);
      }
    } else {
      hidePopoverSafe(menuRef.current);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(WIDE_HEADER_MEDIA_QUERY);
    const update = (matches: boolean) => {
      isWideRef.current = matches;
      setIsWide(matches);
    };
    update(mq.matches);
    const onChange = (e: MediaQueryListEvent) => update(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    isWideRef.current = isWide;
    hoverPreviewRef.current.clear();

    if (isWide) {
      hidePopoverSafe(menuRef.current);
      for (const subject of SUBJECTS) {
        const sub = submenuRefs.current[subject.id];
        const trig = triggerRefs.current[subject.id];
        if (!sub || !trig) continue;
        sub.hidden = false;
        trig.setAttribute('aria-expanded', isPopoverOpen(sub) ? 'true' : 'false');
      }
    } else {
      for (const subject of SUBJECTS) {
        const sub = submenuRefs.current[subject.id];
        const trig = triggerRefs.current[subject.id];
        if (!sub || !trig) continue;
        hidePopoverSafe(sub);
        sub.hidden = true;
        trig.setAttribute('aria-expanded', 'false');
      }
    }
  }, [isWide]);

  useEffect(() => {
    const cleanups: (() => void)[] = [];

    for (const subject of SUBJECTS) {
      const sub = submenuRefs.current[subject.id];
      const trig = triggerRefs.current[subject.id];
      if (!sub || !trig) continue;

      const onToggle = (e: Event) => {
        const toggleEvent = e as Event & { newState?: string };
        const open = toggleEvent.newState === 'open';
        if (isWideRef.current) {
          trig.setAttribute('aria-expanded', open ? 'true' : 'false');
          if (open) {
            positionPopoverFallback(sub, trig, false);
          } else {
            sub.style.top = '';
            sub.style.left = '';
            hoverPreviewRef.current.delete(subject.id);
          }
        }
      };

      sub.addEventListener('toggle', onToggle);
      cleanups.push(() => sub.removeEventListener('toggle', onToggle));
    }

    const settingsPop = settingsPopRef.current;
    const settingsBtn = settingsBtnRef.current;
    if (settingsPop && settingsBtn) {
      const onSettingsToggle = (e: Event) => {
        const toggleEvent = e as Event & { newState?: string };
        const open = toggleEvent.newState === 'open';
        if (open) {
          positionPopoverFallback(settingsPop, settingsBtn, true);
        } else {
          settingsPop.style.top = '';
          settingsPop.style.left = '';
        }
      };
      settingsPop.addEventListener('toggle', onSettingsToggle);
      cleanups.push(() => settingsPop.removeEventListener('toggle', onSettingsToggle));
    }

    return () => {
      for (const fn of cleanups) fn();
    };
  }, []);

  const handleSubjectPointerEnter = (
    subjectId: NavSubjectId,
    e: React.PointerEvent<HTMLLIElement>
  ) => {
    if (!isWideRef.current) return;
    if (e.pointerType === 'touch') return;
    if (!window.matchMedia?.('(hover: hover)').matches) return;

    const sub = submenuRefs.current[subjectId];
    const trig = triggerRefs.current[subjectId];
    if (!sub || !trig || isPopoverOpen(sub)) return;

    hoverPreviewRef.current.add(subjectId);
    showPopoverSafe(sub, trig);
  };

  const handleSubjectPointerLeave = (subjectId: NavSubjectId) => {
    if (!isWideRef.current) return;
    if (!hoverPreviewRef.current.has(subjectId)) return;

    hoverPreviewRef.current.delete(subjectId);
    hidePopoverSafe(submenuRefs.current[subjectId]);
  };

  const handleSubjectBlur = (
    subjectId: NavSubjectId,
    e: React.FocusEvent<HTMLLIElement>
  ) => {
    if (!isWideRef.current) return;
    const nextFocus = e.relatedTarget;
    if (nextFocus instanceof Node && e.currentTarget.contains(nextFocus)) {
      return;
    }
    hoverPreviewRef.current.delete(subjectId);
    const sub = submenuRefs.current[subjectId];
    if (isPopoverOpen(sub)) {
      hidePopoverSafe(sub);
    }
  };

  const handleTriggerClick = (
    subjectId: NavSubjectId,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    const sub = submenuRefs.current[subjectId];
    const trig = triggerRefs.current[subjectId];
    if (!sub || !trig) return;

    if (isWideRef.current) {
      if (hoverPreviewRef.current.has(subjectId)) {
        hoverPreviewRef.current.delete(subjectId);
        e.preventDefault();
      }
      return;
    }

    e.preventDefault();
    const willOpen = sub.hidden;
    sub.hidden = !willOpen;
    trig.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  };

  const isPortalAllCurrent = activeRoute === 'home' && activeSubject === 'all';

  return (
    <header
      className={`site-header sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--surface-card)]/95 text-[var(--text-primary)] backdrop-blur${
        isWide ? ' is-wide' : ''
      }`}
    >
      <a href="#main-content" className="skip-link visually-hidden">
        メインコンテンツへスキップ
      </a>

      <div className="header-inner mx-auto max-w-7xl px-3 sm:px-6 py-2 flex items-center justify-between gap-3">
        <a
          href={buildRoutePath('home', 'all')}
          onClick={(e) => {
            if (isPlainLeftClick(e)) {
              e.preventDefault();
              onNavigate('home', 'all');
              closeAllNavigationPopovers();
            }
          }}
          className="site-logo flex items-center gap-2 rounded-lg px-1 py-1 shrink-0"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white shadow-sm">
            <Compass className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-sm sm:text-base font-bold leading-tight whitespace-nowrap">
              土木の学び舎
            </span>
            <span className="app-notice-badge shrink-0 rounded px-1.5 py-0.5 text-xs font-bold leading-none">
              開発中
            </span>
          </span>
        </a>

        <nav className="site-nav" aria-label="主要ナビゲーション">
          <button
            type="button"
            popoverTarget={menuId}
            popoverTargetAction="toggle"
            aria-controls={menuId}
            className="menu-button interactive-btn app-surface inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
            <span>メニュー</span>
          </button>

          <ul
            ref={menuRef}
            id={menuId}
            popover={isWide ? undefined : 'auto'}
            className="site-menu app-surface rounded-xl p-2 shadow-xl"
          >
            <li>
              <a
                href={buildRoutePath('home', 'all')}
                aria-current={isPortalAllCurrent ? 'page' : undefined}
                onClick={(e) => {
                  if (isPlainLeftClick(e)) {
                    e.preventDefault();
                    onNavigate('home', 'all');
                    closeAllNavigationPopovers();
                  }
                }}
                className="nav-link-item inline-flex items-center rounded-md px-3 py-2 text-xs sm:text-sm font-medium hover:bg-[var(--surface-subtle)] transition-colors"
              >
                ポータル一覧
              </a>
            </li>

            {SUBJECTS.map((subject) => {
              const units = getUnitsBySubject(subject.id);
              const subId = `${baseId}-sub-${subject.id}`;
              const isSubjectActive = activeSubject === subject.id;

              return (
                <li
                  key={subject.id}
                  className="nav-dropdown"
                  onPointerEnter={(e) => handleSubjectPointerEnter(subject.id, e)}
                  onPointerLeave={() => handleSubjectPointerLeave(subject.id)}
                  onBlur={(e) => handleSubjectBlur(subject.id, e)}
                >
                  <button
                    ref={(el) => {
                      triggerRefs.current[subject.id] = el;
                    }}
                    type="button"
                    aria-expanded="false"
                    aria-controls={subId}
                    popoverTarget={subId}
                    data-active-subject={isSubjectActive ? 'true' : undefined}
                    onClick={(e) => handleTriggerClick(subject.id, e)}
                    className="dropdown-trigger nav-link-item inline-flex items-center justify-between gap-1 rounded-md px-3 py-2 text-xs sm:text-sm font-semibold hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                  >
                    <span>{subject.name}</span>
                    <ChevronDown
                      className="chevron-icon h-3.5 w-3.5 shrink-0 transition-transform duration-150"
                      aria-hidden="true"
                    />
                  </button>

                  <ul
                    ref={(el) => {
                      submenuRefs.current[subject.id] = el;
                    }}
                    id={subId}
                    popover={isWide ? 'auto' : undefined}
                    className="dropdown-list app-surface rounded-xl p-1.5 shadow-xl"
                  >
                    {units.map((unit) => {
                      const isUnitCurrent = activeRoute === unit.id;
                      return (
                        <li key={unit.id}>
                          <a
                            href={buildRoutePath(unit.id)}
                            aria-current={isUnitCurrent ? 'page' : undefined}
                            onClick={(e) => {
                              if (isPlainLeftClick(e)) {
                                e.preventDefault();
                                onNavigate(unit.id);
                                closeAllNavigationPopovers();
                              }
                            }}
                            className="dropdown-link flex flex-col gap-0.5 rounded-lg px-3 py-2 text-xs sm:text-sm hover:bg-[var(--surface-subtle)] transition-colors"
                          >
                            <span className="font-semibold leading-snug">{unit.title}</span>
                            <span className="text-xs app-text-muted">
                              {unit.level} ・ 目安 {unit.estimatedMinutes}分
                            </span>
                          </a>
                        </li>
                      );
                    })}
                    <li className="dropdown-divider-item border-t border-[var(--border-subtle)] mt-1 pt-1">
                      <a
                        href={buildRoutePath('home', subject.id)}
                        aria-current={
                          activeRoute === 'home' && activeSubject === subject.id
                            ? 'page'
                            : undefined
                        }
                        onClick={(e) => {
                          if (isPlainLeftClick(e)) {
                            e.preventDefault();
                            onNavigate('home', subject.id);
                            closeAllNavigationPopovers();
                          }
                        }}
                        className="dropdown-link flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-[var(--accent-color)] hover:bg-[var(--surface-subtle)] transition-colors"
                      >
                        <span>{subject.name}の一覧を見る（{units.length}単元）</span>
                      </a>
                    </li>
                  </ul>
                </li>
              );
            })}
            <li>
              <a
                href={buildRoutePath('reference')}
                aria-current={activeRoute === 'reference' ? 'page' : undefined}
                onClick={(e) => {
                  if (isPlainLeftClick(e)) {
                    e.preventDefault();
                    onNavigate('reference');
                    closeAllNavigationPopovers();
                  }
                }}
                className="nav-link-item inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs sm:text-sm font-medium hover:bg-[var(--surface-subtle)] transition-colors"
              >
                公式・換算
              </a>
            </li>
          </ul>
        </nav>

        <div className="header-actions flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            ref={settingsBtnRef}
            type="button"
            popoverTarget={settingsId}
            popoverTargetAction="toggle"
            aria-controls={settingsId}
            aria-label="表示設定を開く"
            className="settings-button interactive-btn app-surface inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">表示設定</span>
          </button>

          <div
            ref={settingsPopRef}
            id={settingsId}
            popover="auto"
            className="popover-panel settings-popover app-surface rounded-xl p-4 shadow-xl w-72 max-w-[calc(100dvw-2rem)]"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                <span className="text-sm font-bold">表示テーマ設定</span>
                <button
                  type="button"
                  popoverTarget={settingsId}
                  popoverTargetAction="hide"
                  className="text-xs app-text-muted hover:underline px-2 py-1 cursor-pointer"
                >
                  閉じる
                </button>
              </div>
              <fieldset className="space-y-2">
                <legend className="text-xs app-text-muted mb-1">
                  配色モード（OS設定と連動 / 手動固定）
                </legend>
                {(
                  [
                    { id: 'system', label: 'システム設定に合わせる', Icon: Monitor },
                    { id: 'light', label: 'ライトモード', Icon: Sun },
                    { id: 'dark', label: 'ダークモード', Icon: Moon },
                  ] as const
                ).map(({ id, label, Icon }) => (
                  <label
                    key={id}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium cursor-pointer border ${
                      themePref === id
                        ? 'border-blue-600 dark:border-blue-400 bg-blue-600/10'
                        : 'border-[var(--border-control)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="color-scheme-pref"
                      value={id}
                      checked={themePref === id}
                      onChange={() => onChangeTheme(id)}
                      className="sr-only"
                    />
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>

              <div className="border-t border-[var(--border-subtle)] pt-3 space-y-2">
                <p className="text-xs font-bold">アプリ更新・キャッシュ管理</p>
                <button
                  type="button"
                  disabled={isRefreshing}
                  onClick={() => void handleRefreshClick()}
                  className="interactive-btn app-surface w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 shrink-0${isRefreshing ? ' animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>{isRefreshing ? '確認・更新中…' : '最新バージョンを確認・キャッシュ更新'}</span>
                </button>
                <p className="text-xs app-text-muted">学習進捗やテーマ設定は消えません。</p>
                {refreshNotice && (
                  <p role="status" aria-live="polite" className="text-xs app-notice-accent font-medium">
                    {refreshNotice}
                  </p>
                )}
              </div>

              <div className="border-t border-[var(--border-subtle)] pt-3 space-y-2">
                <p className="text-xs font-bold">学習進捗データの管理（端末内保存）</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleExportProgress}
                    className="interactive-btn app-surface inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>JSON保存</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="interactive-btn app-surface inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>JSON復元</span>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => void handleImportFileChange(e)}
                  className="visually-hidden"
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={handleOpenResetDialog}
                  className="interactive-btn w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/45 bg-red-500/10 text-red-700 dark:text-red-300 px-3 py-2 text-xs font-semibold cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>学習進捗をリセット</span>
                </button>
                {progressNotice && (
                  <p
                    role="status"
                    aria-live="polite"
                    className={`text-xs font-medium ${
                      progressNotice.kind === 'err'
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {progressNotice.text}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Native modal <dialog> for destructive reset confirmation (no role="dialog"/aria-modal per HTML standard) */}
      <dialog
        ref={resetDialogRef}
        aria-labelledby={resetDialogTitleId}
        onClose={handleResetDialogClose}
        className="rounded-2xl p-6 shadow-2xl w-[min(92dvw,24rem)] space-y-4"
      >
        <h2 id={resetDialogTitleId} className="text-base font-bold">
          学習進捗をリセットしますか？
        </h2>
        <p className="text-xs sm:text-sm app-text-muted leading-relaxed">
          完了済みの単元および全演習問題の記録がこのブラウザから消去されます。必要に応じて先に「JSON保存」でバックアップしてください（配色テーマ設定は保持されます）。
        </p>
        <form method="dialog" className="flex flex-wrap justify-end gap-2 pt-2">
          <button
            type="submit"
            value="cancel"
            autoFocus
            className="interactive-btn app-surface rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
          >
            キャンセル
          </button>
          <button
            type="submit"
            value="reset"
            className="interactive-btn rounded-lg bg-red-700 text-white px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
          >
            進捗をリセットする
          </button>
        </form>
      </dialog>
    </header>
  );
};
