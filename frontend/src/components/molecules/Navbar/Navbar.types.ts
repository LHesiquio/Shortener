export interface NavItemData {
  label: string;
  icon: string;
  href: string;
  active?: boolean;
}

export interface NavbarProps {
  items?: NavItemData[];
  className?: string;
  onItemClick?: (item: NavItemData) => void;
}
