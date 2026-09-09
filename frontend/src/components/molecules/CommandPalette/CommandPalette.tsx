import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/atoms/Icon/Icon';
import type { CommandPaletteProps, CommandItem as CommandItemType } from './CommandPalette.types';
import { useCommandPalette } from './useCommandPalette';
import './CommandPalette.css';

function CommandItemRow({
  item,
  isActive,
  onSelect,
}: {
  item: CommandItemType;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`cmd-palette-item ${isActive ? 'active' : ''}`}
      onClick={onSelect}
      role="option"
      aria-selected={isActive}
    >
      <div className="cmd-palette-item-left">
        <div className="cmd-palette-icon-wrapper">
          <Icon name={item.iconName} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p className="cmd-palette-item-title">{item.title}</p>
          {item.subtitle && <p className="cmd-palette-item-subtitle">{item.subtitle}</p>}
        </div>
      </div>
      {item.badgeText && <span className="cmd-palette-item-badge">{item.badgeText}</span>}
    </div>
  );
}

function CommandPaletteSearchBar({
  inputRef,
  query,
  onChange,
  onKeyDown,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="cmd-palette-search-bar">
      <Icon name="search" className="cmd-palette-search-icon" />
      <input
        ref={inputRef}
        type="text"
        className="cmd-palette-input"
        placeholder="Search shortlinks, projects, or type a command..."
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <span className="cmd-palette-esc-badge">ESC</span>
    </div>
  );
}

function CommandPaletteList({
  items,
  selectedIndex,
  resultsRef,
}: {
  items: CommandItemType[];
  selectedIndex: number;
  resultsRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (items.length === 0) {
    return (
      <div className="cmd-palette-results-container" ref={resultsRef} role="listbox">
        <div className="cmd-palette-empty">
          <Icon name="search_off" className="cmd-palette-empty-icon" />
          <p>No matching shortlinks, projects, or actions found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cmd-palette-results-container" ref={resultsRef} role="listbox">
      {items.map((item, idx) => (
        <CommandItemRow
          key={item.id}
          item={item}
          isActive={idx === selectedIndex}
          onSelect={item.action}
        />
      ))}
    </div>
  );
}

function CommandPaletteFooter() {
  return (
    <div className="cmd-palette-footer">
      <div className="cmd-palette-hints">
        <span className="cmd-palette-hint">
          <span className="cmd-palette-key">↑</span>
          <span className="cmd-palette-key">↓</span> Navigate
        </span>
        <span className="cmd-palette-hint">
          <span className="cmd-palette-key">↵</span> Select
        </span>
      </div>
      <span>LinkTracker Garden Command Palette</span>
    </div>
  );
}

export function CommandPalette(props: CommandPaletteProps) {
  const { query, setQuery, selectedIndex, allItems, handleKeyDown } = useCommandPalette(props);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (props.isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [props.isOpen]);

  if (!props.isOpen) return null;

  const content = (
    <div className="cmd-palette-overlay" onClick={props.onClose} role="presentation">
      <div className="cmd-palette-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Command Palette">
        <CommandPaletteSearchBar inputRef={inputRef} query={query} onChange={setQuery} onKeyDown={handleKeyDown} />
        <CommandPaletteList items={allItems} selectedIndex={selectedIndex} resultsRef={resultsRef} />
        <CommandPaletteFooter />
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
