export interface CreateProjectDrawerProps {
  isOpen: boolean;
  name: string;
  setName: (name: string) => void;
  desc: string;
  setDesc: (desc: string) => void;
  pending: boolean;
  onClose: () => void;
  onSubmit: (slug?: string) => void;
}
