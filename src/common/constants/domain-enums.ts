export const UserRole = {
  TENANT: 'TENANT',
  LANDLORD: 'LANDLORD',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const VerificationStatus = {
  UNVERIFIED: 'UNVERIFIED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;
export type VerificationStatus =
  (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const PropertyStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  RENTED: 'RENTED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type PropertyStatus =
  (typeof PropertyStatus)[keyof typeof PropertyStatus];

export const PropertyType = {
  APARTMENT: 'APARTMENT',
  HOUSE: 'HOUSE',
  STUDIO: 'STUDIO',
  ROOM: 'ROOM',
  LOFT: 'LOFT',
} as const;
export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

export const SwipeAction = {
  LIKE: 'LIKE',
  DISLIKE: 'DISLIKE',
  SUPERLIKE: 'SUPERLIKE',
} as const;
export type SwipeAction = (typeof SwipeAction)[keyof typeof SwipeAction];

export const MatchStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  CONVERTED_TO_LEASE: 'CONVERTED_TO_LEASE',
} as const;
export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];

export const MessageType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  DOCUMENT: 'DOCUMENT',
  PAYMENT_RECEIPT: 'PAYMENT_RECEIPT',
  SYSTEM: 'SYSTEM',
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export const LeaseStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  TERMINATED: 'TERMINATED',
} as const;
export type LeaseStatus = (typeof LeaseStatus)[keyof typeof LeaseStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  LATE: 'LATE',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
} as const;
export type PaymentStatus =
  (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentType = {
  DEPOSIT: 'DEPOSIT',
  RENT: 'RENT',
  FEE: 'FEE',
  REFUND: 'REFUND',
  OTHER: 'OTHER',
} as const;
export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];

export const PaymentMethodType = {
  CARD: 'CARD',
  APPLE_PAY: 'APPLE_PAY',
  GOOGLE_PAY: 'GOOGLE_PAY',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CASH: 'CASH',
} as const;
export type PaymentMethodType =
  (typeof PaymentMethodType)[keyof typeof PaymentMethodType];

export const PaymentEventType = {
  CREATED: 'CREATED',
  PROCESSING: 'PROCESSING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
  LATE: 'LATE',
} as const;
export type PaymentEventType =
  (typeof PaymentEventType)[keyof typeof PaymentEventType];

export const TrustEventType = {
  IDENTITY_VERIFIED: 'IDENTITY_VERIFIED',
  PAYMENT_ON_TIME: 'PAYMENT_ON_TIME',
  PAYMENT_LATE: 'PAYMENT_LATE',
  POSITIVE_RATING: 'POSITIVE_RATING',
  NEGATIVE_RATING: 'NEGATIVE_RATING',
  DISPUTE_RESOLVED_AGAINST: 'DISPUTE_RESOLVED_AGAINST',
  DISPUTE_RESOLVED_FAVOR: 'DISPUTE_RESOLVED_FAVOR',
  PROFILE_COMPLETED: 'PROFILE_COMPLETED',
  OTHER: 'OTHER',
} as const;
export type TrustEventType =
  (typeof TrustEventType)[keyof typeof TrustEventType];

export const DisputeStatus = {
  OPEN: 'OPEN',
  UNDER_REVIEW: 'UNDER_REVIEW',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;
export type DisputeStatus =
  (typeof DisputeStatus)[keyof typeof DisputeStatus];

export const DisputeType = {
  LATE_PAYMENT: 'LATE_PAYMENT',
  PROPERTY_DAMAGE: 'PROPERTY_DAMAGE',
  MAINTENANCE_ISSUE: 'MAINTENANCE_ISSUE',
  SCAM_REPORT: 'SCAM_REPORT',
  CONTRACT_ISSUE: 'CONTRACT_ISSUE',
  SERVICE_ISSUE: 'SERVICE_ISSUE',
  OTHER: 'OTHER',
} as const;
export type DisputeType = (typeof DisputeType)[keyof typeof DisputeType];

export const DisputeEvidenceType = {
  PHOTO: 'PHOTO',
  DOCUMENT: 'DOCUMENT',
  MESSAGE: 'MESSAGE',
  OTHER: 'OTHER',
} as const;
export type DisputeEvidenceType =
  (typeof DisputeEvidenceType)[keyof typeof DisputeEvidenceType];

export const ServiceType = {
  INTERNET: 'INTERNET',
  WATER: 'WATER',
  ELECTRICITY: 'ELECTRICITY',
  CLEANING: 'CLEANING',
  MAINTENANCE: 'MAINTENANCE',
  SECURITY: 'SECURITY',
  OTHER: 'OTHER',
} as const;
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];

export const ServiceRequestStatus = {
  PENDING: 'PENDING',
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type ServiceRequestStatus =
  (typeof ServiceRequestStatus)[keyof typeof ServiceRequestStatus];

export const NotificationType = {
  MATCH_CREATED: 'MATCH_CREATED',
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  PAYMENT_DUE: 'PAYMENT_DUE',
  PAYMENT_PAID: 'PAYMENT_PAID',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  DISPUTE_OPENED: 'DISPUTE_OPENED',
  SERVICE_UPDATED: 'SERVICE_UPDATED',
  LEASE_CREATED: 'LEASE_CREATED',
  TRUST_SCORE_UPDATED: 'TRUST_SCORE_UPDATED',
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export const AuditAction = {
  USER_LOGIN: 'USER_LOGIN',
  PROPERTY_CREATED: 'PROPERTY_CREATED',
  PROPERTY_UPDATED: 'PROPERTY_UPDATED',
  SWIPE_CREATED: 'SWIPE_CREATED',
  MATCH_ACCEPTED: 'MATCH_ACCEPTED',
  MATCH_REJECTED: 'MATCH_REJECTED',
  LEASE_CREATED: 'LEASE_CREATED',
  PAYMENT_CREATED: 'PAYMENT_CREATED',
  PAYMENT_PAID: 'PAYMENT_PAID',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  DISPUTE_CREATED: 'DISPUTE_CREATED',
  DISPUTE_RESOLVED: 'DISPUTE_RESOLVED',
  TRUST_SCORE_UPDATED: 'TRUST_SCORE_UPDATED',
  SERVICE_REQUEST_CREATED: 'SERVICE_REQUEST_CREATED',
  AI_QUESTION_ASKED: 'AI_QUESTION_ASKED',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const MaintenanceRequestStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;
export type MaintenanceRequestStatus =
  (typeof MaintenanceRequestStatus)[keyof typeof MaintenanceRequestStatus];
