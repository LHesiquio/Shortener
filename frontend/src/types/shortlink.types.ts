export interface PublicProject {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicShortlink {
  id: string;
  userId: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
  };
  slug: string;
  url: string;
  title?: string;
  active: boolean;
  isArchived?: boolean;
  clicksCount?: number;
  activeFrom?: string;
  activeTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShortlinkPagination {
  limit: number;
  skip: number;
  total: number;
}

export interface ListShortlinksResponse {
  items: PublicShortlink[];
  pagination: ShortlinkPagination;
}

export interface CreateShortlinkPayload {
  url: string;
  projectId?: string;
  slug?: string;
  title?: string;
  activeFrom?: string;
  activeTo?: string;
}

export interface UpdateShortlinkPayload {
  url?: string;
  title?: string;
  active?: boolean;
  projectId?: string;
  activeFrom?: string;
  activeTo?: string | null;
}

export interface ClickLogEntry {
  id: string;
  shortlinkId: string;
  slug: string;
  timestamp: string;
  ipHash: string | null;
  referer: string;
  device: {
    type: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';
    os: string;
    browser: string;
    model?: string | null;
  };
  geo: {
    country: string | null;
    region: string | null;
    city: string | null;
  };
}

export interface ClicksLogResponse {
  clicks: ClickLogEntry[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}
