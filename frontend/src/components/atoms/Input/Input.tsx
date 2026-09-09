import React from 'react';
import type { InputProps } from './Input.types';
import './Input.css';

function getInputClassName(icon?: React.ReactNode, trailingIcon?: React.ReactNode, error?: boolean, className = ''): string {
  const left = icon ? 'has-icon-left' : '';
  const right = trailingIcon ? 'has-icon-right' : '';
  const err = error ? 'has-error' : '';
  return `input-field ${left} ${right} ${err} ${className}`.trim();
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ icon, trailingIcon, error, className = '', ...props }, ref) => {
    const errorClass = error ? 'has-error' : '';
    const fullClass = getInputClassName(icon, trailingIcon, error, className);

    return (
      <div className={`input-wrapper ${errorClass}`}>
        {icon && <div className="input-icon-left">{icon}</div>}
        <input ref={ref} className={fullClass} {...props} />
        {trailingIcon && <div className="input-icon-right">{trailingIcon}</div>}
      </div>
    );
  }
);

Input.displayName = 'Input';
