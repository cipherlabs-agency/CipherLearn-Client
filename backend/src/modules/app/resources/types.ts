export interface AppResourceFile {
  url: string;
  publicId: string;
  filename: string;
  size?: number;
}

export interface AppVideo {
  id: number;
  title: string;
  description: string | null;
  url: string;
  category: string | null;
  createdAt: string;
}

export interface AppNote {
  id: number;
  title: string;
  content: string[];
  category: string | null;
  createdAt: string;
}

export interface AppStudyMaterial {
  id: number;
  title: string;
  description: string | null;
  files: AppResourceFile[];
  category: string | null;
  createdAt: string;
}

export interface AppResourceQuery {
  search?: string;
  category?: string;
}
