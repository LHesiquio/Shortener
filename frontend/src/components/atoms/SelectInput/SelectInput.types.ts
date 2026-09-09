export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectInputProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  iconName?: string;
  error?: boolean;
  className?: string;
  id?: string;
}
