import { Link } from 'react-router-dom';
import { LoginForm } from '@/components/organisms/LoginForm/LoginForm';
import { ForgotPasswordModal } from '@/components/organisms/ForgotPasswordModal/ForgotPasswordModal';
import { Icon } from '@/components/atoms/Icon/Icon';
import { ReleaseBadge } from '@/components/atoms/ReleaseBadge/ReleaseBadge';
import { useLogin } from '@/hooks/useLogin';
import './LoginPage.css';

function BrandHeader() {
  return (
    <div className="login-brand">
      <div className="brand-icon">
        <Icon name="link" className="brand-icon-symbol" />
      </div>
      <div className="login-brand-title-row">
        <h1 className="brand-name">LinkTracker</h1>
        <ReleaseBadge size="sm" />
      </div>
      <p className="brand-tagline">Tending to your digital garden</p>
    </div>
  );
}

function LegalFooter() {
  return (
    <footer className="login-legal">
      <a href="#" className="legal-link">Privacy Policy</a>
      <a href="#" className="legal-link">Terms of Service</a>
      <a href="#" className="legal-link">Help Center</a>
    </footer>
  );
}

export function LoginPage() {
  const login = useLogin();

  return (
    <div className="login-page">
      <div className="login-bg-orb orb-top-left" />
      <div className="login-bg-orb orb-bottom-right" />

      <main className="login-main">
        <div className="login-card">
          <BrandHeader />
          <LoginForm
            {...login}
            onSubmit={login.handleLogin}
            onResendVerification={login.handleResendVerification}
            onForgotPassword={() => login.setIsForgotPasswordOpen(true)}
          />
          <div className="login-footer-actions">
            <p className="login-register-link">
              New to the garden?{' '}
              <Link to="/register" className="link-accent">Create an account</Link>
            </p>
          </div>
        </div>
        <LegalFooter />
      </main>

      <ForgotPasswordModal
        isOpen={login.isForgotPasswordOpen}
        onClose={() => login.setIsForgotPasswordOpen(false)}
        initialEmail={login.email}
      />
    </div>
  );
}
