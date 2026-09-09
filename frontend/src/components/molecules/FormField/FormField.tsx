import React, { useState } from 'react';
import { Input } from '@/components/atoms/Input/Input';
import { Icon } from '@/components/atoms/Icon/Icon';
import type { FormFieldProps } from './FormField.types';
import './FormField.css';

function getFormInputType(isPassword: boolean, isVisible: boolean, fallbackType: string): string {
  if (isPassword && isVisible) return 'text';
  return fallbackType;
}

function getTrailingIcon(isPassword: boolean, isVisible: boolean, onToggle: () => void) {
  if (!isPassword) return undefined;
  return (
    <button type="button" className="password-toggle" onClick={onToggle}>
      <Icon name={isVisible ? 'visibility_off' : 'visibility'} />
    </button>
  );
}

function renderFieldIcon(iconName?: string) {
  if (!iconName) return undefined;
  return <Icon name={iconName} />;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (props, ref) => {
    const { label, iconName, type = 'text', id, errorMessage, error, ...rest } = props;
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isPassword = type === 'password';
    const inputType = getFormInputType(isPassword, isPasswordVisible, type);
    const hasError = Boolean(error || errorMessage);
    const toggle = () => setIsPasswordVisible((v) => !v);
    const iconLeft = renderFieldIcon(iconName);
    const iconRight = getTrailingIcon(isPassword, isPasswordVisible, toggle);

    return (
      <div className={hasError ? 'form-field has-error' : 'form-field'}>
        {label ? <label className="form-label" htmlFor={id}>{label}</label> : null}
        <Input ref={ref} id={id} type={inputType} icon={iconLeft} trailingIcon={iconRight} error={hasError} {...rest} />
        {errorMessage ? <p className="field-error-message">{errorMessage}</p> : null}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
