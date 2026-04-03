// Shared TypeScript types for Staky

export type UserRole = "USER" | "PARTNER" | "ADMIN";

export type PlanTier = "FREE" | "PRO" | "BUSINESS";

export type NotificationType =
  | "LIKE"
  | "COMMENT"
  | "REPLY"
  | "FOLLOW"
  | "CONNECT"
  | "RECOMMENDATION"
  | "SAVE"
  | "SHARE"
  | "REQUEST_RECEIVED"
  | "REQUEST_ACCEPTED"
  | "REQUEST_REJECTED"
  | "REQUEST_ACTIVE"
  | "REQUEST_COMPLETED"
  | "REQUEST_MESSAGE";

export type MigrationRequestStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "MATCHED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
