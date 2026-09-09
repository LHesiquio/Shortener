import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { SelectProps, SelectOption } from './Select.types';

function useOutsideClick(ref: React.RefObject<HTMLDivElement | null>, isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, ref, onClose]);
}

function filterOptionsList(options: SelectOption[], query: string | null, onSearchChange?: (q: string) => void) {
  if (!onSearchChange && query?.trim()) {
    const q = query.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q)).slice(0, 7);
  }
  return options.slice(0, 7);
}

export function useSelect({ options, value, onChange, onSearchChange, disabled }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => options.find((opt) => opt.value === value), [options, value]);
  const displayQuery = isOpen ? (query ?? selectedOption?.label ?? '') : (selectedOption?.label ?? '');
  const filteredOptions = useMemo(() => filterOptionsList(options, query, onSearchChange), [options, query, onSearchChange]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery(null);
    if (onSearchChange) onSearchChange('');
  }, [onSearchChange]);

  useOutsideClick(containerRef, isOpen, handleClose);

  const handleSelect = (option: SelectOption) => {
    onChange(option.value);
    handleClose();
  };

  const handleInputFocus = () => {
    if (disabled) return;
    setQuery('');
    setIsOpen(true);
    if (onSearchChange) onSearchChange('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const val = e.target.value;
    setQuery(val);
    if (!isOpen) setIsOpen(true);
    if (onSearchChange) onSearchChange(val);
  };

  return {
    isOpen,
    query: displayQuery,
    containerRef,
    filteredOptions,
    handleSelect,
    handleInputFocus,
    handleInputChange,
  };
}
