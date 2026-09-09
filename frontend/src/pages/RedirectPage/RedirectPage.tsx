import { Icon } from '@/components/atoms/Icon/Icon';
import { useRedirect } from './useRedirect';
import './RedirectPage.css';

export function RedirectPage() {
  const { slug, targetUrl, isRedirecting } = useRedirect();

  return (
    <div className="redirect-page" role="main">
      <div className="redirect-page__card">
        <div className="redirect-page__icon-wrapper">
          <div className="redirect-page__icon-halo" aria-hidden="true" />
          <Icon
            name={isRedirecting ? 'sync' : 'link'}
            size={32}
            className={isRedirecting ? 'redirect-page__spinner' : ''}
            ariaLabel="Redirecting icon"
          />
        </div>

        <h1 className="redirect-page__title">Redirecting...</h1>
        <p className="redirect-page__description">
          Taking you to your destination. Please wait a moment.
        </p>

        {slug && (
          <div className="redirect-page__slug-badge">
            /{slug}
          </div>
        )}

        {targetUrl && (
          <div>
            <a href={targetUrl} className="redirect-page__manual-btn">
              <span>Click here if not redirected automatically</span>
              <Icon name="arrow_forward" size={16} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
