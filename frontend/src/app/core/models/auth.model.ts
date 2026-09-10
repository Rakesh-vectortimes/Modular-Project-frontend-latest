/** Matches backend auth schemas */

export type UserRole = 'super_admin' | 'admin' | 'member';
export type UserStatus = 'active' | 'inactive';

export interface OrganizationSummary {
  id: string;
  name: string;
}

export interface UserRead {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  mobile: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AppSignupRequest {
  software_id: string;
  page_id?: string | null;
  values: Record<string, unknown>;
}

export interface AppSignupResponse {
  user: UserRead;
  tokens: TokenResponse;
  profile: Record<string, unknown>;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface MeResponse {
  user: UserRead;
  organization: OrganizationSummary;
}

export interface LogoutRequest {
  refresh_token: string;
}
