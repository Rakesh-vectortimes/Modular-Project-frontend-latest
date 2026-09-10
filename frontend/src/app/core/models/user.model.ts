import { UserRole, UserStatus } from './auth.model';

export interface UserBase {
  name: string;
  email: string;
  mobile: string | null;
  role: UserRole;
  status: UserStatus;
}

export interface UserCreate extends UserBase {
  password: string;
}

export interface UserUpdate {
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  role?: UserRole | null;
  status?: UserStatus | null;
  password?: string | null;
}

export interface UserListResponse {
  items: import('./auth.model').UserRead[];
  total: number;
  page: number;
  page_size: number;
}

export interface UserListParams {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  page_size?: number;
}
