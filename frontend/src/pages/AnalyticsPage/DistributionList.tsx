import { Icon } from '@/components/atoms/Icon/Icon';
import { Skeleton } from '@/components/atoms/Skeleton/Skeleton';
import type { AnalyticsBreakdownEntry, ProjectBreakdownEntry } from '@/services/analyticsService';

export interface DistributionListProps {
  title: string;
  subtitle: string;
  items: AnalyticsBreakdownEntry[];
  icon: string;
  loading?: boolean;
}

export function BreakdownSkeletonItems() {
  return (
    <div className="analytics-list-group">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="analytics-list-item">
          <div className="analytics-item-info">
            <Skeleton width="100px" height="0.9rem" />
            <Skeleton width="40px" height="0.9rem" />
          </div>
          <Skeleton width="100%" height="0.4rem" borderRadius="9999px" style={{ marginTop: '0.4rem' }} />
        </div>
      ))}
    </div>
  );
}

function DistributionListContent({ items, total }: { items: AnalyticsBreakdownEntry[]; total: number }) {
  if (items.length === 0) return <div className="analytics-empty-item">No data recorded</div>;
  return (
    <div className="analytics-list-group">
      {items.map((item, idx) => {
        const percent = Math.round((item.count / total) * 100);
        return (
          <div key={idx} className="analytics-list-item">
            <div className="analytics-item-info">
              <span className="analytics-item-key">{item.key}</span>
              <span className="analytics-item-count">{item.count} ({percent}%)</span>
            </div>
            <div className="analytics-progress-track">
              <div className="analytics-progress-fill" style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DistributionList({ title, subtitle, items, icon, loading }: DistributionListProps) {
  const total = items.reduce((acc, i) => acc + i.count, 0) || 1;
  return (
    <div className="analytics-breakdown-card">
      <div className="analytics-card-header">
        <Icon name={icon} className="analytics-card-icon" />
        <div>
          <h4 className="analytics-card-title">{title}</h4>
          <p className="analytics-card-subtitle">{subtitle}</p>
        </div>
      </div>
      {loading ? <BreakdownSkeletonItems /> : <DistributionListContent items={items} total={total} />}
    </div>
  );
}

function ProjectsListContent({ items, total }: { items: ProjectBreakdownEntry[]; total: number }) {
  if (items.length === 0) return <div className="analytics-empty-item">No projects with clicks yet</div>;
  return (
    <div className="analytics-list-group">
      {items.map((item, idx) => {
        const percent = Math.round((item.count / total) * 100);
        return (
          <div key={idx} className="analytics-list-item">
            <div className="analytics-item-info">
              <span className="analytics-item-key">{item.projectName}</span>
              <span className="analytics-item-count">{item.count} clicks ({percent}%)</span>
            </div>
            <div className="analytics-progress-track">
              <div className="analytics-progress-fill" style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProjectsBreakdown({ items, loading }: { items: ProjectBreakdownEntry[]; loading?: boolean }) {
  const total = items.reduce((acc, i) => acc + i.count, 0) || 1;
  return (
    <div className="analytics-breakdown-card">
      <div className="analytics-card-header">
        <Icon name="folder" className="analytics-card-icon" />
        <div>
          <h4 className="analytics-card-title">Clicks by Project</h4>
          <p className="analytics-card-subtitle">Traffic distribution across workspace projects</p>
        </div>
      </div>
      {loading ? <BreakdownSkeletonItems /> : <ProjectsListContent items={items} total={total} />}
    </div>
  );
}
