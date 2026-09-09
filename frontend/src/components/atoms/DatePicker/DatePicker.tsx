import { Icon } from '@/components/atoms/Icon/Icon';
import { useDatePicker } from './useDatePicker';
import type { DatePickerProps } from './DatePicker.types';
import './DatePicker.css';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function DatePicker(props: DatePickerProps) {
  const {
    isOpen,
    setIsOpen,
    containerRef,
    selectedDate,
    displayString,
    monthYearHeader,
    calendarDays,
    hours,
    minutes,
    handlePrevMonth,
    handleNextMonth,
    handleSelectDay,
    handleTimeChange,
    handleClear,
  } = useDatePicker(props);

  return (
    <div className="datepicker-atom-wrapper" ref={containerRef}>
      <div
        className={`datepicker-atom-trigger ${isOpen ? 'open' : ''} ${selectedDate ? 'has-value' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
      >
        <Icon name="calendar" className="datepicker-icon" size={18} />
        <span className="datepicker-text">{displayString}</span>
        {selectedDate ? (
          <button
            type="button"
            className="datepicker-clear-btn"
            onClick={handleClear}
            title="Clear date"
          >
            <Icon name="close" size={16} />
          </button>
        ) : (
          <Icon
            name={isOpen ? 'chevron_up' : 'chevron_down'}
            className="datepicker-arrow"
            size={18}
          />
        )}
      </div>

      {isOpen && (
        <div className={`datepicker-atom-popover ${props.align === 'right' ? 'align-right' : ''}`} role="dialog">
          {/* Header & Month Nav */}
          <div className="datepicker-header">
            <span className="datepicker-month-title">{monthYearHeader}</span>
            <div className="datepicker-nav-buttons">
              <button type="button" className="datepicker-nav-btn" onClick={handlePrevMonth}>
                <Icon name="chevron_left" size={18} />
              </button>
              <button type="button" className="datepicker-nav-btn" onClick={handleNextMonth}>
                <Icon name="chevron_right" size={18} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="datepicker-weekdays">
            {WEEKDAYS.map((day, idx) => (
              <span key={idx} className="datepicker-weekday">{day}</span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="datepicker-grid">
            {calendarDays.map((day, idx) => (
              <button
                key={idx}
                type="button"
                className={`datepicker-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''} ${day.isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectDay(day)}
                disabled={day.isDisabled}
              >
                {day.dayNumber}
              </button>
            ))}
          </div>

          {/* Time Picker Bar */}
          <div className="datepicker-time-bar">
            <span className="datepicker-time-label">
              <Icon name="clock" size={16} />
              Time
            </span>
            <div className="datepicker-time-selectors">
              <select
                className="datepicker-time-select"
                value={hours}
                onChange={(e) => handleTimeChange(Number(e.target.value), minutes)}
              >
                {Array.from({ length: 24 }).map((_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
              <span>:</span>
              <select
                className="datepicker-time-select"
                value={minutes}
                onChange={(e) => handleTimeChange(hours, Number(e.target.value))}
              >
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
