/** Matches backend app.schemas.page */

export interface PageBase {
  name: string;
  is_default: boolean;
}

export interface PageCreate extends PageBase {
  software_id: string;
}

export interface PageUpdate {
  name?: string;
  is_default?: boolean;
}

export interface PageRead extends PageBase {
  id: string;
  organization_id: string;
  software_id: string;
  created_at: string;
  updated_at: string;
}
