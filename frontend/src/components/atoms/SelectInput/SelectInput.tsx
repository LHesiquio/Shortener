import { useSelectInput } from './useSelectInput';
import type { SelectOption, SelectInputProps } from './SelectInput.types';
import { Icon } from '@/components/atoms/Icon/Icon';
import './SelectInput.css';

interface OptionItemProps {
  opt: SelectOption;
  isSelected: boolean;
  onSelect: (opt: SelectOption) => void;
}

function SelectInputOptionItem({ opt, isSelected, onSelect }: OptionItemProps) {
  return (
    <button
      type="button"
      className={`select-input-option ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(opt)}
      role="option"
      aria-selected={isSelected}
    >
      <span>{opt.label}</span>
      {isSelected && <Icon name="check" className="select-input-check" />}
    </button>
  );
}

interface DropdownProps {
  options: SelectOption[];
  selectedValue?: string;
  onSelect: (opt: SelectOption) => void;
}

function SelectInputDropdown({ options, selectedValue, onSelect }: DropdownProps) {
  return (
    <div className="select-input-dropdown" role="listbox">
      {options.map((opt) => (
        <SelectInputOptionItem
          key={opt.value}
          opt={opt}
          isSelected={opt.value === selectedValue}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function getTriggerClass(isOpen: boolean, error: boolean): string {
  const openClass = isOpen ? 'open' : '';
  const errorClass = error ? 'has-error' : '';
  return `select-input-trigger ${openClass} ${errorClass}`.trim();
}

interface TriggerButtonProps {
  id?: string;
  isOpen: boolean;
  disabled: boolean;
  error: boolean;
  iconName?: string;
  displayLabel: string;
  isPlaceholder: boolean;
  onClick: () => void;
}

function SelectInputTriggerButton({
  id,
  isOpen,
  disabled,
  error,
  iconName,
  displayLabel,
  isPlaceholder,
  onClick,
}: TriggerButtonProps) {
  const triggerClass = getTriggerClass(isOpen, error);
  const arrowIcon = isOpen ? 'chevron_up' : 'chevron_down';
  const rotatedClass = isOpen ? 'rotated' : '';

  return (
    <button
      id={id}
      type="button"
      className={triggerClass}
      onClick={onClick}
      disabled={disabled}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
    >
      {iconName && <span className="select-input-icon-left"><Icon name={iconName} /></span>}
      <span className={`select-input-value ${isPlaceholder ? 'placeholder' : ''}`}>{displayLabel}</span>
      <Icon name={arrowIcon} className={`select-input-arrow ${rotatedClass}`} />
    </button>
  );
}

export function SelectInput(props: SelectInputProps) {
  const { value, placeholder = 'Select an option...', disabled = false, iconName, error = false, className = '', id } = props;
  const {
    isOpen,
    containerRef,
    selectedOption,
    options: effectiveOptions,
    handleSelect,
    toggleOpen,
  } = useSelectInput(props);

  const displayLabel = selectedOption?.label || placeholder;

  return (
    <div className={`select-input-wrapper ${className} ${disabled ? 'disabled' : ''}`} ref={containerRef}>
      <SelectInputTriggerButton
        id={id}
        isOpen={isOpen}
        disabled={disabled}
        error={error}
        iconName={iconName}
        displayLabel={displayLabel}
        isPlaceholder={!selectedOption}
        onClick={toggleOpen}
      />

      {isOpen && (
        <SelectInputDropdown
          options={effectiveOptions}
          selectedValue={value}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
