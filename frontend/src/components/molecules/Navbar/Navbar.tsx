import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@/components/atoms/Icon/Icon';
import type { NavbarProps } from './Navbar.types';
import './Navbar.css';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
  { label: 'Projects', icon: 'folder', href: '/projects' },
  { label: 'Analytics', icon: 'leaderboard', href: '/analytics' },
  { label: 'Click Logs', icon: 'ads_click', href: '/clicks' },
];

export function Navbar({ className = '' }: NavbarProps) {
  const location = useLocation();

  return (
    <nav className={`navbar-root ${className}`}>
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.href || (item.href === '/dashboard' && location.pathname === '/');
        return (
          <Link
            key={item.label}
            to={item.href}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
