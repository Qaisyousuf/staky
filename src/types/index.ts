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
  | "REQUEST_MESSAGE"
  | "REQUEST_PROPOSAL"
  | "PROPOSAL_ACCEPTED"
  | "PROPOSAL_DECLINED"
  | "INVOICE_SENT"
  | "INVOICE_PAID"
  | "CONFIG_REQUEST_SENT"
  | "CONFIG_SUBMITTED";

export type MigrationRequestStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "MATCHED"
  | "PROPOSAL_SENT"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
