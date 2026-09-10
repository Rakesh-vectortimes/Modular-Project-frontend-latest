/** Matches backend app.schemas.page */

export interface PageBase {
  name: string;
  is_default: boolean;
  /** Reusable entity (table) this page's form reads/writes. Blank ⇒ page name. */
  entity_name?: string | null;
}

export interface PageCreate extends PageBase {
  software_id: string;
}

export interface PageUpdate {
  name?: string;
  is_default?: boolean;
  entity_name?: string | null;
}

export interface PageRead extends PageBase {
  id: string;
  organization_id: string;
  software_id: string;
  created_at: string;
  updated_at: string;
}
