import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/atoms/Icon/Icon';
import { ReleaseBadge } from '@/components/atoms/ReleaseBadge/ReleaseBadge';
import { CommandPalette } from '@/components/molecules/CommandPalette/CommandPalette';
import type { TopAppBarProps } from './TopAppBar.types';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import './TopAppBar.css';

function SearchBar({ onOpenCmd }: { onOpenCmd: () => void }) {
  return (
    <div className="topbar-search-wrapper" onClick={onOpenCmd}>
      <Icon name="search" className="topbar-search-icon" />
      <input
        id="dashboard-search"
        type="text"
        className="topbar-search-input"
        placeholder="Search your garden..."
        readOnly
        onClick={onOpenCmd}
      />
      <span className="topbar-cmd-badge">⌘K</span>
    </div>
  );
}

function useProfileMenuDismiss(
  open: boolean,
  setOpen: React.Dispatch<React.SetStateAction<boolean>>,
  wrapperRef: React.RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
    if (!open) return;
    const clickHandler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', clickHandler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', clickHandler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [open, setOpen, wrapperRef]);
}

interface DropdownProps {
  initials: string;
  displayName: string;
  email?: string;
  onNavigateSettings: () => void;
  onLogout: () => void;
}

function ProfileMenuDropdown({
  initials,
  displayName,
  email,
  onNavigateSettings,
  onLogout,
}: DropdownProps) {
  return (
    <div className="profile-dropdown" role="menu" aria-label="Profile options">
      <div className="profile-dropdown-header">
        <div className="profile-dropdown-avatar">{initials}</div>
        <div className="profile-dropdown-info">
          <p className="profile-dropdown-name">{displayName}</p>
          {email && <p className="profile-dropdown-email">{email}</p>}
        </div>
      </div>
      <div className="profile-dropdown-divider" />
      <button type="button" role="menuitem" className="profile-dropdown-item" onClick={onNavigateSettings}>
        <Icon name="settings" className="profile-dropdown-icon" size={18} />
        Settings
      </button>
      <div className="profile-dropdown-divider" />
      <button type="button" role="menuitem" className="profile-dropdown-item profile-dropdown-item--danger" onClick={onLogout}>
        <Icon name="logout" className="profile-dropdown-icon" size={18} />
        Sign out
      </button>
    </div>
  );
}

function ProfileMenu({ onLogout }: { onLogout?: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { initials, displayName, email } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useProfileMenuDismiss(open, setOpen, wrapperRef);

  const handleSignOut = () => {
    setOpen(false);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    queryClient.clear();
    onLogout?.();
    navigate('/login', { replace: true });
  };

  return (
    <div className="profile-menu-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className={`topbar-avatar${open ? ' topbar-avatar--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Profile menu"
      >
        {initials}
      </button>
      {open && (
        <ProfileMenuDropdown
          initials={initials}
          displayName={displayName}
          email={email}
          onNavigateSettings={() => { setOpen(false); navigate('/settings'); }}
          onLogout={handleSignOut}
        />
      )}
    </div>
  );
}

function MobileBrandHeader() {
  return (
    <div className="topbar-mobile-brand">
      <div className="topbar-mobile-brand-icon"><Icon name="link" size={22} /></div>
      <span className="topbar-mobile-brand-name">LinkTracker</span>
      <ReleaseBadge size="xs" />
    </div>
  );
}

export function TopAppBar({ onLogout = () => {}, onOpenCreateLink }: TopAppBarProps & { onOpenCreateLink?: () => void }) {
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <header className="topbar-root">
      <MobileBrandHeader />
      <SearchBar onOpenCmd={() => setCmdOpen(true)} />
      <div className="topbar-actions">
        <ProfileMenu onLogout={onLogout} />
      </div>
      {cmdOpen && (
        <CommandPalette
          isOpen={cmdOpen}
          onClose={() => setCmdOpen(false)}
          onOpenCreateLink={onOpenCreateLink}
        />
      )}
    </header>
  );
}
