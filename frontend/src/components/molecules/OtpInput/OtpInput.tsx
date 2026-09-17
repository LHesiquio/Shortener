import type { OtpInputProps } from './OtpInput.types';
import { useOtpInput } from './useOtpInput';
import './OtpInput.css';

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
  id = 'otp-input',
  className = '',
}: OtpInputProps) {
  const { setInputRef, handleDigitChange, handleKeyDown, handlePaste } = useOtpInput({
    value,
    onChange,
    length,
    autoFocus,
  });

  const digits = Array.from({ length }, (_, index) => value[index] ?? '');

  return (
    <div className={`otp-input-container ${className}`.trim()} role="group" aria-label="Verification code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => setInputRef(el, index)}
          id={`${id}-slot-${index}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          className={`otp-digit-input ${digit ? 'filled' : ''}`}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleDigitChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          aria-label={`Digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  );
}
