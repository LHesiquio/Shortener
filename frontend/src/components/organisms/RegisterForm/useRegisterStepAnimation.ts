import { useRef, useEffect, useState } from 'react';
import type { StepDirection } from './RegisterForm.types';

export function useRegisterStepAnimation(currentStep: number) {
  const prevStepRef = useRef(currentStep);
  const [direction, setDirection] = useState<StepDirection>('none');

  useEffect(() => {
    if (currentStep > prevStepRef.current) {
      setDirection('forward');
    } else if (currentStep < prevStepRef.current) {
      setDirection('backward');
    }
    prevStepRef.current = currentStep;
  }, [currentStep]);

  return {
    direction,
    animationKey: currentStep,
  };
}
