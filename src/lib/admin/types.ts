export type ActivityLogRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string | null;
  } | null;
};

export type AdminDashboardStats = {
  totalProducts: number;
  totalEmployees: number;
  productsAddedThisWeek: number;
  productsUpdatedToday: number;
  photosUploadedThisWeek: number;
};

export type EmployeeListRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
  productsAdded: number;
  productsUpdated: number;
  photosUploaded: number;
  lastActivityAt: string | null;
};

export type EmployeeDetailStats = {
  productsAdded: number;
  productsUpdated: number;
  photosUploaded: number;
};
