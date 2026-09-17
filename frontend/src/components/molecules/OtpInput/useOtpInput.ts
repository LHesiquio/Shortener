import { useRef, useEffect, useCallback } from 'react';

interface UseOtpInputParams {
  value: string;
  onChange: (value: string) => void;
  length: number;
  autoFocus?: boolean;
}

function updateCharAtIndex(val: string, index: number, char: string, len: number): string {
  const chars = val.padEnd(len, ' ').split('');
  chars[index] = char;
  return chars.join('').trimEnd();
}

function computeBackspace(val: string, index: number): { next: string; focusPrev: boolean } {
  const chars = val.split('');
  if (!chars[index] && index > 0) {
    return { next: val, focusPrev: true };
  }
  chars[index] = '';
  return { next: chars.join('').trimEnd(), focusPrev: false };
}

function getNextFocusIndex(key: string, idx: number, maxLen: number): number | null {
  if (key === 'ArrowLeft') return Math.max(0, idx - 1);
  if (key === 'ArrowRight') return Math.min(maxLen - 1, idx + 1);
  return null;
}

function handleBackspace(val: string, idx: number, onChg: (v: string) => void, focus: (i: number) => void): void {
  const { next, focusPrev } = computeBackspace(val, idx);
  onChg(next);
  if (focusPrev) focus(idx - 1);
}

export function useOtpInput({ value, onChange, length, autoFocus }: UseOtpInputParams) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) inputRefs.current[0]?.focus();
  }, [autoFocus]);

  const setInputRef = useCallback((el: HTMLInputElement | null, idx: number) => {
    inputRefs.current[idx] = el;
  }, []);

  const focusInput = useCallback((idx: number) => {
    inputRefs.current[idx]?.focus();
    inputRefs.current[idx]?.select();
  }, []);

  const handleDigitChange = useCallback((idx: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    if (!digit) return;
    onChange(updateCharAtIndex(value, idx, digit, length));
    if (idx < length - 1) focusInput(idx + 1);
  }, [value, onChange, length, focusInput]);

  const handleKeyDown = useCallback((idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      handleBackspace(value, idx, onChange, focusInput);
      return;
    }
    const target = getNextFocusIndex(e.key, idx, length);
    if (target !== null && target !== idx) focusInput(target);
  }, [value, onChange, length, focusInput]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusInput(Math.min(pasted.length, length - 1));
  }, [length, onChange, focusInput]);

  return { setInputRef, handleDigitChange, handleKeyDown, handlePaste };
}
