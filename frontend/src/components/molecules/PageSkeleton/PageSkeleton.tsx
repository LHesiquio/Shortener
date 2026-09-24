import { Skeleton } from '@/components/atoms/Skeleton/Skeleton';
import type { PageSkeletonProps } from './PageSkeleton.types';
import './PageSkeleton.css';

function AuthSkeleton() {
  return (
    <div className="page-skeleton-auth">
      <div className="page-skeleton-auth-card">
        <Skeleton variant="circular" width="3rem" height="3rem" className="page-skeleton-auth-avatar" />
        <Skeleton variant="text" width="60%" height="1.5rem" className="page-skeleton-centered" />
        <Skeleton variant="text" width="80%" height="0.9rem" className="page-skeleton-centered" />
        <Skeleton variant="rectangular" height="2.75rem" borderRadius="0.5rem" className="page-skeleton-auth-field" />
        <Skeleton variant="rectangular" height="2.75rem" borderRadius="0.5rem" />
        <Skeleton variant="rectangular" height="2.75rem" borderRadius="9999px" className="page-skeleton-auth-submit" />
      </div>
    </div>
  );
}

export function CanvasSkeleton() {
  return (
    <div className="page-skeleton-canvas">
      {/* Header Title */}
      <div className="page-skeleton-header">
        <Skeleton variant="text" width="200px" height="1.75rem" />
        <Skeleton variant="text" width="300px" height="0.9rem" />
      </div>

      {/* Cards Grid */}
      <div className="page-skeleton-grid-cards">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="page-skeleton-card">
            <Skeleton variant="circular" width="2.75rem" height="2.75rem" />
            <div className="page-skeleton-card-body">
              <Skeleton variant="text" width="60%" height="0.85rem" />
              <Skeleton variant="text" width="40%" height="1.5rem" className="page-skeleton-card-value" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Card / Table / Content */}
      <div className="page-skeleton-table-card">
        <div className="page-skeleton-table-head">
          <Skeleton variant="text" width="140px" height="1.25rem" />
          <Skeleton variant="rectangular" width="100px" height="2rem" borderRadius="9999px" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="page-skeleton-table-row">
            <Skeleton variant="text" width="120px" height="1rem" />
            <Skeleton variant="text" width="180px" height="1rem" />
            <Skeleton variant="text" width="80px" height="1rem" />
            <Skeleton variant="rectangular" width="60px" height="1.2rem" borderRadius="9999px" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="page-skeleton-layout">
      {/* Sidebar Skeleton */}
      <aside className="page-skeleton-sidebar">
        <div className="page-skeleton-brand">
          <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
          <Skeleton variant="text" width="100px" height="1.2rem" />
        </div>
        <div className="page-skeleton-sidebar-nav">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="page-skeleton-sidebar-item">
              <Skeleton variant="circular" width="1.5rem" height="1.5rem" />
              <Skeleton variant="text" width="90px" height="1rem" />
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="page-skeleton-main">
        {/* Top Bar */}
        <header className="page-skeleton-topbar">
          <Skeleton variant="rectangular" width="240px" height="2.25rem" borderRadius="9999px" />
          <div className="page-skeleton-topbar-actions">
            <Skeleton variant="circular" width="2.25rem" height="2.25rem" />
            <Skeleton variant="text" width="80px" height="1rem" />
          </div>
        </header>

        <CanvasSkeleton />
      </main>
    </div>
  );
}

export function PageSkeleton({ variant = 'dashboard' }: PageSkeletonProps) {
  if (variant === 'auth') return <AuthSkeleton />;
  if (variant === 'content') return <CanvasSkeleton />;
  return <ShellSkeleton />;
}
