/** Matches backend app.schemas.software */

export interface SoftwareBase {
  name: string;
  description: string | null;
  category: string | null;
}

export interface SoftwareCreate extends SoftwareBase {}

export interface SoftwareUpdate {
  name?: string;
  description?: string | null;
  category?: string | null;
}

export interface SoftwareRead extends SoftwareBase {
  id: string;
  organization_id: string;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}
