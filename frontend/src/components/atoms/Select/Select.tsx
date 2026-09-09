import { Icon } from '@/components/atoms/Icon/Icon';
import { useSelect } from './useSelect';
import type { SelectOption, SelectProps } from './Select.types';
import './Select.css';

interface OptionItemProps {
  opt: SelectOption;
  isSelected: boolean;
  onSelect: (opt: SelectOption) => void;
}

function SelectOptionItem({ opt, isSelected, onSelect }: OptionItemProps) {
  return (
    <button
      type="button"
      className={`select-atom-option ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(opt)}
      role="option"
      aria-selected={isSelected}
    >
      <span>{opt.label}</span>
      {isSelected && <Icon name="check" className="select-atom-check" />}
    </button>
  );
}

interface DropdownProps {
  loading: boolean;
  options: SelectOption[];
  selectedValue?: string;
  onSelect: (opt: SelectOption) => void;
}

function SelectDropdown({ loading, options, selectedValue, onSelect }: DropdownProps) {
  if (loading) {
    return (
      <div className="select-atom-dropdown" role="listbox">
        <div className="select-atom-searching">
          <Icon name="loader" className="spinning" />
          Searching projects...
        </div>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="select-atom-dropdown" role="listbox">
        <div className="select-atom-empty">No projects found</div>
      </div>
    );
  }

  return (
    <div className="select-atom-dropdown" role="listbox">
      {options.map((opt) => (
        <SelectOptionItem
          key={opt.value}
          opt={opt}
          isSelected={opt.value === selectedValue}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

interface InputGroupProps {
  isOpen: boolean;
  disabled: boolean;
  placeholder: string;
  query: string;
  loading: boolean;
  onFocus: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function SelectInputGroup({
  isOpen,
  disabled,
  placeholder,
  query,
  loading,
  onFocus,
  onChange,
}: InputGroupProps) {
  const arrowIcon = isOpen ? 'chevron_up' : 'chevron_down';
  return (
    <div className={`select-atom-input-group ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}>
      <input
        type="text"
        className="select-atom-input"
        placeholder={placeholder}
        value={query}
        onFocus={onFocus}
        onChange={onChange}
        autoComplete="off"
        disabled={disabled}
      />
      {loading ? (
        <Icon name="loader" className="select-atom-loader spinning" />
      ) : (
        <Icon name={arrowIcon} className="select-atom-arrow" />
      )}
    </div>
  );
}

export function Select(props: SelectProps) {
  const { placeholder = 'Select an option', loading = false, disabled = false } = props;
  const {
    isOpen,
    query,
    containerRef,
    filteredOptions,
    handleSelect,
    handleInputFocus,
    handleInputChange,
  } = useSelect(props);

  return (
    <div className="select-atom-wrapper" ref={containerRef}>
      <SelectInputGroup
        isOpen={isOpen}
        disabled={disabled}
        placeholder={placeholder}
        query={query}
        loading={loading}
        onFocus={handleInputFocus}
        onChange={handleInputChange}
      />

      {isOpen && (
        <SelectDropdown
          loading={loading}
          options={filteredOptions}
          selectedValue={props.value}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
