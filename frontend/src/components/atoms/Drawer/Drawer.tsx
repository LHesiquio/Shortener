import { createPortal } from 'react-dom';
import { Icon } from '@/components/atoms/Icon/Icon';
import { IconButton } from '@/components/atoms/IconButton/IconButton';
import { useDrawerAnimation } from '@/hooks/useDrawerAnimation';
import type { DrawerProps } from './Drawer.types';
import './Drawer.css';

interface DrawerHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  onClose: () => void;
}

function DrawerHeader({ title, subtitle, icon, onClose }: DrawerHeaderProps) {
  return (
    <div className="drawer-atom-header">
      <div className="drawer-atom-title-group">
        {icon && (
          <div className="drawer-atom-title-icon">
            <Icon name={icon} size={20} />
          </div>
        )}
        <div>
          <h3 className="drawer-atom-title">{title}</h3>
          {subtitle && <p className="drawer-atom-subtitle">{subtitle}</p>}
        </div>
      </div>
      <IconButton icon="close" onClick={onClose} title="Close drawer" />
    </div>
  );
}

function getDrawerClasses(closing: boolean, panelClassName: string, backdropClassName: string) {
  const closeBackdrop = closing ? 'drawer-atom-backdrop--closing' : '';
  const closePanel = closing ? 'drawer-atom-panel--closing' : '';
  return {
    backdropClass: `drawer-atom-backdrop ${closeBackdrop} ${backdropClassName}`.trim(),
    panelClass: `drawer-atom-panel ${closePanel} ${panelClassName}`.trim(),
  };
}

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  panelClassName = '',
  backdropClassName = '',
  width,
}: DrawerProps) {
  const { rendered, closing } = useDrawerAnimation(isOpen);

  if (!rendered) return null;

  const { backdropClass, panelClass } = getDrawerClasses(closing, panelClassName, backdropClassName);

  const drawerContent = (
    <>
      <div className={backdropClass} role="presentation" onClick={onClose} />
      <aside
        className={panelClass}
        role="dialog"
        aria-modal="true"
        style={width ? { width } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <DrawerHeader title={title} subtitle={subtitle} icon={icon} onClose={onClose} />
        <div className="drawer-atom-body">{children}</div>
        {footer && <div className="drawer-atom-footer">{footer}</div>}
      </aside>
    </>
  );

  return createPortal(drawerContent, document.body);
}
