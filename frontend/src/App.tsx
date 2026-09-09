import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { PublicOnlyRoute } from '@/components/guards/PublicOnlyRoute/PublicOnlyRoute';
import { PageTransition } from '@/components/atoms/PageTransition/PageTransition';
import { ToastContext, useToastState } from '@/context/ToastContext';
import { ToastContainer } from '@/components/atoms/ToastContainer/ToastContainer';
import { UserProfileProvider } from '@/context/UserProfileContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NewLinkDrawerProvider } from '@/context/NewLinkDrawerContext';
import { NetworkProvider } from '@/context/NetworkContext';
import { OfflineBanner } from '@/components/organisms/OfflineBanner';

// Lazy-loaded page chunks
const LoginPage = lazy(() => import('@/pages/LoginPage/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })));
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

function AppRoutes() {
  return (
    <Suspense fallback={<div className="page-route-fallback" />}>
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
        <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/clicks" element={<ProtectedRoute><ClicksPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
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
          <NetworkProvider>
            <UserProfileProvider>
              <NewLinkDrawerProvider>
                <BrowserRouter>
                  <OfflineBanner />
                  <PageTransition>
                    <AppRoutes />
                  </PageTransition>
                  <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
                </BrowserRouter>
              </NewLinkDrawerProvider>
            </UserProfileProvider>
          </NetworkProvider>
        </ToastContext.Provider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
