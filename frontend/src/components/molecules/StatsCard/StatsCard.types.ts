export interface StatsCardProps {
  label: string;
  value: string | number;
  iconName: string;
  variant?: 'primary' | 'secondary' | 'tertiary';
  loading?: boolean;
}
