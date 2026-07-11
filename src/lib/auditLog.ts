import { AuditLog } from '@/models';

/**
 * Helper function to create audit log entries
 * Should NEVER throw/crash the main flow
 * Call this after every admin action
 */
export async function createAuditLog(
  performedBy: string,
  action: string,
  targetId: any,
  targetModel: string,
  details: any,
  ipAddress?: string
) {
  try {
    await AuditLog.create({
      performedBy,
      action,
      targetId,
      targetModel,
      details,
      ipAddress,
      createdAt: new Date()
    });
  } catch (err) {
    // Never crash main flow for audit logging
    console.warn("⚠️ Failed to create audit log:", err);
  }
}

/**
 * Create audit log from Express request context
 */
export async function createAuditLogFromRequest(
  req: any,
  action: string,
  targetId: any,
  targetModel: string,
  details: any
) {
  try {
    await createAuditLog(
      req.userId,
      action,
      targetId,
      targetModel,
      details,
      req.ip
    );
  } catch (err) {
    console.warn("⚠️ Failed to create audit log from request:", err);
  }
}

/**
 * Log common admin actions
 */
export const auditActions = {
  USER_DELETED: "deleted_user",
  USER_ROLE_CHANGED: "role_changed",
  USER_SUSPENDED: "suspended_account",
  GYM_VERIFIED: "verified_gym",
  GYM_REJECTED: "rejected_gym",
  GYM_SUSPENDED: "suspended_gym",
  TRAINER_VERIFIED: "verified_trainer",
  TRAINER_REJECTED: "rejected_trainer",
  TRAINER_SUSPENDED: "suspended_trainer",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",
  SETTINGS_UPDATED: "settings_updated",
  CACHE_CLEARED: "cache_cleared",
};
