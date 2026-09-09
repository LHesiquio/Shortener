import { useState } from 'react';
import { useAnalyticsPage } from './useAnalyticsPage';
import { useUserProfile } from '@/context/UserProfileContext';
import { SidebarNav } from '@/components/organisms/SidebarNav/SidebarNav';
import { MobileBottomNav } from '@/components/organisms/MobileBottomNav/MobileBottomNav';
import { TopAppBar } from '@/components/organisms/TopAppBar/TopAppBar';
import { StatsCard } from '@/components/molecules/StatsCard/StatsCard';
import { ClicksLogDrawer } from '@/components/organisms/ClicksLogDrawer/ClicksLogDrawer';
import { TimelineChart } from './TimelineChart';
import { DistributionList, ProjectsBreakdown } from './DistributionList';
import { AnalyticsHeader } from './AnalyticsHeader';
import type { AnalyticsSummary } from '@/services/analyticsService';
import '@/components/organisms/QuickStatsHeader/QuickStatsHeader.css';
import './AnalyticsPage.css';

function QuickStatsSection({ summary, loading }: { summary?: AnalyticsSummary; loading: boolean }) {
  const topSlug = summary?.topLink ? `/${summary.topLink.slug}` : 'N/A';
  return (
    <section className="quick-stats-grid">
      <StatsCard label="Total Clicks" value={summary?.totalClicks ?? 0} iconName="ads_click" variant="primary" loading={loading} />
      <StatsCard label="Active Links" value={summary?.activeShortlinks ?? 0} iconName="link" variant="secondary" loading={loading} />
      <StatsCard label="Top Link" value={topSlug} iconName="trending_up" variant="tertiary" loading={loading} />
    </section>
  );
}

function BreakdownsSection({ summary, loading }: { summary?: AnalyticsSummary; loading: boolean }) {
  return (
    <>
      <div className="analytics-grid-two-col">
        <DistributionList title="Devices" subtitle="Clicks by device category" items={summary?.byDevice ?? []} icon="devices" loading={loading} />
        <DistributionList title="Browsers" subtitle="Clicks by web browser" items={summary?.byBrowser ?? []} icon="public" loading={loading} />
      </div>
      <div className="analytics-grid-two-col">
        <ProjectsBreakdown items={summary?.byProject ?? []} loading={loading} />
        <DistributionList title="Operating Systems" subtitle="Clicks by OS platform" items={summary?.byOs ?? []} icon="computer" loading={loading} />
      </div>
    </>
  );
}

export function AnalyticsPage() {
  const pageState = useAnalyticsPage();
  const { userTimezone } = useUserProfile();
  const [search, setSearch] = useState('');
  const [clicksDrawerOpen, setClicksDrawerOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <SidebarNav onAddLink={() => {}} />
      <main className="dashboard-main">
        <TopAppBar search={search} onSearchChange={setSearch} onLogout={pageState.handleLogout} />
        <div className="dashboard-canvas">
          <AnalyticsHeader
            userTimezone={userTimezone}
            selectedRange={pageState.selectedRange}
            onSelectRange={pageState.setSelectedRange}
            onOpenClicksDrawer={() => setClicksDrawerOpen(true)}
          />
          <QuickStatsSection summary={pageState.summary} loading={pageState.isLoading} />
          <TimelineChart
            entries={pageState.summary?.clicksTimeline ?? []}
            range={pageState.selectedRange}
            userTimezone={userTimezone}
            loading={pageState.isLoading}
          />
          <BreakdownsSection summary={pageState.summary} loading={pageState.isLoading} />
        </div>
      </main>
      <MobileBottomNav />
      <ClicksLogDrawer isOpen={clicksDrawerOpen} onClose={() => setClicksDrawerOpen(false)} />
    </div>
  );
}
