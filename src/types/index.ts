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
  | "SHARE";

export type MigrationRequestStatus =
  | "PENDING"
  | "MATCHED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
