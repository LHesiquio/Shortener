import type { RegisterFormData } from '@/types/register';

export type StepDirection = 'forward' | 'backward' | 'none';

export interface RegisterFormProps {
  currentStep: number;
  totalSteps: number;
  formData: RegisterFormData;
  onNext: () => void;
  onBack: () => void;
  error?: string | null;
  fieldErrors?: Record<string, string>;
  loading?: boolean;
}
