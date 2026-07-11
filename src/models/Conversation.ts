import mongoose, { Document, Schema } from "mongoose";

/**
 * IConversation Interface - Defines the Conversation document structure
 * Represents a chat conversation between a user and trainer
 */
export interface IConversation extends Document {
  // Participants
  participants: Array<{
    userId: mongoose.Schema.Types.ObjectId;
    role: "user" | "trainer" | "gym_owner";
    lastSeen?: Date;
    isTyping: boolean;
  }>;

  // Trainer reference
  trainerId: mongoose.Schema.Types.ObjectId;

  // Free tier tracking
  isFreeChat: boolean;
  freeMessageCount: number;

  // Last message info
  lastMessage?: {
    content: string;
    sentAt: Date;
    sentBy: mongoose.Schema.Types.ObjectId;
  };

  // Status
  status: "active" | "archived" | "blocked";

  // Unread counts
  unreadCount: {
    user: number;
    trainer: number;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ConversationSchema - MongoDB Schema definition
 * Features:
 * - Multi-participant support (user + trainer)
 * - Free chat usage tracking
 * - Last message caching for UI
 * - Typing indicators
 * - Unread message counts per participant
 * - Status management (active, archived, blocked)
 */
const ConversationSchema = new Schema<IConversation>(
  {
    // ===== PARTICIPANTS =====
    participants: {
      type: [
        {
          userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          role: {
            type: String,
            enum: ["user", "trainer", "gym_owner"],
            required: true,
          },
          lastSeen: {
            type: Date,
            default: () => new Date(),
          },
          isTyping: {
            type: Boolean,
            default: false,
          },
        },
      ],
      required: true,
      validate: {
        validator: function (v: any[]) {
          return v.length >= 2;
        },
        message: "Conversation must have at least 2 participants",
      },
    },

    // ===== TRAINER REFERENCE =====
    trainerId: {
      type: Schema.Types.ObjectId,
      ref: "Trainer",
      required: true,
      index: true,
    },

    // ===== FREE CHAT TRACKING =====
    isFreeChat: {
      type: Boolean,
      default: false,
      index: true,
    },
    freeMessageCount: {
      type: Number,
      default: 0,
      min: [0, "Free message count cannot be negative"],
    },

    // ===== LAST MESSAGE CACHE =====
    lastMessage: {
      content: String,
      sentAt: Date,
      sentBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },

    // ===== STATUS =====
    status: {
      type: String,
      enum: {
        values: ["active", "archived", "blocked"],
        message: "{VALUE} is not a valid conversation status",
      },
      default: "active",
      index: true,
    },

    // ===== UNREAD COUNTS =====
    unreadCount: {
      user: {
        type: Number,
        default: 0,
        min: [0, "User unread count cannot be negative"],
      },
      trainer: {
        type: Number,
        default: 0,
        min: [0, "Trainer unread count cannot be negative"],
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ===== INDEXES =====
// Compound index for finding user's conversations
ConversationSchema.index({ "participants.userId": 1, status: 1 });
// Index for trainer conversations
ConversationSchema.index({ trainerId: 1, status: 1 });
// Index for free chats (admin analytics)
ConversationSchema.index({ isFreeChat: 1, createdAt: -1 });
// Index for recent conversations
ConversationSchema.index({ updatedAt: -1 });

// ===== VIRTUALS =====
/**
 * Virtual: total unread count
 */
ConversationSchema.virtual("totalUnreadCount").get(function (this: IConversation) {
  return this.unreadCount.user + this.unreadCount.trainer;
});

// Export model
export default mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema)
