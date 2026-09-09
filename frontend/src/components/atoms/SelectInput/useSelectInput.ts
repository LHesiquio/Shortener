import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { SelectInputProps, SelectOption } from './SelectInput.types';

function useDropdownListeners(ref: React.RefObject<HTMLDivElement | null>, isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, ref, onClose]);
}

function resolveEffectiveOptions(options: SelectOption[], value?: string) {
  if (value && !options.some((opt) => opt.value === value)) {
    return [{ value, label: value }, ...options];
  }
  return options;
}

export function useSelectInput({ options, value, onChange, disabled }: SelectInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const effectiveOptions = useMemo(() => resolveEffectiveOptions(options, value), [options, value]);
  const selectedOption = effectiveOptions.find((opt) => opt.value === value);
  const handleClose = useCallback(() => setIsOpen(false), []);

  useDropdownListeners(containerRef, isOpen, handleClose);

  const handleSelect = (option: SelectOption) => {
    if (disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  return {
    isOpen,
    setIsOpen,
    containerRef,
    selectedOption,
    options: effectiveOptions,
    handleSelect,
    toggleOpen,
  };
}
