import type { CheckboxProps } from './Checkbox.types';
import './Checkbox.css';

export function Checkbox({
  id,
  name,
  checked,
  onChange,
  disabled = false,
  label,
  description,
  className = '',
  size = 'md',
}: CheckboxProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    onChange?.(e.target.checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLLabelElement>) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange?.(!checked);
    }
  };

  return (
    <label
      htmlFor={id}
      className={`checkbox-atom-root checkbox-atom--${size} ${checked ? 'checkbox-atom--checked' : ''} ${disabled ? 'checkbox-atom--disabled' : ''} ${className}`.trim()}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
    >
      <div className="checkbox-atom-box-wrapper">
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="checkbox-atom-native"
          tabIndex={-1}
          aria-hidden="true"
        />
        <div className="checkbox-atom-box">
          <svg
            className="checkbox-atom-check-svg"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              className="checkbox-atom-check-path"
              d="M3.5 8.2L6.5 11.2L12.5 4.8"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      {(label || description) && (
        <div className="checkbox-atom-content">
          {label && <span className="checkbox-atom-label">{label}</span>}
          {description && <span className="checkbox-atom-description">{description}</span>}
        </div>
      )}
    </label>
  );
}
