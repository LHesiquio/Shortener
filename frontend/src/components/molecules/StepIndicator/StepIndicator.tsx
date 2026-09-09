import { Icon } from '@/components/atoms/Icon/Icon';
import type { StepIndicatorProps } from './StepIndicator.types';
import './StepIndicator.css';

interface StepDotProps {
  stepNum: number;
  currentStep: number;
}

function StepDot({ stepNum, currentStep }: StepDotProps) {
  const isCompleted = stepNum < currentStep;
  const isCurrent = stepNum === currentStep;

  let dotClass = 'step-dot upcoming';
  if (isCompleted) {
    dotClass = 'step-dot completed';
  } else if (isCurrent) {
    dotClass = 'step-dot current';
  }

  return (
    <div className={dotClass}>
      {isCompleted ? (
        <Icon name="check" size={13} color="var(--on-primary, #ffffff)" strokeWidth={2.5} />
      ) : (
        <span className="step-number">{stepNum}</span>
      )}
    </div>
  );
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="step-indicator-container">
      <div className="progress-bar-bg">
        <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }} />
      </div>

      <div className="step-dots-row">
        {labels.map((label, index) => {
          const stepNum = index + 1;
          const isActive = stepNum <= currentStep;
          return (
            <div key={stepNum} className="step-item">
              <StepDot stepNum={stepNum} currentStep={currentStep} />
              <span className={`step-label ${isActive ? 'active' : ''}`}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
