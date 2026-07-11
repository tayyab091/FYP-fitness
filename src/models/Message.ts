import mongoose, { Document, Schema } from "mongoose";

/**
 * IMessage Interface - Defines the Message document structure
 * Represents individual messages in a conversation
 */
export interface IMessage extends Document {
  // Message relationship
  conversationId: mongoose.Schema.Types.ObjectId;
  senderId: mongoose.Schema.Types.ObjectId;
  receiverId: mongoose.Schema.Types.ObjectId;

  // Content
  content: string;

  // Message type
  type: "text" | "image" | "workout_plan" | "meal_plan" | "file";

  // Attached plans (optional)
  attachedPlan?: {
    planType: "workout" | "meal";
    planId: mongoose.Schema.Types.ObjectId;
  };

  // Read status
  isRead: boolean;
  readAt?: Date;
  isDeleted: boolean;

  // Free tier flag
  isFreeMessage: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MessageSchema - MongoDB Schema definition
 * Features:
 * - Support for different message types (text, images, plans)
 * - Read receipts with timestamps
 * - Soft delete capability
 * - Free tier message tracking
 * - Automatic timestamps
 * - Efficient indexes for queries
 */
const MessageSchema = new Schema<IMessage>(
  {
    // ===== MESSAGE RELATIONSHIP =====
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Conversation ID is required"],
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender ID is required"],
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Receiver ID is required"],
      index: true,
    },

    // ===== CONTENT =====
    content: {
      type: String,
      required: [true, "Message content is required"],
      maxlength: [2000, "Message must be less than 2000 characters"],
      trim: true,
    },

    // ===== MESSAGE TYPE =====
    type: {
      type: String,
      enum: {
        values: ["text", "image", "workout_plan", "meal_plan", "file"],
        message: "{VALUE} is not a valid message type",
      },
      default: "text",
    },

    // ===== ATTACHED PLANS =====
    /**
     * For sharing workout or meal plans in chat
     */
    attachedPlan: {
      planType: {
        type: String,
        enum: {
          values: ["workout", "meal"],
          message: "{VALUE} is not a valid plan type",
        },
      },
      planId: {
        type: Schema.Types.ObjectId,
        refPath: "attachedPlan.planType", // Dynamic reference
      },
    },

    // ===== READ STATUS =====
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // ===== FREE TIER TRACKING =====
    /**
     * Flag to track if this message was part of free tier 5 messages
     * Helps with analytics and auditing
     */
    isFreeMessage: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ===== INDEXES =====
// Compound index for conversation messages sorted by time
MessageSchema.index({ conversationId: 1, createdAt: -1 });
// Index for sender's messages
MessageSchema.index({ senderId: 1, createdAt: -1 });
// Compound index for unread messages
MessageSchema.index({ receiverId: 1, isRead: 1, createdAt: -1 });
// Index for deleted messages (soft delete queries)
MessageSchema.index({ isDeleted: 1, createdAt: -1 });
// Index for free message tracking (analytics)
MessageSchema.index({ isFreeMessage: 1, createdAt: -1 });

// Export model
export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema)
