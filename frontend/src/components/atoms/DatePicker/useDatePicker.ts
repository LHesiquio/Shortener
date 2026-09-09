import { useState, useRef, useEffect, useMemo } from 'react';
import type { DatePickerProps, CalendarDay } from './DatePicker.types';

function parseDateValue(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDisplayString(date: Date | null, placeholder = 'Select date & time'): string {
  if (!date) return placeholder;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatToDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function buildMonthGrid(viewDate: Date, selectedDate: Date | null, minDate?: Date): CalendarDay[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();

  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: CalendarDay[] = [];

  // Previous month padding
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrevMonth - i);
    days.push({
      date: d,
      dayNumber: d.getDate(),
      isCurrentMonth: false,
      isToday: isSameDay(d, today),
      isSelected: selectedDate ? isSameDay(d, selectedDate) : false,
      isDisabled: minDate ? d < new Date(minDate.setHours(0, 0, 0, 0)) : false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    days.push({
      date: d,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: isSameDay(d, today),
      isSelected: selectedDate ? isSameDay(d, selectedDate) : false,
      isDisabled: minDate ? d < new Date(new Date(minDate).setHours(0, 0, 0, 0)) : false,
    });
  }

  // Next month padding to complete 42 grid items (6 weeks)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: isSameDay(d, today),
      isSelected: selectedDate ? isSameDay(d, selectedDate) : false,
      isDisabled: minDate ? d < new Date(new Date(minDate).setHours(0, 0, 0, 0)) : false,
    });
  }

  return days;
}

export function useDatePicker(props: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = useMemo(() => parseDateValue(props.value), [props.value]);
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate ?? new Date());

  const [hours, setHours] = useState<number>(() => selectedDate?.getHours() ?? 12);
  const [minutes, setMinutes] = useState<number>(() => selectedDate?.getMinutes() ?? 0);

  const displayString = useMemo(
    () => formatDisplayString(selectedDate, props.placeholder),
    [selectedDate, props.placeholder]
  );

  const calendarDays = useMemo(
    () => buildMonthGrid(viewDate, selectedDate, props.minDate),
    [viewDate, selectedDate, props.minDate]
  );

  // Outside click listener
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const handlePrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDay = (day: CalendarDay) => {
    if (day.isDisabled) return;
    const newDate = new Date(day.date);
    newDate.setHours(hours, minutes, 0, 0);
    props.onChange(formatToDatetimeLocal(newDate));
  };

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    setHours(newHours);
    setMinutes(newMinutes);
    const baseDate = selectedDate ?? new Date();
    const newDate = new Date(baseDate);
    newDate.setHours(newHours, newMinutes, 0, 0);
    props.onChange(formatToDatetimeLocal(newDate));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    props.onChange('');
    setIsOpen(false);
  };

  const monthYearHeader = viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return {
    isOpen,
    setIsOpen,
    containerRef,
    selectedDate,
    displayString,
    monthYearHeader,
    calendarDays,
    hours,
    minutes,
    handlePrevMonth,
    handleNextMonth,
    handleSelectDay,
    handleTimeChange,
    handleClear,
  };
}
