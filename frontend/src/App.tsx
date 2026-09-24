import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { PublicOnlyRoute } from '@/components/guards/PublicOnlyRoute/PublicOnlyRoute';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { PageTransition } from '@/components/atoms/PageTransition/PageTransition';
import { ToastContext, useToastState } from '@/context/ToastContext';
import { ToastContainer } from '@/components/atoms/ToastContainer/ToastContainer';
import { NotificationProvider } from '@/context/NotificationContext';
import { ExportJobsProvider } from '@/context/ExportJobsContext';
import { UserProfileProvider } from '@/context/UserProfileContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NewLinkDrawerProvider } from '@/context/NewLinkDrawerContext';
import { NetworkProvider } from '@/context/NetworkContext';
import { OfflineBanner } from '@/components/organisms/OfflineBanner';

// Lazy-loaded page chunks
const LoginPage = lazy(() => import('@/pages/LoginPage/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const ClicksPage = lazy(() => import('@/pages/ClicksPage/ClicksPage').then((m) => ({ default: m.ClicksPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const RedirectPage = lazy(() => import('@/pages/RedirectPage').then((m) => ({ default: m.RedirectPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

function PublicPage({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="page-route-fallback" />}>
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute><PublicPage><LoginPage /></PublicPage></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><PublicPage><RegisterPage /></PublicPage></PublicOnlyRoute>} />
        <Route path="/verify-email" element={<PublicPage><VerifyEmailPage /></PublicPage>} />
        <Route path="/reset-password" element={<PublicOnlyRoute><PublicPage><ResetPasswordPage /></PublicPage></PublicOnlyRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Persistent authenticated shell: sidebar, top bar and mobile nav stay mounted. */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/clicks" element={<ClicksPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="/r/:slug" element={<RedirectPage />} />
        <Route path="/:slug" element={<RedirectPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  const toast = useToastState();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastContext.Provider value={toast}>
          <NotificationProvider>
            <NetworkProvider>
              <UserProfileProvider>
                <ExportJobsProvider>
                  <NewLinkDrawerProvider>
                    <BrowserRouter>
                      <OfflineBanner />
                      <AppRoutes />
                      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
                    </BrowserRouter>
                  </NewLinkDrawerProvider>
                </ExportJobsProvider>
              </UserProfileProvider>
            </NetworkProvider>
          </NotificationProvider>
        </ToastContext.Provider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
