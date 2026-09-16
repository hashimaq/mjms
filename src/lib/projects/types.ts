export type ProjectSummary = {
  slug: string;
  name: string;
  photoCount: number;
  coverImageUrl: string | null;
  coverStoragePath: string | null;
  articleIds: string[];
};

export type ProjectPhoto = {
  id: string;
  articleId: string;
  storagePath: string;
  imageUrl: string | null;
  imageOrder: number;
  isPrimary: boolean;
  width: number | null;
  height: number | null;
  originalFilename: string | null;
};

export type UserProfile = {
  id: string;
  email: string;
  fullName: string | null;
  role: "staff" | "admin";
};

export type CreateProjectResult = {
  slug: string;
  articleId: string;
  name: string;
};

export type UploadPhotoResult =
  | { ok: true; filename: string; imageOrder: number }
  | { ok: false; filename: string; error: string };

export type ArticleRow = {
  id: string;
  project_raw: string;
  project_normalized: string | null;
  created_at: string;
};

export type ArticleImageRow = {
  id: string;
  article_id: string;
  storage_path: string;
  image_order: number;
  is_primary: boolean;
  width: number | null;
  height: number | null;
  original_filename: string | null;
};
