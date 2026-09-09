import type React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  error?: boolean;
}
