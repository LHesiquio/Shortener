import { Icon } from '@/components/atoms/Icon/Icon';

export interface AnalyticsHeaderProps {
  userTimezone: string;
  selectedRange: '24h' | '7d' | '30d';
  onSelectRange: (range: '24h' | '7d' | '30d') => void;
  onOpenClicksDrawer: () => void;
}

function RangeSelector({
  selectedRange,
  onSelectRange,
}: {
  selectedRange: '24h' | '7d' | '30d';
  onSelectRange: (range: '24h' | '7d' | '30d') => void;
}) {
  return (
    <div className="analytics-range-selector">
      <button
        type="button"
        className={`analytics-range-btn ${selectedRange === '24h' ? 'active' : ''}`}
        onClick={() => onSelectRange('24h')}
      >
        24 Hours
      </button>
      <button
        type="button"
        className={`analytics-range-btn ${selectedRange === '7d' ? 'active' : ''}`}
        onClick={() => onSelectRange('7d')}
      >
        7 Days
      </button>
      <button
        type="button"
        className={`analytics-range-btn ${selectedRange === '30d' ? 'active' : ''}`}
        onClick={() => onSelectRange('30d')}
      >
        30 Days
      </button>
    </div>
  );
}

export function AnalyticsHeader({
  userTimezone,
  selectedRange,
  onSelectRange,
  onOpenClicksDrawer,
}: AnalyticsHeaderProps) {
  return (
    <header className="analytics-page-header">
      <div>
        <h1 className="analytics-heading">Analytics Overview</h1>
        <p className="analytics-subheading">
          Performance insights for your shortlinks • Timezone: <strong>{userTimezone}</strong>
        </p>
      </div>

      <div className="analytics-header-actions">
        <button
          type="button"
          className="analytics-clicks-log-btn"
          onClick={onOpenClicksDrawer}
        >
          <Icon name="ads_click" /> View Detailed Click Log
        </button>
        <RangeSelector selectedRange={selectedRange} onSelectRange={onSelectRange} />
      </div>
    </header>
  );
}
