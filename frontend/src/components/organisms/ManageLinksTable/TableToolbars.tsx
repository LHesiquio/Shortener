import { useState } from 'react';
import { Icon } from '@/components/atoms/Icon/Icon';

export function TableQuickCreateBar({ onAdd }: { onAdd: (url?: string) => void }) {
  const [url, setUrl] = useState('');

  const handleGenerate = () => {
    onAdd(url);
    setUrl('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="table-quick-create-row">
      <div className="table-quick-create-input-wrapper">
        <Icon name="link" className="table-quick-create-icon" />
        <input
          className="table-quick-create-input"
          placeholder="Paste a long URL to shorten..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <button type="button" className="table-quick-create-btn" onClick={handleGenerate}>
        <Icon name="add" size={16} />
        <span>Create Shortlink</span>
      </button>
    </div>
  );
}

export function TableSearchToolbar({
  search = '',
  onSearchChange,
}: {
  search?: string;
  onSearchChange: (v: string) => void;
}) {
  return (
    <div className="table-search-toolbar">
      <div className="table-search-wrapper">
        <Icon name="search" className="table-search-icon" size={18} />
        <input
          type="text"
          className="table-search-input"
          placeholder="Search by destination URL, title or slug..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
