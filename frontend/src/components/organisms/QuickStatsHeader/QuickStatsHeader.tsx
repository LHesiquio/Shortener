import { useMemo, memo } from 'react';
import { StatsCard } from '@/components/molecules/StatsCard/StatsCard';
import type { QuickStatsHeaderProps } from './QuickStatsHeader.types';
import './QuickStatsHeader.css';

export const QuickStatsHeader = memo(function QuickStatsHeader({
  items,
  totalItems,
  topLinkSlug,
  totalClicks,
  loading,
}: QuickStatsHeaderProps) {
  const effectiveTopSlug = useMemo(() => {
    if (topLinkSlug) return topLinkSlug;
    if (!items || items.length === 0) return 'N/A';
    let top = items[0];
    for (let i = 1; i < items.length; i++) {
      if ((items[i].clicksCount ?? 0) > (top.clicksCount ?? 0)) {
        top = items[i];
      }
    }
    return `/${top.slug}`;
  }, [items, topLinkSlug]);

  return (
    <section className="quick-stats-grid">
      <StatsCard label="Total Links" value={totalItems} iconName="link" variant="primary" loading={loading} />
      <StatsCard label="Total Clicks" value={totalClicks ?? 0} iconName="ads_click" variant="secondary" loading={loading} />
      <StatsCard label="Top Link" value={effectiveTopSlug} iconName="trending_up" variant="tertiary" loading={loading} />
    </section>
  );
});
