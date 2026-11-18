import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Menu, Monitor, Moon, Plus, Search, Sun, User, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { NAK_NAMES, sName } from '../engine/constants.ts';
import { tr } from '../engine/i18n.ts';
import { GLOSSARY_TERMS } from '../engine/knowledge.ts';
import { computeChart } from '../engine/parashari.ts';
import type { Language } from '../engine/types.ts';
import { ALL_VARGAS } from '../engine/vargas.ts';
import { NAV_CATEGORIES, navLabel } from '../navigation/navConfig.ts';

interface FlatSearchAction {
  key: string;
  run: () => void;
}

export const Header: React.FC = () => {
  const {
    lang,
    setLang,
    theme,
    setTheme,
    profiles,
    activeProfile,
    setActiveProfileId,
    calcConfig,
    openProfileModal,
    setMobileNavOpen,
    navigate,
    knowledgeArticles,
    savedReports,
    setSelectedReportType,
    notifications,
    markNotificationRead,
    user,
    setAuthModalOpen,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const globalResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return {
        modules: [] as { catSlug: string; subSlug: string; title: string; parent: string }[],
        profiles: [] as {
          id: string;
          name: string;
          place: string;
          birthStr: string;
          lagna: string;
          moonRashi: string;
          nakshatra: string;
        }[],
        vargas: [] as { code: string; subSlug: string; title: string; domain: string }[],
        reports: [] as { id: string; title: string; reportType: string; depth: string }[],
        knowledge: [] as { key: string; title: string; sub: string; subSlug: 'encyclopedia' | 'glossary' }[],
      };
    }

    const modules: { catSlug: string; subSlug: string; title: string; parent: string }[] = [];
    for (const c of NAV_CATEGORIES) {
      for (const s of c.items) {
        if (
          s.labelEn.toLowerCase().includes(q) ||
          s.labelTe.toLowerCase().includes(q) ||
          s.labelHi.toLowerCase().includes(q) ||
          c.labelEn.toLowerCase().includes(q) ||
          c.labelTe.toLowerCase().includes(q) ||
          s.keywords.some((k) => k.includes(q))
        ) {
          modules.push({ catSlug: c.catSlug, subSlug: s.subSlug, title: navLabel(s, lang), parent: navLabel(c, lang) });
        }
      }
    }

    const matchedProfiles = profiles
      .filter((p) => {
        if (p.isArchived) return false;
        const tagsStr = (p.tags || []).join(' ').toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.place.toLowerCase().includes(q) ||
          String(p.y).includes(q) ||
          (p.notes || '').toLowerCase().includes(q) ||
          tagsStr.includes(q)
        );
      })
      .slice(0, 6)
      .map((p) => {
        const c = computeChart({ ...p, ay: calcConfig.ay }, calcConfig);
        return {
          id: p.id,
          name: p.name,
          place: p.place,
          birthStr: `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')} ${String(p.hh).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}`,
          lagna: sName(c.lagS, lang),
          moonRashi: sName(c.s[1], lang),
          nakshatra: NAK_NAMES[lang]?.[c.pan.nk] || NAK_NAMES.en[c.pan.nk],
        };
      });

    const matchedVargas = ALL_VARGAS.filter(
      (v) =>
        v.code.toLowerCase().includes(q) ||
        v.nameEn.toLowerCase().includes(q) ||
        v.nameTe.toLowerCase().includes(q) ||
        v.domainEn.toLowerCase().includes(q) ||
        v.domainTe.toLowerCase().includes(q),
    )
      .slice(0, 6)
      .map((v) => ({
        code: v.code,
        subSlug: v.code.toLowerCase(),
        title: `${v.code} · ${lang === 'te' ? v.nameTe : v.nameEn}`,
        domain: lang === 'te' ? v.domainTe : v.domainEn,
      }));

    const matchedReports = savedReports
      .filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.report_type.toLowerCase().includes(q) ||
          r.depth.toLowerCase().includes(q),
      )
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        title: r.title,
        reportType: r.report_type,
        depth: r.depth,
      }));

    const matchedArticles = knowledgeArticles
      .filter(
        (a) =>
          a.titleEn.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.sub.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .slice(0, 4)
      .map((a) => ({
        key: `art-${a.id}`,
        title: lang === 'te' ? a.title : a.titleEn,
        sub: lang === 'te' ? a.cat : a.catEn,
        subSlug: 'encyclopedia' as const,
      }));

    const matchedGlossary = GLOSSARY_TERMS.filter(
      (g) =>
        g.sanskrit.toLowerCase().includes(q) ||
        g.te.toLowerCase().includes(q) ||
        g.en.toLowerCase().includes(q),
    )
      .slice(0, 4)
      .map((g) => ({
        key: `gl-${g.sanskrit}`,
        title: g.sanskrit,
        sub: lang === 'te' ? g.te : g.en,
        subSlug: 'glossary' as const,
      }));

    return {
      modules: modules.slice(0, 7),
      profiles: matchedProfiles,
      vargas: matchedVargas,
      reports: matchedReports,
      knowledge: [...matchedArticles, ...matchedGlossary].slice(0, 6),
    };
  }, [searchQuery, lang, profiles, calcConfig, savedReports, knowledgeArticles]);

  const flatActions = useMemo<FlatSearchAction[]>(() => {
    const out: FlatSearchAction[] = [];
    for (const p of globalResults.profiles) {
      out.push({
        key: `prof-${p.id}`,
        run: () => {
          setActiveProfileId(p.id);
          navigate('horoscope', 'complete-chart');
        },
      });
    }
    for (const m of globalResults.modules) {
      out.push({
        key: `mod-${m.catSlug}-${m.subSlug}`,
        run: () => navigate(m.catSlug, m.subSlug),
      });
    }
    for (const v of globalResults.vargas) {
      out.push({
        key: `varga-${v.code}`,
        run: () => navigate('divisional-charts', v.subSlug),
      });
    }
    for (const r of globalResults.reports) {
      out.push({
        key: `rep-${r.id}`,
        run: () => {
          setSelectedReportType(r.reportType);
          navigate('reports', 'saved-reports');
        },
      });
    }
    for (const k of globalResults.knowledge) {
      out.push({
        key: k.key,
        run: () => navigate('knowledge', k.subSlug),
      });
    }
    return out;
  }, [globalResults, navigate, setActiveProfileId, setSelectedReportType]);

  useEffect(() => {
    setHighlightIdx(0);
  }, [searchQuery]);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchFocused(false);
      searchInputRef.current?.blur();
      return;
    }
    if (!flatActions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => (i + 1) % flatActions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => (i - 1 + flatActions.length) % flatActions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = flatActions[highlightIdx] || flatActions[0];
      if (target) {
        target.run();
        setSearchQuery('');
        setSearchFocused(false);
      }
    }
  };

  const hasAnyResult = flatActions.length > 0;
  let runningIdx = -1;

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-3 lg:px-5 flex items-center justify-between gap-4 print:hidden">
      {/* Zone 1: Mobile Menu + Global Search */}
      <div className="flex items-center gap-2.5 flex-1 max-w-lg min-w-0">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label={lang === 'te' ? 'మెనూ తెరువు' : 'Open menu'}
          className="lg:hidden p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="relative flex-1 min-w-0">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchFocused(true);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder={`${tr(lang, 'searchPlaceholder')} (⌘K)`}
            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-8 pr-8 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-600"
          />
          {searchQuery && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              aria-label={tr(lang, 'clearSearch')}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {searchFocused && searchQuery.trim() && (
            <div className="absolute left-0 right-0 mt-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg max-h-[26rem] overflow-y-auto z-50 divide-y divide-slate-100 dark:divide-slate-800">
              {!hasAnyResult ? (
                <div className="p-3.5 text-xs text-slate-500">{tr(lang, 'searchNoResults')}</div>
              ) : (
                <>
                  {globalResults.profiles.length > 0 && (
                    <div className="p-1.5">
                      <div className="px-2 py-1 text-[10px] font-semibold text-slate-400">
                        {tr(lang, 'searchCategoryProfiles')}
                      </div>
                      {globalResults.profiles.map((p) => {
                        runningIdx += 1;
                        const active = highlightIdx === runningIdx;
                        return (
                          <div
                            key={p.id}
                            className={`px-2 py-1.5 rounded text-xs flex items-center justify-between gap-2 ${
                              active ? 'bg-amber-50 dark:bg-amber-950/40' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <button
                              type="button"
                              onMouseDown={() => {
                                setActiveProfileId(p.id);
                                navigate('horoscope', 'complete-chart');
                                setSearchQuery('');
                                setSearchFocused(false);
                              }}
                              className="flex-1 text-left min-w-0"
                            >
                              <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                {p.name} <span className="text-[10px] font-normal text-slate-400">· {p.place}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate tabular-nums">
                                {p.birthStr} · {tr(lang, 'lagna')}: {p.lagna} · {tr(lang, 'rashi')}: {p.moonRashi} · {p.nakshatra}
                              </div>
                            </button>
                            <button
                              type="button"
                              onMouseDown={() => {
                                setActiveProfileId(p.id);
                                navigate('reports', 'complete-horoscope');
                                setSearchQuery('');
                                setSearchFocused(false);
                              }}
                              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 whitespace-nowrap shrink-0"
                            >
                              {tr(lang, 'openReports')}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {globalResults.modules.length > 0 && (
                    <div className="p-1.5">
                      <div className="px-2 py-1 text-[10px] font-semibold text-slate-400">
                        {tr(lang, 'searchCategoryPages')}
                      </div>
                      {globalResults.modules.map((m) => {
                        runningIdx += 1;
                        const active = highlightIdx === runningIdx;
                        return (
                          <button
                            key={`${m.catSlug}-${m.subSlug}`}
                            type="button"
                            onMouseDown={() => {
                              navigate(m.catSlug, m.subSlug);
                              setSearchQuery('');
                              setSearchFocused(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between gap-2 ${
                              active ? 'bg-amber-50 dark:bg-amber-950/40' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{m.title}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">{m.parent}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {globalResults.vargas.length > 0 && (
                    <div className="p-1.5">
                      <div className="px-2 py-1 text-[10px] font-semibold text-slate-400">
                        {tr(lang, 'searchCategoryVargas')}
                      </div>
                      {globalResults.vargas.map((v) => {
                        runningIdx += 1;
                        const active = highlightIdx === runningIdx;
                        return (
                          <button
                            key={v.code}
                            type="button"
                            onMouseDown={() => {
                              navigate('divisional-charts', v.subSlug);
                              setSearchQuery('');
                              setSearchFocused(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between gap-2 ${
                              active ? 'bg-amber-50 dark:bg-amber-950/40' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{v.title}</span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[140px]">{v.domain}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {globalResults.reports.length > 0 && (
                    <div className="p-1.5">
                      <div className="px-2 py-1 text-[10px] font-semibold text-slate-400">
                        {tr(lang, 'searchCategoryReports')}
                      </div>
                      {globalResults.reports.map((r) => {
                        runningIdx += 1;
                        const active = highlightIdx === runningIdx;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onMouseDown={() => {
                              setSelectedReportType(r.reportType);
                              navigate('reports', 'saved-reports');
                              setSearchQuery('');
                              setSearchFocused(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between gap-2 ${
                              active ? 'bg-amber-50 dark:bg-amber-950/40' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{r.title}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">{r.depth}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {globalResults.knowledge.length > 0 && (
                    <div className="p-1.5">
                      <div className="px-2 py-1 text-[10px] font-semibold text-slate-400">
                        {tr(lang, 'searchCategoryKnowledge')}
                      </div>
                      {globalResults.knowledge.map((k) => {
                        runningIdx += 1;
                        const active = highlightIdx === runningIdx;
                        return (
                          <button
                            key={k.key}
                            type="button"
                            onMouseDown={() => {
                              navigate('knowledge', k.subSlug);
                              setSearchQuery('');
                              setSearchFocused(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded text-xs ${
                              active ? 'bg-amber-50 dark:bg-amber-950/40' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="font-medium text-slate-900 dark:text-slate-100 truncate">{k.title}</div>
                            <div className="text-[10px] text-slate-400 truncate">{k.sub}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Zone 2: Active Birth Profile Selector */}
      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
        <select
          aria-label={tr(lang, 'activeProfile')}
          value={activeProfile.id}
          onChange={(e) => setActiveProfileId(e.target.value)}
          className="max-w-[180px] rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-600"
        >
          {profiles
            .filter((p) => !p.isArchived)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
        <button
          type="button"
          onClick={() => openProfileModal('create')}
          title={tr(lang, 'newProfile')}
          className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Zone 3: Language, Theme, Notifications & Account */}
      <div className="flex items-center gap-1.5 shrink-0">
        <select
          aria-label={lang === 'te' ? 'భాష' : 'Language'}
          value={lang}
          onChange={(e) => setLang(e.target.value as Language)}
          className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200"
        >
          <option value="te">తెలుగు</option>
          <option value="en">EN</option>
          <option value="hi">हिन्दी</option>
        </select>

        <button
          type="button"
          onClick={cycleTheme}
          title={`${lang === 'te' ? 'థీమ్' : 'Theme'}: ${theme}`}
          aria-label={`Switch theme (current: ${theme})`}
          className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {theme === 'light' ? (
            <Sun className="h-3.5 w-3.5" />
          ) : theme === 'dark' ? (
            <Moon className="h-3.5 w-3.5" />
          ) : (
            <Monitor className="h-3.5 w-3.5" />
          )}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label={lang === 'te' ? 'సూచనలు' : 'Notifications'}
            className="relative p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center"
          >
            <Bell className="h-3.5 w-3.5" />
            {unreadCount > 0 && (
              <span className="ml-0.5 text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-1.5 w-72 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-50 p-2 space-y-1.5">
              <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {lang === 'te' ? 'సూచనలు' : lang === 'hi' ? 'सूचनाएँ' : 'Notifications'}
                </span>
                <button
                  type="button"
                  onClick={() => setNotifOpen(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {tr(lang, 'close')}
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="px-2 py-3 text-xs text-slate-500">
                  {lang === 'te' ? 'కొత్త సూచనలు లేవు.' : 'No notifications.'}
                </p>
              ) : (
                notifications.slice(0, 6).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => void markNotificationRead(n.id)}
                    className={`w-full text-left p-2 rounded-md text-xs transition-colors ${
                      n.read ? 'opacity-65' : 'bg-amber-50/70 dark:bg-amber-950/30'
                    } hover:bg-slate-100 dark:hover:bg-slate-800`}
                  >
                    <div className="font-medium text-slate-900 dark:text-slate-100">{n.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setAuthModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900 dark:bg-amber-600 text-white text-xs font-medium hover:opacity-90 whitespace-nowrap shrink-0"
        >
          <User className="h-3.5 w-3.5" />
          <span className="hidden md:inline">{user ? user.name.split(' ')[0] : tr(lang, 'signIn')}</span>
        </button>
      </div>
    </header>
  );
};
