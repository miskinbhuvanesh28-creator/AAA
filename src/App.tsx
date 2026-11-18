import React from 'react';
import { Header } from './components/Header.tsx';
import { AuthModal, ProfileModal } from './components/Modals.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { WorkspaceShell } from './components/WorkspaceShell.tsx';
import { AppProvider, useApp } from './context/AppContext.tsx';
import type { PageKey } from './navigation/navConfig.ts';
import {
  AiAstrologerPage,
  AdminSettingsPage,
  KnowledgeLibraryPage,
  ReportsPage,
} from './pages/AiReportsKnowledgeAdminPages.tsx';
import {
  CompatibilityPage,
  MuhurtaPage,
  NumerologyPage,
  PrashnaPage,
  RemediesPage,
  WesternAstrologyPage,
} from './pages/AppliedAstrologyPages.tsx';
import {
  DivisionalChartsPage,
  HoroscopePage,
  ParashariPage,
} from './pages/CoreHoroscopePages.tsx';
import { BirthProfilesPage, DashboardPage } from './pages/DashboardAndProfiles.tsx';
import {
  AshtakavargaPage,
  NakshatraPage,
  PlanetaryStrengthPage,
  YogasDoshasPage,
} from './pages/StrengthAndYogasPages.tsx';
import {
  DashaSystemsPage,
  JaiminiAstrologyPage,
  KpAstrologyPage,
} from './pages/SystemsPages.tsx';
import {
  GocharaPage,
  PanchangaPage,
  RectificationPage,
  VarshaphalaPage,
} from './pages/TimingAndLifePages.tsx';

class WorkspaceErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="m-6 rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          <h2 className="text-base font-semibold">Module Render Error</h2>
          <p className="mt-1 text-sm">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-4 rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-800"
          >
            Reset Module View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function renderActivePage(pageKey: PageKey, subTab: string): React.ReactNode {
  switch (pageKey) {
    case 'dashboard':
      return <DashboardPage subTab={subTab} />;
    case 'profiles':
      return <BirthProfilesPage subTab={subTab} />;
    case 'horoscope':
      return <HoroscopePage subTab={subTab} />;
    case 'parashari':
      return <ParashariPage subTab={subTab} />;
    case 'vargas':
      return <DivisionalChartsPage subTab={subTab} />;
    case 'strength':
      return <PlanetaryStrengthPage subTab={subTab} />;
    case 'ashtakavarga':
      return <AshtakavargaPage subTab={subTab} />;
    case 'yogas':
      return <YogasDoshasPage subTab={subTab} />;
    case 'nakshatra':
      return <NakshatraPage subTab={subTab} />;
    case 'dasha':
      return <DashaSystemsPage subTab={subTab} />;
    case 'kp':
      return <KpAstrologyPage subTab={subTab} />;
    case 'jaimini':
      return <JaiminiAstrologyPage subTab={subTab} />;
    case 'panchanga':
      return <PanchangaPage subTab={subTab} />;
    case 'gochara':
      return <GocharaPage subTab={subTab} />;
    case 'varshaphala':
      return <VarshaphalaPage subTab={subTab} />;
    case 'rectification':
      return <RectificationPage subTab={subTab} />;
    case 'compatibility':
      return <CompatibilityPage subTab={subTab} />;
    case 'muhurta':
      return <MuhurtaPage subTab={subTab} />;
    case 'prashna':
      return <PrashnaPage subTab={subTab} />;
    case 'numerology':
      return <NumerologyPage subTab={subTab} />;
    case 'western':
      return <WesternAstrologyPage subTab={subTab} />;
    case 'remedies':
      return <RemediesPage subTab={subTab} />;
    case 'ai':
      return <AiAstrologerPage subTab={subTab} />;
    case 'reports':
      return <ReportsPage subTab={subTab} />;
    case 'knowledge':
      return <KnowledgeLibraryPage subTab={subTab} />;
    case 'admin':
      return <AdminSettingsPage subTab={subTab} />;
    default:
      return <DashboardPage subTab="overview" />;
  }
}

const WorkspaceLayout: React.FC = () => {
  const { activeCat, activeSub } = useApp();

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#090D16] dark:text-[#F8FAFC]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <WorkspaceShell>
          <WorkspaceErrorBoundary key={`${activeCat.id}:${activeSub.id}`}>
            {renderActivePage(activeCat.pageKey, activeSub.subTab)}
          </WorkspaceErrorBoundary>
        </WorkspaceShell>
      </div>
      <ProfileModal />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <WorkspaceLayout />
    </AppProvider>
  );
}
