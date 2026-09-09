export interface CheckboxProps {
  id?: string;
  name?: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  description?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}
