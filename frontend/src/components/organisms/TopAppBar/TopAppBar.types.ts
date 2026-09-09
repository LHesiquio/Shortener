export interface TopAppBarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  onLogout?: () => void;
}
