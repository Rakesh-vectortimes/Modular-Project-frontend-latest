/** Matches backend app.schemas.component_definition */

export interface PropertySchemaField {
  key: string;
  label: string;
  inputType: string;
  options: string[] | null;
}

export interface ComponentDefinitionBase {
  type: string;
  label: string;
  icon: string;
  category: string;
  default_props: Record<string, unknown>;
  property_schema: PropertySchemaField[];
  is_container: boolean;
}

export interface ComponentDefinitionCreate extends ComponentDefinitionBase {}

export interface ComponentDefinitionRead extends ComponentDefinitionBase {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ComponentDefinitionGrouped {
  category: string;
  components: ComponentDefinitionRead[];
}
