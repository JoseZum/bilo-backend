import { AuditAction } from '../../../common/constants/domain-enums';

export interface AuditContext {
  actorUserId?: string | null;
  entityType: string;
  entityId?: string | null;
  action: AuditAction;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any> | null;
}

export interface AuditListFilter {
  entityType?: string;
  entityId?: string;
  action?: AuditAction;
  actorUserId?: string;
  take?: number;
  skip?: number;
}
