import { UserRole } from '../constants/domain-enums';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
}
