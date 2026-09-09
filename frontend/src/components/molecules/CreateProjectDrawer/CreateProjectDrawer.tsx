import { Drawer } from '@/components/atoms/Drawer/Drawer';
import { Icon } from '@/components/atoms/Icon/Icon';
import { useSlugAvailability } from '@/hooks/useSlugAvailability';
import type { CreateProjectDrawerProps } from './CreateProjectDrawer.types';
import { CreateProjectSlugField } from './CreateProjectSlugField';
import './CreateProjectDrawer.css';

interface DrawerFormProps {
  name: string;
  setName: (v: string) => void;
  desc: string;
  setDesc: (v: string) => void;
  slugState: ReturnType<typeof useSlugAvailability>;
  onSubmit: (e: React.FormEvent) => void;
}

function ProjectNameField({
  name,
  setName,
  slugState,
}: {
  name: string;
  setName: (v: string) => void;
  slugState: ReturnType<typeof useSlugAvailability>;
}) {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    slugState.autoSuggestFromName(val);
  };
  return (
    <div className="create-project-drawer-field">
      <label htmlFor="drawer-proj-name" className="create-project-drawer-label">
        Project Name *
      </label>
      <input
        id="drawer-proj-name"
        type="text"
        className="create-project-drawer-input"
        placeholder="e.g. Summer Marketing Campaign"
        value={name}
        onChange={handleNameChange}
        autoFocus
      />
    </div>
  );
}

function ProjectDescField({ desc, setDesc }: { desc: string; setDesc: (v: string) => void }) {
  return (
    <div className="create-project-drawer-field">
      <label htmlFor="drawer-proj-desc" className="create-project-drawer-label">
        Description (Optional)
      </label>
      <textarea
        id="drawer-proj-desc"
        className="create-project-drawer-textarea"
        placeholder="Short description of this project collection..."
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
    </div>
  );
}

function CreateProjectDrawerForm({
  name,
  setName,
  desc,
  setDesc,
  slugState,
  onSubmit,
}: DrawerFormProps) {
  return (
    <form onSubmit={onSubmit} className="create-project-drawer-form">
      <ProjectNameField name={name} setName={setName} slugState={slugState} />
      <CreateProjectSlugField slugState={slugState} />
      <ProjectDescField desc={desc} setDesc={setDesc} />
    </form>
  );
}

function CreateProjectDrawerFooter({
  pending,
  disabled,
  onClick,
}: {
  pending: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="drawer-atom-submit-btn" disabled={disabled} onClick={onClick}>
      <Icon name={pending ? 'sync' : 'add'} className={pending ? 'spinning' : ''} />
      {pending ? 'Creating Project…' : 'Create Project'}
    </button>
  );
}

export function CreateProjectDrawer(props: CreateProjectDrawerProps) {
  const { isOpen, name, setName, desc, setDesc, pending, onClose, onSubmit } = props;
  const slugState = useSlugAvailability({ type: 'project' });

  const isSlugValid = slugState.slug.trim().length > 0 && slugState.isAvailable && !slugState.isChecking;
  const isSubmitDisabled = pending || !name.trim() || !isSlugValid;

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isSubmitDisabled) {
      onSubmit(slugState.slug.trim());
    }
  };

  const footer = (
    <CreateProjectDrawerFooter
      pending={pending}
      disabled={isSubmitDisabled}
      onClick={() => handleFormSubmit()}
    />
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      subtitle="Group and organize your shortlinks"
      icon="folder"
      footer={footer}
    >
      <CreateProjectDrawerForm
        name={name}
        setName={setName}
        desc={desc}
        setDesc={setDesc}
        slugState={slugState}
        onSubmit={handleFormSubmit}
      />
    </Drawer>
  );
}
