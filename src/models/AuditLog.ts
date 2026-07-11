import mongoose, { Document, Schema } from "mongoose";

/**
 * IAuditLog Interface - Defines the AuditLog document structure
 * Tracks all admin and super admin actions for compliance and debugging
 */
export interface IAuditLog extends Document {
  // Who performed the action
  performedBy: mongoose.Schema.Types.ObjectId;

  // What action was performed
  action: string;

  // What was affected
  targetId: mongoose.Schema.Types.ObjectId;
  targetModel: string; // "Gym", "Trainer", "User", "Conversation", etc.

  // Details of the action
  details?: Record<string, any>;

  // Request context
  ipAddress?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AuditLogSchema - MongoDB Schema definition
 * Features:
 * - Track all admin actions
 * - Store what was changed and why
 * - IP address logging for security
 * - Flexible details field for different action types
 * - Automatic timestamps
 * - Efficient indexes for auditing
 */
const AuditLogSchema = new Schema<IAuditLog>(
  {
    // ===== WHO PERFORMED THE ACTION =====
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Admin user ID is required"],
      index: true,
    },

    // ===== WHAT ACTION WAS PERFORMED =====
    action: {
      type: String,
      required: [true, "Action is required"],
      trim: true,
      index: true,
      // Examples: "verified_gym", "rejected_trainer", "suspended_user", "deleted_message"
    },

    // ===== WHAT WAS AFFECTED =====
    targetId: {
      type: Schema.Types.ObjectId,
      required: [true, "Target ID is required"],
      index: true,
    },
    targetModel: {
      type: String,
      required: [true, "Target model is required"],
      trim: true,
      index: true,
    },

    // ===== DETAILS OF THE ACTION =====
    /**
     * Flexible object to store details relevant to the action
     * Examples:
     * - For verified_gym: { status: "verified", gymName: "..." }
     * - For rejected_trainer: { reason: "...", rejectedBy: "admin_name" }
     * - For suspended_user: { duration: "permanent", reason: "..." }
     */
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // ===== REQUEST CONTEXT =====
    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ===== INDEXES =====
// Index for finding all actions by an admin
AuditLogSchema.index({ performedBy: 1, createdAt: -1 });
// Index for finding all actions on a specific target
AuditLogSchema.index({ targetId: 1, targetModel: 1 });
// Compound index for action history
AuditLogSchema.index({ action: 1, createdAt: -1 });
// Index for time-range queries
AuditLogSchema.index({ createdAt: -1 });
// TTL index to auto-delete logs after 1 year (optional)
// Uncomment if you want automatic cleanup
// AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

// Export model
export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)
