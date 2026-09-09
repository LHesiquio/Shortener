import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { Icon } from '@/components/atoms/Icon/Icon';
import { useNewLinkDrawer } from '@/context/NewLinkDrawerContext';
import type { MobileBottomNavProps } from './MobileBottomNav.types';
import './MobileBottomNav.css';

function MobileNavItem({ to, icon, label, end }: { to: string; icon: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }: { isActive: boolean }) =>
        `mobile-bottom-nav-item ${isActive ? 'active' : ''}`
      }
    >
      <div className="mobile-bottom-nav-icon-wrap">
        <Icon name={icon} />
      </div>
      <span>{label}</span>
    </NavLink>
  );
}

function MobileNavFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="mobile-bottom-nav-fab"
      onClick={onClick}
      aria-label="Create shortlink"
      title="Create shortlink"
    >
      <Icon name="add" />
    </button>
  );
}

export function MobileBottomNav({ onAddLink }: MobileBottomNavProps) {
  const { openNewLinkDrawer } = useNewLinkDrawer();

  const handleAddClick = () => {
    if (onAddLink) onAddLink();
    else openNewLinkDrawer();
  };

  const navContent = (
    <nav className="mobile-bottom-nav-root" aria-label="Mobile Navigation">
      <MobileNavItem to="/" end icon="grid_view" label="Dashboard" />
      <MobileNavItem to="/projects" icon="folder" label="Projects" />
      <MobileNavFab onClick={handleAddClick} />
      <MobileNavItem to="/analytics" icon="equalizer" label="Analytics" />
      <MobileNavItem to="/clicks" icon="ads_click" label="Clicks" />
    </nav>
  );

  return createPortal(navContent, document.body);
}
