import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { tr } from '../engine/i18n.ts';
import type { KnowledgeArticle } from '../engine/knowledge.ts';
import { KNOWLEDGE_ARTICLES } from '../engine/knowledge.ts';
import { DEFAULT_CONFIG, computeChart } from '../engine/parashari.ts';
import type { BirthProfile, CalcConfig, ChartStyle, ComputedChart, Language } from '../engine/types.ts';
import { NAV_CATEGORIES, navLabel, resolveNavRoute, type NavCategory, type NavSubItem } from '../navigation/navConfig.ts';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'astrologer' | 'admin';
  planId: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: number;
  created_at: string;
}

export interface BookmarkItem {
  id: string;
  item_type: string;
  item_id: string;
  title: string;
  meta: string;
}

export interface SavedReportSummary {
  id: string;
  profile_id: string;
  report_type: string;
  title: string;
  depth: string;
  language: string;
  created_at: string;
  updated_at: string;
}

const FALLBACK_PROFILE: BirthProfile = {
  id: 'prof-rama',
  name: 'Sri Rama Rao',
  gender: 'male',
  y: 1990,
  m: 5,
  d: 14,
  hh: 6,
  mi: 42,
  ss: 0,
  lat: 17.385,
  lon: 78.4867,
  tz: 5.5,
  ay: 1,
  place: 'Hyderabad, Telangana',
  timezoneId: 'Asia/Kolkata',
  birthTimeKnown: true,
  isDefault: true,
};

function parseRouteFromUrl(): { catSlug: string; subSlug: string } {
  const path = window.location.pathname;
  const m = path.match(/^\/m\/([^/]+)(?:\/([^/]+))?/);
  if (m) return { catSlug: m[1], subSlug: m[2] || '' };
  return { catSlug: 'dashboard', subSlug: 'overview' };
}

interface AppContextValue {
  user: UserAccount | null;
  profiles: BirthProfile[];
  activeProfile: BirthProfile;
  setActiveProfileId: (id: string) => void;
  updateActiveProfileLive: (patch: Partial<BirthProfile>) => void;
  workflowProgress: Record<string, 'pending' | 'completed'>;
  setStepStatus: (stepId: string, status: 'pending' | 'completed') => Promise<void>;
  toggleStepStatus: (stepId: string) => Promise<void>;
  chart: ComputedChart;
  calcConfig: CalcConfig;
  updateCalcConfig: (patch: Partial<CalcConfig>) => void;
  chartStyle: ChartStyle;
  setChartStyle: (s: ChartStyle) => void;
  lang: Language;
  setLang: (l: Language) => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;
  expandedCatIds: string[];
  toggleCatExpanded: (catId: string) => void;
  expandAllCats: () => void;
  collapseAllCats: () => void;
  activeCat: NavCategory;
  activeSub: NavSubItem;
  navigate: (catSlug: string, subSlug?: string) => void;
  refreshProfiles: () => Promise<void>;
  saveProfile: (data: Partial<BirthProfile>, existingId?: string) => Promise<BirthProfile | null>;
  deleteProfile: (id: string) => Promise<void>;
  profileModal: { open: boolean; mode: 'create' | 'edit' | 'import'; target?: BirthProfile | null };
  openProfileModal: (mode: 'create' | 'edit' | 'import', target?: BirthProfile | null) => void;
  closeProfileModal: () => void;
  authModalOpen: boolean;
  setAuthModalOpen: (v: boolean) => void;
  refreshAuth: () => Promise<void>;
  knowledgeArticles: KnowledgeArticle[];
  refreshKnowledge: () => Promise<void>;
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => Promise<void>;
  bookmarks: BookmarkItem[];
  toggleBookmark: (itemType: string, itemId: string, title: string, meta?: string) => Promise<void>;
  savedReports: SavedReportSummary[];
  refreshReports: () => Promise<void>;
  aiInitialPrompt: string | null;
  setAiInitialPrompt: (p: string | null) => void;
  selectedReportType: string | null;
  setSelectedReportType: (r: string | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialRoute = parseRouteFromUrl();
  const resolvedInit = resolveNavRoute(initialRoute.catSlug, initialRoute.subSlug);

  const [user, setUser] = useState<UserAccount | null>(null);
  const [profiles, setProfiles] = useState<BirthProfile[]>([FALLBACK_PROFILE]);
  const [activeProfileId, setActiveProfileIdState] = useState<string>(
    () => localStorage.getItem('ajp_active_profile') || FALLBACK_PROFILE.id,
  );
  const [calcConfig, setCalcConfig] = useState<CalcConfig>(() => {
    try {
      const saved = localStorage.getItem('ajp_calc_config');
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });
  const [chartStyle, setChartStyleState] = useState<ChartStyle>(
    () => (localStorage.getItem('ajp_chart_style') as ChartStyle) || 'south',
  );
  const [lang, setLangState] = useState<Language>(
    () => (localStorage.getItem('ajp_lang') as Language) || 'te',
  );
  const [theme, setThemeState] = useState<ThemeMode>(
    () => (localStorage.getItem('ajp_theme') as ThemeMode) || 'light',
  );
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(
    () => localStorage.getItem('ajp_sidebar_collapsed') === '1',
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [expandedCatIds, setExpandedCatIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('ajp_expanded_cats');
      const parsed = raw ? (JSON.parse(raw) as string[]) : [resolvedInit.cat.id];
      if (!parsed.includes(resolvedInit.cat.id)) parsed.push(resolvedInit.cat.id);
      return parsed;
    } catch {
      return [resolvedInit.cat.id];
    }
  });

  const [activeCat, setActiveCat] = useState<NavCategory>(resolvedInit.cat);
  const [activeSub, setActiveSub] = useState<NavSubItem>(resolvedInit.sub);
  const [workflowProgress, setWorkflowProgress] = useState<Record<string, 'pending' | 'completed'>>({});
  const liveSaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [profileModal, setProfileModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit' | 'import';
    target?: BirthProfile | null;
  }>({ open: false, mode: 'create', target: null });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>(KNOWLEDGE_ARTICLES);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReportSummary[]>([]);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<string | null>(null);

  // Sync <html lang> and localized page <title>
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `${navLabel(activeSub, lang)} · ${tr(lang, 'appName')}`;
  }, [lang, activeSub]);

  // Apply theme to <html>
  useEffect(() => {
    const apply = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
      document.documentElement.classList.toggle('dark', isDark);
    };
    apply();
    localStorage.setItem('ajp_theme', theme);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => theme === 'system' && apply();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  // Listen to browser back/forward
  useEffect(() => {
    const onPop = () => {
      const r = parseRouteFromUrl();
      const { cat, sub } = resolveNavRoute(r.catSlug, r.subSlug);
      setActiveCat(cat);
      setActiveSub(sub);
      setExpandedCatIds((prev) => (prev.includes(cat.id) ? prev : [...prev, cat.id]));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const persistSettingsToServer = useCallback(async (patch: Record<string, unknown>) => {
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
    } catch {
      // Offline/local state already saved in localStorage
    }
  }, []);

  const refreshProfiles = useCallback(async () => {
    try {
      const res = await fetch('/api/profiles');
      if (!res.ok) return;
      const data = (await res.json()) as { profiles: BirthProfile[] };
      if (data.profiles?.length) {
        setProfiles(data.profiles);
        setActiveProfileIdState((curr) => {
          if (data.profiles.some((p) => p.id === curr && !p.isArchived)) return curr;
          const def = data.profiles.find((p) => p.isDefault && !p.isArchived) || data.profiles[0];
          localStorage.setItem('ajp_active_profile', def.id);
          return def.id;
        });
      }
    } catch {
      // Keep local fallback
    }
  }, []);

  const refreshKnowledge = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge');
      if (!res.ok) return;
      const data = (await res.json()) as { articles: KnowledgeArticle[] };
      if (data.articles?.length) setKnowledgeArticles(data.articles);
    } catch {
      // Keep static fallback
    }
  }, []);

  const refreshReports = useCallback(async () => {
    try {
      const res = await fetch('/api/reports');
      if (!res.ok) return;
      const data = (await res.json()) as { reports: SavedReportSummary[] };
      setSavedReports(data.reports || []);
    } catch {
      // Ignore
    }
  }, []);

  const refreshAuxData = useCallback(async () => {
    try {
      const [nRes, bRes, rRes] = await Promise.all([
        fetch('/api/notifications'),
        fetch('/api/bookmarks'),
        fetch('/api/reports'),
      ]);
      if (nRes.ok) {
        const nd = (await nRes.json()) as { notifications: NotificationItem[] };
        setNotifications(nd.notifications || []);
      }
      if (bRes.ok) {
        const bd = (await bRes.json()) as { bookmarks: BookmarkItem[] };
        setBookmarks(bd.bookmarks || []);
      }
      if (rRes.ok) {
        const rd = (await rRes.json()) as { reports: SavedReportSummary[] };
        setSavedReports(rd.reports || []);
      }
    } catch {
      // Ignore
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) return;
      const data = (await res.json()) as {
        user: UserAccount | null;
        settings: Record<string, unknown> | null;
      };
      setUser(data.user);
      if (data.settings) {
        const s = data.settings;
        const storedLang = localStorage.getItem('ajp_lang') as Language | null;
        const serverLang = typeof s.lang === 'string' ? (s.lang as Language) : null;
        if (!storedLang && serverLang && serverLang !== 'en') {
          setLangState(serverLang);
        }
        setCalcConfig((prev) => ({
          ...prev,
          ay: Number(s.ay ?? prev.ay),
          sidereal: s.sidereal !== undefined ? Boolean(s.sidereal) : prev.sidereal,
          houseSystem: (s.house_system as CalcConfig['houseSystem']) || prev.houseSystem,
          nodeType: (s.node_type as CalcConfig['nodeType']) || prev.nodeType,
          kpMode: (s.kp_mode as CalcConfig['kpMode']) || prev.kpMode,
          karakaMode: (s.karaka_mode as CalcConfig['karakaMode']) || prev.karakaMode,
          calendarSystem: (s.calendar_system as CalcConfig['calendarSystem']) || prev.calendarSystem,
        }));
      }
      await Promise.all([refreshProfiles(), refreshAuxData()]);
    } catch {
      // Ignore
    }
  }, [refreshProfiles, refreshAuxData]);

  useEffect(() => {
    void refreshAuth();
    void refreshKnowledge();
  }, [refreshAuth, refreshKnowledge]);

  const setActiveProfileId = useCallback((id: string) => {
    setActiveProfileIdState(id);
    localStorage.setItem('ajp_active_profile', id);
  }, []);

  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeProfileId) || profiles[0] || FALLBACK_PROFILE;
  }, [profiles, activeProfileId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/workflow/${encodeURIComponent(activeProfile.id)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { steps?: Record<string, 'pending' | 'completed'> };
        if (!cancelled && data.steps) {
          setWorkflowProgress(data.steps);
        }
      } catch {
        // Keep current state offline
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeProfile.id]);

  const setStepStatus = useCallback(
    async (stepId: string, status: 'pending' | 'completed') => {
      setWorkflowProgress((prev) => ({ ...prev, [stepId]: status }));
      try {
        await fetch(`/api/workflow/${encodeURIComponent(activeProfile.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stepId, status }),
        });
      } catch {
        // Ignore offline error
      }
    },
    [activeProfile.id],
  );

  const toggleStepStatus = useCallback(
    async (stepId: string) => {
      const next: 'pending' | 'completed' = workflowProgress[stepId] === 'completed' ? 'pending' : 'completed';
      await setStepStatus(stepId, next);
    },
    [workflowProgress, setStepStatus],
  );

  const updateActiveProfileLive = useCallback(
    (patch: Partial<BirthProfile>) => {
      const targetId = activeProfile.id;
      const merged: BirthProfile = { ...activeProfile, ...patch };
      setProfiles((prev) => {
        const idx = prev.findIndex((p) => p.id === targetId);
        if (idx === -1) return [merged, ...prev];
        const next = [...prev];
        next[idx] = merged;
        return next;
      });
      if (liveSaveTimerRef.current) clearTimeout(liveSaveTimerRef.current);
      liveSaveTimerRef.current = setTimeout(async () => {
        try {
          await fetch(`/api/profiles/${encodeURIComponent(targetId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(merged),
          });
        } catch {
          // Local reactive state remains intact
        }
      }, 400);
    },
    [activeProfile],
  );

  const chart = useMemo(() => {
    return computeChart({ ...activeProfile, ay: calcConfig.ay }, calcConfig);
  }, [activeProfile, calcConfig]);

  const updateCalcConfig = useCallback(
    (patch: Partial<CalcConfig>) => {
      setCalcConfig((prev) => {
        const next = { ...prev, ...patch };
        localStorage.setItem('ajp_calc_config', JSON.stringify(next));
        void persistSettingsToServer({
          ay: next.ay,
          sidereal: next.sidereal,
          houseSystem: next.houseSystem,
          nodeType: next.nodeType,
          kpMode: next.kpMode,
          karakaMode: next.karakaMode,
          calendarSystem: next.calendarSystem,
        });
        return next;
      });
    },
    [persistSettingsToServer],
  );

  const setChartStyle = useCallback(
    (s: ChartStyle) => {
      setChartStyleState(s);
      localStorage.setItem('ajp_chart_style', s);
      void persistSettingsToServer({ chartStyle: s });
    },
    [persistSettingsToServer],
  );

  const setLang = useCallback(
    (l: Language) => {
      setLangState(l);
      localStorage.setItem('ajp_lang', l);
      void persistSettingsToServer({ lang: l });
    },
    [persistSettingsToServer],
  );

  const setTheme = useCallback(
    (t: ThemeMode) => {
      setThemeState(t);
      localStorage.setItem('ajp_theme', t);
      void persistSettingsToServer({ theme: t });
    },
    [persistSettingsToServer],
  );

  const setSidebarCollapsed = useCallback(
    (v: boolean) => {
      setSidebarCollapsedState(v);
      localStorage.setItem('ajp_sidebar_collapsed', v ? '1' : '0');
      void persistSettingsToServer({ sidebarCollapsed: v });
    },
    [persistSettingsToServer],
  );

  const toggleCatExpanded = useCallback((catId: string) => {
    setExpandedCatIds((prev) => {
      const next = prev.includes(catId) ? prev.filter((x) => x !== catId) : [...prev, catId];
      localStorage.setItem('ajp_expanded_cats', JSON.stringify(next));
      return next;
    });
  }, []);

  const expandAllCats = useCallback(() => {
    const all = NAV_CATEGORIES.map((c) => c.id);
    setExpandedCatIds(all);
    localStorage.setItem('ajp_expanded_cats', JSON.stringify(all));
  }, []);

  const collapseAllCats = useCallback(() => {
    setExpandedCatIds([]);
    localStorage.setItem('ajp_expanded_cats', JSON.stringify([]));
  }, []);

  const navigate = useCallback((catSlug: string, subSlug?: string) => {
    const { cat, sub } = resolveNavRoute(catSlug, subSlug);
    setActiveCat(cat);
    setActiveSub(sub);
    setExpandedCatIds((prev) => {
      const next = prev.includes(cat.id) ? prev : [...prev, cat.id];
      localStorage.setItem('ajp_expanded_cats', JSON.stringify(next));
      return next;
    });
    const url = `/m/${cat.catSlug}/${sub.subSlug}`;
    if (window.location.pathname !== url) {
      window.history.pushState({}, '', url);
    }
    setMobileNavOpen(false);
  }, []);

  const saveProfile = useCallback(
    async (data: Partial<BirthProfile>, existingId?: string): Promise<BirthProfile | null> => {
      const url = existingId ? `/api/profiles/${existingId}` : '/api/profiles';
      const method = existingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      const body = (await res.json()) as { profile: BirthProfile };
      await refreshProfiles();
      if (body.profile?.id) setActiveProfileId(body.profile.id);
      return body.profile;
    },
    [refreshProfiles, setActiveProfileId],
  );

  const deleteProfile = useCallback(
    async (id: string) => {
      await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
      await refreshProfiles();
    },
    [refreshProfiles],
  );

  const openProfileModal = useCallback((mode: 'create' | 'edit' | 'import', target?: BirthProfile | null) => {
    setProfileModal({ open: true, mode, target: target ?? null });
  }, []);

  const closeProfileModal = useCallback(() => {
    setProfileModal((p) => ({ ...p, open: false }));
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: 1 } : n)));
  }, []);

  const toggleBookmark = useCallback(
    async (itemType: string, itemId: string, title: string, meta = '') => {
      const exists = bookmarks.some((b) => b.item_type === itemType && b.item_id === itemId);
      if (exists) {
        await fetch(`/api/bookmarks/${encodeURIComponent(itemType)}/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
      } else {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemType, itemId, title, meta }),
        });
      }
      await refreshAuxData();
    },
    [bookmarks, refreshAuxData],
  );

  return (
    <AppContext.Provider
      value={{
        user,
        profiles,
        activeProfile,
        setActiveProfileId,
        updateActiveProfileLive,
        workflowProgress,
        setStepStatus,
        toggleStepStatus,
        chart,
        calcConfig,
        updateCalcConfig,
        chartStyle,
        setChartStyle,
        lang,
        setLang,
        theme,
        setTheme,
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
        refreshProfiles,
        saveProfile,
        deleteProfile,
        profileModal,
        openProfileModal,
        closeProfileModal,
        authModalOpen,
        setAuthModalOpen,
        refreshAuth,
        knowledgeArticles,
        refreshKnowledge,
        notifications,
        markNotificationRead,
        bookmarks,
        toggleBookmark,
        savedReports,
        refreshReports,
        aiInitialPrompt,
        setAiInitialPrompt,
        selectedReportType,
        setSelectedReportType,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
