import mongoose, { Document, Schema } from "mongoose";

/**
 * INotification Interface - Defines the Notification document structure
 * Represents in-app and email notifications for users
 */
export interface INotification extends Document {
  // Recipient
  userId: mongoose.Schema.Types.ObjectId;

  // Notification type
  type:
    | "gym_verified"
    | "gym_rejected"
    | "new_gym_application"
    | "trainer_gym_approved"
    | "trainer_verified"
    | "trainer_rejected"
    | "new_message"
    | "chat_limit_warning"
    | "chat_limit_reached"
    | "subscription_activated"
    | "subscription_expiring"
    | "new_trainer_application"
    | "nutrition_plan_pending"
    | "nutrition_plan_ready";

  // Content
  title: string;
  message: string;
  link?: string; // URL to navigate to when clicked

  // Status
  isRead: boolean;

  // Metadata (can store any extra info relevant to notification type)
  metadata?: Record<string, any>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * NotificationSchema - MongoDB Schema definition
 * Features:
 * - Type-based notifications for different events
 * - Read/unread tracking
 * - Navigation links for easy access
 * - Flexible metadata for different notification types
 * - Automatic timestamps
 * - Efficient indexes for queries
 */
const NotificationSchema = new Schema<INotification>(
  {
    // ===== RECIPIENT =====
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      sparse: true,
      index: true,
    },

    // ===== NOTIFICATION TYPE =====
    type: {
      type: String,
      enum: {
        values: [
          "gym_verified",
          "gym_rejected",
          "new_gym_application",
          "trainer_gym_approved",
          "trainer_verified",
          "trainer_rejected",
          "new_message",
          "chat_limit_warning",
          "chat_limit_reached",
          "subscription_activated",
          "subscription_expiring",
          "new_trainer_application",
          "nutrition_plan_pending",
          "nutrition_plan_ready",
        ],
        message: "{VALUE} is not a valid notification type",
      },
      required: [true, "Notification type is required"],
      index: true,
    },

    // ===== CONTENT =====
    title: {
      type: String,
      required: [true, "Title is required"],
      maxlength: [100, "Title must be less than 100 characters"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      maxlength: [500, "Message must be less than 500 characters"],
      trim: true,
    },
    link: {
      type: String,
      default: "",
      trim: true,
    },

    // ===== READ STATUS =====
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ===== METADATA =====
    /**
     * Flexible object to store extra information
     * Examples:
     * - For gym_verified: { gymId, gymName }
     * - For new_message: { senderId, senderName, conversationId }
     * - For subscription_expiring: { daysLeft, planName }
     */
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ===== INDEXES =====
// Compound index for user's notifications
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
// Index for unread count queries
NotificationSchema.index({ userId: 1, isRead: 1 });
// Index for notification type queries (useful for analytics)
NotificationSchema.index({ type: 1, createdAt: -1 });
// TTL index to auto-delete notifications after 30 days (optional)
// Uncomment if you want automatic cleanup
// NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// Export model
export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema)
