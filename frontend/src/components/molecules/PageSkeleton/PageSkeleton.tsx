import { Skeleton } from '@/components/atoms/Skeleton/Skeleton';
import type { PageSkeletonProps } from './PageSkeleton.types';
import './PageSkeleton.css';

export function PageSkeleton({ variant = 'dashboard' }: PageSkeletonProps) {
  if (variant === 'auth') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-surface, #fafaf3)' }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--color-outline-variant, #cac6b8)', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton variant="circular" width="3rem" height="3rem" style={{ margin: '0 auto' }} />
          <Skeleton variant="text" width="60%" height="1.5rem" style={{ margin: '0 auto' }} />
          <Skeleton variant="text" width="80%" height="0.9rem" style={{ margin: '0 auto' }} />
          <Skeleton variant="rectangular" height="2.75rem" borderRadius="0.5rem" style={{ marginTop: '1rem' }} />
          <Skeleton variant="rectangular" height="2.75rem" borderRadius="0.5rem" />
          <Skeleton variant="rectangular" height="2.75rem" borderRadius="9999px" style={{ marginTop: '0.5rem' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-skeleton-layout">
      {/* Sidebar Skeleton */}
      <aside className="page-skeleton-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Skeleton variant="circular" width="2.25rem" height="2.25rem" />
            <Skeleton variant="text" width="80px" height="1rem" />
          </div>
        </header>

        {/* Canvas Body */}
        <div className="page-skeleton-canvas">
          {/* Header Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Skeleton variant="text" width="200px" height="1.75rem" />
            <Skeleton variant="text" width="300px" height="0.9rem" />
          </div>

          {/* Cards Grid */}
          <div className="page-skeleton-grid-cards">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="page-skeleton-card">
                <Skeleton variant="circular" width="2.75rem" height="2.75rem" />
                <div style={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height="0.85rem" />
                  <Skeleton variant="text" width="40%" height="1.5rem" style={{ marginTop: '0.4rem' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Main Card / Table / Content */}
          <div className="page-skeleton-table-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
      </main>
    </div>
  );
}
