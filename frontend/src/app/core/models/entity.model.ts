/** Matches backend app.schemas.entity — a reusable table within one app. */

import { PageDataFieldSpec } from '../services/page-data.service';

export interface EntityRead {
  id: string;
  organization_id: string;
  software_id: string;
  name: string;
  slug: string;
  collection_name: string | null;
  fields: PageDataFieldSpec[];
  created_at: string | null;
  updated_at: string | null;
}

export interface EntityListRead {
  total: number;
  items: EntityRead[];
}

export interface EntityRecordRead {
  id: string;
  entity_id: string;
  values: Record<string, unknown>;
  submitted_at: string;
  submitted_by: string | null;
}

export interface EntityRecordListRead {
  total: number;
  items: EntityRecordRead[];
}
