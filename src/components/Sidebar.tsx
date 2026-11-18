import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Compass,
  FileText,
  Flame,
  Gem,
  GitCompare,
  Globe,
  Grid,
  Hash,
  HeartHandshake,
  HeartPulse,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Library,
  Orbit,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Table,
  Target,
  Timer,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { tr } from '../engine/i18n.ts';
import { NAV_CATEGORIES, navLabel, type NavCategory, type NavSubItem } from '../navigation/navConfig.ts';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Compass,
  BookOpen,
  Grid,
  BarChart3,
  Table,
  Sparkles,
  Star,
  Clock,
  Target,
  Layers,
  Calendar,
  Orbit,
  Sun,
  Timer,
  HeartHandshake,
  CalendarCheck,
  HelpCircle,
  Hash,
  Globe,
  Flame,
  Bot,
  FileText,
  Library,
  Settings,
  Gem,
  HeartPulse,
  ShieldCheck,
  GitCompare,
  Brain,
};

export const Sidebar: React.FC = () => {
  const {
    lang,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileNavOpen,
    setMobileNavOpen,
    expandedCatIds,
    toggleCatExpanded,
    expandAllCats,
    collapseAllCats,
    activeCat,
    activeSub,
    navigate,
    workflowProgress,
    toggleStepStatus,
    user,
    setAuthModalOpen,
  } = useApp();

  const [filterText, setFilterText] = useState('');
  const query = filterText.trim().toLowerCase();

  const workflowCats = useMemo(() => NAV_CATEGORIES.filter((c) => c.group === 'workflow'), []);
  const utilityCats = useMemo(() => NAV_CATEGORIES.filter((c) => c.group === 'utility'), []);
  const completedCount = useMemo(
    () => workflowCats.filter((c) => workflowProgress[c.code] === 'completed').length,
    [workflowCats, workflowProgress],
  );

  const filteredMatches = useMemo(() => {
    if (!query) return null;
    const out: { cat: NavCategory; sub: NavSubItem }[] = [];
    for (const cat of NAV_CATEGORIES) {
      const catMatch =
        cat.labelEn.toLowerCase().includes(query) ||
        cat.labelTe.toLowerCase().includes(query) ||
        cat.labelHi.toLowerCase().includes(query) ||
        cat.code.toLowerCase().includes(query);
      for (const sub of cat.items) {
        const subMatch =
          catMatch ||
          sub.labelEn.toLowerCase().includes(query) ||
          sub.labelTe.toLowerCase().includes(query) ||
          sub.labelHi.toLowerCase().includes(query) ||
          sub.keywords.some((k) => k.includes(query));
        if (subMatch) out.push({ cat, sub });
      }
    }
    return out;
  }, [query]);

  const handleCatRowClick = (cat: NavCategory) => {
    if (!expandedCatIds.includes(cat.id)) {
      toggleCatExpanded(cat.id);
    }
    navigate(cat.catSlug, cat.defaultSubSlug);
  };

  const renderCategoryItem = (cat: NavCategory, collapsed: boolean) => {
    const Icon = ICON_MAP[cat.icon] || Compass;
    const isCatActive = activeCat.id === cat.id;
    const isExpanded = expandedCatIds.includes(cat.id);
    const isWorkflow = cat.group === 'workflow';
    const isDone = isWorkflow && workflowProgress[cat.code] === 'completed';

    if (collapsed) {
      return (
        <button
          key={cat.id}
          type="button"
          title={`${cat.code}. ${navLabel(cat, lang)}`}
          onClick={() => navigate(cat.catSlug, cat.defaultSubSlug)}
          className={`w-full flex items-center justify-center p-2 rounded-md transition-colors relative ${
            isCatActive
              ? 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {isDone && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
        </button>
      );
    }

    return (
      <div key={cat.id} className="space-y-0.5">
        <div
          className={`flex items-center justify-between rounded-md transition-colors ${
            isCatActive
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
          }`}
        >
          <button
            type="button"
            onClick={() => handleCatRowClick(cat)}
            className="flex flex-1 items-center gap-1.5 px-2 py-1.5 text-left text-xs min-w-0"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
            <span className="font-mono text-[10px] opacity-65 shrink-0">{cat.code}.</span>
            <span className="truncate">{navLabel(cat, lang)}</span>
          </button>
          <div className="flex items-center shrink-0">
            {isWorkflow && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void toggleStepStatus(cat.code);
                }}
                title={
                  isDone
                    ? lang === 'te' ? 'పూర్తయింది (మార్చడానికి క్లిక్ చేయండి)' : 'Completed (click to toggle)'
                    : lang === 'te' ? 'పూర్తయినట్లు గుర్తుపెట్టు' : 'Mark completed'
                }
                aria-label={`Toggle completion for ${cat.labelEn}`}
                className={`p-1 rounded transition-colors ${
                  isDone
                    ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
                    : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleCatExpanded(cat.id);
              }}
              aria-label={isExpanded ? `Collapse ${cat.labelEn}` : `Expand ${cat.labelEn}`}
              className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 shrink-0"
            >
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="ml-4 pl-2 border-l border-slate-200 dark:border-slate-800 space-y-0.5 py-0.5">
            {cat.items.map((sub) => {
              const isSubActive = isCatActive && activeSub.id === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => navigate(cat.catSlug, sub.subSlug)}
                  className={`w-full text-left px-2 py-1 rounded text-[11.5px] truncate transition-colors ${
                    isSubActive
                      ? 'bg-amber-600 text-white font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {navLabel(sub, lang)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderSidebarBody = (isMobile: boolean) => {
    const collapsed = !isMobile && sidebarCollapsed;

    return (
      <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
        {/* Brand Row */}
        <div className="flex h-14 items-center justify-between px-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          {!collapsed ? (
            <button
              type="button"
              onClick={() => navigate('dashboard', 'overview')}
              className="flex items-center gap-2.5 text-left min-w-0 focus-visible:outline-2 focus-visible:outline-amber-600 rounded"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-600 text-white text-xs font-bold">
                ॐ
              </span>
              <span className="font-bold tracking-tight text-sm text-slate-900 dark:text-slate-100 truncate whitespace-nowrap">
                {tr(lang, 'appName')}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('dashboard', 'overview')}
              title="ASTROJYOTISH PRO"
              className="mx-auto flex h-8 w-8 items-center justify-center rounded-md bg-amber-600 text-white text-xs font-bold"
            >
              ॐ
            </button>
          )}

          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
              className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Navigation Search & Expand Controls */}
        {!collapsed && (
          <div className="p-2.5 space-y-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder={tr(lang, 'navSearchPlaceholder')}
                className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-600"
              />
              {filterText && (
                <button
                  type="button"
                  onClick={() => setFilterText('')}
                  aria-label="Clear filter"
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
              <span className="tabular-nums">
                {lang === 'te' ? `21 దశలు (${completedCount}/21)` : `21 Steps (${completedCount}/21)`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandAllCats}
                  className="hover:text-amber-700 dark:hover:text-amber-400 whitespace-nowrap"
                >
                  {tr(lang, 'expandAll')}
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={collapseAllCats}
                  className="hover:text-amber-700 dark:hover:text-amber-400 whitespace-nowrap"
                >
                  {tr(lang, 'collapseAll')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Nav Items */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5" aria-label="Primary Astrology Modules">
          {filteredMatches ? (
            <div className="space-y-1">
              {filteredMatches.length === 0 ? (
                <p className="px-2 py-4 text-xs text-slate-500">
                  {lang === 'te' ? 'సరిపోయే విభాగాలు కనబడలేదు.' : 'No matching modules found.'}
                </p>
              ) : (
                filteredMatches.slice(0, 60).map(({ cat, sub }) => {
                  const isActive = activeCat.id === cat.id && activeSub.id === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        navigate(cat.catSlug, sub.subSlug);
                        setFilterText('');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                        isActive
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-medium'
                          : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="truncate font-medium">{navLabel(sub, lang)}</div>
                      <div className="truncate text-[10px] text-slate-400">
                        {cat.code}. {navLabel(cat, lang)}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <>
              {!collapsed && (
                <div className="px-2 pt-1 pb-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                  {lang === 'te' ? '01–21 విశ్లేషణ క్రమం' : lang === 'hi' ? '01–21 विश्लेषण क्रम' : '01–21 Analysis Workflow'}
                </div>
              )}
              {workflowCats.map((cat) => renderCategoryItem(cat, collapsed))}

              <div className="my-2.5 border-t border-slate-200 dark:border-slate-800" />
              {!collapsed && (
                <div className="px-2 pb-1.5 text-[10px] font-semibold text-slate-400">
                  {lang === 'te' ? 'కార్యక్షేత్రం & అదనపు శాస్త్రాలు' : lang === 'hi' ? 'कार्यक्षेत्र और अतिरिक्त मॉड्यूल' : 'Workspace & Utilities'}
                </div>
              )}
              {utilityCats.map((cat) => renderCategoryItem(cat, collapsed))}
            </>
          )}
        </nav>

        {/* Footer Shortcuts & User */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-2 shrink-0 space-y-1">
          {!collapsed ? (
            <>
              <div className="flex items-center justify-between gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => navigate('settings', 'preferences')}
                  className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 whitespace-nowrap"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>{tr(lang, 'settings')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('knowledge', 'encyclopedia')}
                  className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 whitespace-nowrap"
                >
                  <Library className="h-3.5 w-3.5" />
                  <span>{tr(lang, 'helpDocs')}</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-amber-500/60"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                    {user?.name || (lang === 'te' ? 'కార్యక్షేత్ర వినియోగదారు' : 'Workspace User')}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {user?.role || 'user'} · {user?.planId || 'pro'}
                  </div>
                </div>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => navigate('settings', 'preferences')}
              title={tr(lang, 'settings')}
              className="w-full flex items-center justify-center p-2 rounded-md text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sticky Rail */}
      <aside
        className={`hidden lg:block shrink-0 h-screen sticky top-0 transition-[width] duration-150 print:hidden ${
          sidebarCollapsed ? 'w-16' : 'w-[280px]'
        }`}
      >
        {renderSidebarBody(false)}
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex print:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-[290px] max-w-[85vw] h-full">
            {renderSidebarBody(true)}
          </div>
        </div>
      )}
    </>
  );
};
