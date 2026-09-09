import type { RegisterFormData } from '@/types/register';

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
