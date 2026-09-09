import { Icon } from '@/components/atoms/Icon/Icon';
import type { useSlugAvailability } from '@/hooks/useSlugAvailability';

interface SlugFieldProps {
  slugState: ReturnType<typeof useSlugAvailability>;
}

function SlugStatusIcon({ slugState }: SlugFieldProps) {
  if (!slugState.slug) return null;
  if (slugState.isChecking) {
    return <Icon name="sync" className="status-spinner" size={16} />;
  }
  if (slugState.isAvailable) {
    return <Icon name="check" className="status-available" size={16} />;
  }
  return <Icon name="error" className="status-unavailable" size={16} />;
}

function SlugErrorFeedback({
  reason,
  suggestion,
  onApply,
}: {
  reason: string;
  suggestion?: string;
  onApply: () => void;
}) {
  return (
    <div className="create-project-slug-feedback">
      <span className="create-project-slug-error">{reason}</span>
      {suggestion && (
        <button type="button" className="create-project-suggestion-btn" onClick={onApply}>
          <Icon name="auto_fix" size={12} />
          <span>Use available: <strong>{suggestion}</strong></span>
        </button>
      )}
    </div>
  );
}

function SlugFeedback({ slugState }: SlugFieldProps) {
  if (slugState.isChecking) {
    return <span className="create-project-slug-hint">Checking availability…</span>;
  }
  if (slugState.reason) {
    return (
      <SlugErrorFeedback
        reason={slugState.reason}
        suggestion={slugState.suggestion}
        onApply={slugState.applySuggestion}
      />
    );
  }
  if (slugState.isAvailable && slugState.slug) {
    return <span className="create-project-slug-hint">https://.../projects/{slugState.slug}</span>;
  }
  return <span className="create-project-slug-hint">Unique URL path for this project</span>;
}

export function CreateProjectSlugField({ slugState }: SlugFieldProps) {
  const statusClass = slugState.slug
    ? slugState.isAvailable
      ? 'is-valid'
      : slugState.isChecking
        ? ''
        : 'is-invalid'
    : '';

  return (
    <div className="create-project-drawer-field">
      <label htmlFor="drawer-proj-slug" className="create-project-drawer-label">
        <span>Project URL Slug *</span>
      </label>
      <div className={`create-project-slug-wrapper ${statusClass}`.trim()}>
        <span className="create-project-slug-prefix">/</span>
        <input
          id="drawer-proj-slug"
          type="text"
          className="create-project-slug-input"
          placeholder="e.g. summer-campaign"
          value={slugState.slug}
          onChange={(e) => slugState.setSlug(e.target.value)}
        />
        <div className="create-project-slug-status">
          <SlugStatusIcon slugState={slugState} />
        </div>
      </div>
      <SlugFeedback slugState={slugState} />
    </div>
  );
}
