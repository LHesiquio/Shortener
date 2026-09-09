export interface DatePickerProps {
  value: string; // ISO or YYYY-MM-DDTHH:mm format
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: Date;
  id?: string;
  align?: 'left' | 'right';
}

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}
