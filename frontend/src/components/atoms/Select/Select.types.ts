export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  onSearchChange?: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}
