import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Skeleton } from '@/components/atoms/Skeleton/Skeleton';
import type { TimelineEntry } from '@/services/analyticsService';
import { formatLocalizedHour, formatLocalizedShortDate, formatLocalizedTooltip } from '@/utils/date.utils';

const CHART_PRIMARY = 'var(--primary, #0067c0)';
const CHART_PRIMARY_CONTAINER = 'var(--primary-container, #e6edf5)';
const CHART_ON_SURFACE_VARIANT = 'var(--on-surface-variant, #464646)';
const CHART_OUTLINE_VARIANT = 'var(--outline-variant, #c6c6c6)';

export interface TimelineChartProps {
  entries: TimelineEntry[];
  range: '24h' | '7d' | '30d';
  userTimezone: string;
  loading?: boolean;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const count = payload[0].value;
  return (
    <div className="analytics-recharts-tooltip">
      <span className="analytics-recharts-tooltip-count">{count} click{count !== 1 ? 's' : ''}</span>
      <span className="analytics-recharts-tooltip-label">{label}</span>
    </div>
  );
}

function getTitles(range: '24h' | '7d' | '30d') {
  if (range === '24h') return { title: 'Clicks Over Time (Last 24 Hours)', subtitle: 'Hourly traffic for the past 24 hours' };
  if (range === '7d') return { title: 'Clicks Over Time (Last 7 Days)', subtitle: 'Daily traffic for the past 7 days' };
  return { title: 'Clicks Over Time (Last 30 Days)', subtitle: 'Daily traffic for the past 30 days' };
}

function ChartSkeleton() {
  return (
    <div className="analytics-chart-container">
      <div className="analytics-chart-header">
        <div>
          <Skeleton width="180px" height="1.2rem" />
          <Skeleton width="240px" height="0.85rem" style={{ marginTop: '0.4rem' }} />
        </div>
      </div>
      <Skeleton width="100%" height="220px" borderRadius="1rem" style={{ marginTop: '1rem' }} />
    </div>
  );
}

function EmptyChart({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="analytics-chart-container">
      <div className="analytics-chart-header">
        <div>
          <h3 className="analytics-card-title">{title}</h3>
          <p className="analytics-card-subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="analytics-empty-chart">No click activity recorded in this period.</div>
    </div>
  );
}

function mapTimelineData(entries: TimelineEntry[], range: '24h' | '7d' | '30d', userTimezone: string) {
  return entries.map((entry) => ({
    label: range === '24h' ? formatLocalizedHour(entry.date, userTimezone) : formatLocalizedShortDate(entry.date, userTimezone),
    tooltip: range === '24h' ? formatLocalizedTooltip(entry.date, userTimezone) : formatLocalizedShortDate(entry.date, userTimezone),
    count: entry.count,
  }));
}

export function TimelineChart({ entries, range, userTimezone, loading }: TimelineChartProps) {
  const { title, subtitle } = getTitles(range);
  if (loading) return <ChartSkeleton />;
  if (entries.length === 0) return <EmptyChart title={title} subtitle={subtitle} />;

  const data = mapTimelineData(entries, range, userTimezone);
  const tickInterval = range === '24h' ? 3 : range === '30d' ? 4 : 0;
  const maxVal = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="analytics-chart-container">
      <div className="analytics-chart-header">
        <div>
          <h3 className="analytics-card-title">{title}</h3>
          <p className="analytics-card-subtitle">{subtitle}</p>
        </div>
      </div>
      <div style={{ width: '100%', height: 220, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={220} minWidth={0}>
          <BarChart data={data} barCategoryGap="35%" margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART_OUTLINE_VARIANT} strokeDasharray="4 4" opacity={0.35} />
            <XAxis dataKey="label" tick={{ fill: CHART_ON_SURFACE_VARIANT, fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} interval={tickInterval} />
            <YAxis allowDecimals={false} domain={[0, maxVal]} tick={{ fill: CHART_ON_SURFACE_VARIANT, fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: CHART_PRIMARY_CONTAINER, radius: 6 }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.count > 0 ? CHART_PRIMARY : CHART_OUTLINE_VARIANT} fillOpacity={entry.count > 0 ? 1 : 0.35} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
