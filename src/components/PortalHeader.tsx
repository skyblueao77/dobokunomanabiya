import React, { useId } from 'react';
import { Compass, Menu, Monitor, Moon, Sun, SlidersHorizontal } from 'lucide-react';
import { LEARNING_UNITS, type UnitId } from '../data/curriculum';
import { type ThemePreference } from '../utils/storage';

interface PortalHeaderProps {
  activeRoute: 'home' | 'legal' | UnitId;
  onNavigate: (route: 'home' | UnitId) => void;
  themePref: ThemePreference;
  onChangeTheme: (pref: ThemePreference) => void;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  activeRoute,
  onNavigate,
  themePref,
  onChangeTheme,
}) => {
  const menuId = useId();
  const settingsId = useId();

  const closePopover = (id: string) => {
    const el = document.getElementById(id) as (HTMLElement & { hidePopover?: () => void }) | null;
    if (el?.hidePopover) {
      try {
        el.hidePopover();
      } catch {
        // Ignore if not open
      }
    }
  };

  const navItems: { id: 'home' | UnitId; label: string }[] = [
    { id: 'home', label: 'ポータル一覧' },
    ...LEARNING_UNITS.map((u) => ({
      id: u.id,
      label:
        u.id === 'mohr-circle'
          ? 'モールの応力円'
          : u.id === 'rankine-earth-pressure'
          ? 'ランキン土圧'
          : u.id === 'beam-sfd-bmd'
          ? '梁 SFD/BMD'
          : '開水路等流',
    })),
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--surface-card)]/95 text-[var(--text-primary)] backdrop-blur">
      <a href="#main-content" className="skip-link visually-hidden">
        メインコンテンツへスキップ
      </a>

      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('home');
          }}
          className="flex items-center gap-2 min-w-0 rounded-lg px-1 py-1"
        >
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white shadow-sm">
            <Compass className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm sm:text-base font-bold leading-tight truncate">
              土木の学び舎
            </span>
            <span className="hidden sm:block text-[11px] app-text-muted leading-tight truncate">
              土木工学インタラクティブ学習ポータル
            </span>
          </span>
        </a>

        {/* デスクトップ向けインラインナビゲーション */}
        <nav aria-label="主要ナビゲーション" className="hidden lg:flex items-center gap-1">
          <ul className="flex items-center gap-1 flex-wrap">
            {navItems.map((item) => {
              const isCurrent = activeRoute === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={item.id === 'home' ? '#/' : `#/unit/${item.id}`}
                    aria-current={isCurrent ? 'page' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(item.id);
                    }}
                    className="nav-link-item inline-flex items-center px-3 py-2 text-xs font-medium rounded-md hover:bg-[var(--surface-subtle)] transition-[background-color]"
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* 表示設定（3状態テーマ切替は設定ポップオーバー内に配置） */}
          <button
            type="button"
            popoverTarget={settingsId}
            popoverTargetAction="toggle"
            aria-controls={settingsId}
            aria-label="表示設定を開く"
            className="interactive-btn app-surface inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">表示設定</span>
          </button>

          <div
            id={settingsId}
            popover="auto"
            className="popover-panel app-surface rounded-xl p-4 shadow-xl w-72 max-w-[calc(100dvw-2rem)] m-auto"
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
                        ? 'border-blue-600 bg-blue-600/10'
                        : 'border-[var(--border-subtle)]'
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
            </div>
          </div>

          {/* モバイル・タブレット向けポップオーバーメニュー */}
          <button
            type="button"
            popoverTarget={menuId}
            popoverTargetAction="toggle"
            aria-controls={menuId}
            className="lg:hidden interactive-btn app-surface inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
            <span>メニュー</span>
          </button>

          <nav
            id={menuId}
            aria-label="モバイル単元メニュー"
            popover="auto"
            className="popover-panel app-surface rounded-xl p-3 shadow-xl w-72 max-w-[calc(100dvw-2rem)] m-auto"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 mb-2">
              <span className="text-sm font-bold">単元ナビゲーション</span>
              <button
                type="button"
                popoverTarget={menuId}
                popoverTargetAction="hide"
                className="text-xs app-text-muted px-2 py-1 cursor-pointer"
              >
                閉じる
              </button>
            </div>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isCurrent = activeRoute === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={item.id === 'home' ? '#/' : `#/unit/${item.id}`}
                      aria-current={isCurrent ? 'page' : undefined}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(item.id);
                        closePopover(menuId);
                      }}
                      className="nav-link-item flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-[var(--surface-subtle)]"
                    >
                      <span>{item.label}</span>
                      {isCurrent && <span className="text-xs">表示中</span>}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};
