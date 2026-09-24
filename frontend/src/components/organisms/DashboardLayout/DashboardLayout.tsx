import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarNav } from '@/components/organisms/SidebarNav/SidebarNav';
import { MobileBottomNav } from '@/components/organisms/MobileBottomNav/MobileBottomNav';
import { TopAppBar } from '@/components/organisms/TopAppBar/TopAppBar';
import { PageTransition } from '@/components/atoms/PageTransition/PageTransition';
import { PageSkeleton } from '@/components/molecules/PageSkeleton/PageSkeleton';
import './DashboardLayout.css';

export function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <SidebarNav />
      <main className="dashboard-main">
        <TopAppBar />
        <PageTransition className="dashboard-content-transition">
          <Suspense fallback={<PageSkeleton variant="content" />}>
            <Outlet />
          </Suspense>
        </PageTransition>
      </main>
      <MobileBottomNav />
    </div>
  );
}
