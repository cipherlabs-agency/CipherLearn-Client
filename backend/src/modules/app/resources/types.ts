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
  files: unknown;
  category: string | null;
  createdAt: string;
}
