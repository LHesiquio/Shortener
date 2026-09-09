import { Icon } from '@/components/atoms/Icon/Icon';
import { ReleaseBadge } from '@/components/atoms/ReleaseBadge/ReleaseBadge';
import { Navbar } from '@/components/molecules/Navbar/Navbar';
import { useNewLinkDrawer } from '@/context/NewLinkDrawerContext';
import type { SidebarNavProps } from './SidebarNav.types';
import './SidebarNav.css';

function BrandHeader() {
  return (
    <div className="sidebar-brand">
      <div className="sidebar-brand-icon">
        <Icon name="link" />
      </div>
      <div className="sidebar-brand-title-group">
        <div className="sidebar-brand-title-row">
          <p className="sidebar-brand-name">LinkTracker</p>
          <ReleaseBadge />
        </div>
        <p className="sidebar-brand-tagline">Digital Garden</p>
      </div>
    </div>
  );
}

export function SidebarNav({ onAddLink }: SidebarNavProps) {
  const { openNewLinkDrawer } = useNewLinkDrawer();

  const handleAddClick = () => {
    if (onAddLink) {
      onAddLink();
    } else {
      openNewLinkDrawer();
    }
  };

  return (
    <aside className="sidebar-root">
      <BrandHeader />
      <div className="sidebar-nav-wrapper">
        <Navbar />
      </div>
      <div className="sidebar-footer">
        <button type="button" className="sidebar-add-btn" onClick={handleAddClick}>
          <Icon name="add" />
          Create Shortlink
        </button>
      </div>
    </aside>
  );
}
