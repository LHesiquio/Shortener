import type React from 'react';

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  iconName?: string;
  errorMessage?: string | null;
  error?: boolean;
}
