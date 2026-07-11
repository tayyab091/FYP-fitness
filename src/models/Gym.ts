import mongoose, { Document, Schema } from "mongoose";

/**
 * IGym Interface - Defines the Gym document structure
 * Represents fitness gym profiles with worldwide support
 */
export interface IGym extends Document {
  // Basic Info
  name: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;

  // Owner
  ownerId: mongoose.Schema.Types.ObjectId;

  // Location (supports worldwide gyms)
  address: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  // Contact
  email: string;
  phone?: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };

  // Verification (admin verifies gym is real)
  verificationStatus: "pending" | "under_review" | "verified" | "rejected" | "suspended";
  verificationDocuments?: string[]; // URLs to uploaded proof documents
  verificationNote?: string; // Admin note on rejection reason
  verifiedAt?: Date;
  verifiedBy?: mongoose.Schema.Types.ObjectId;

  // Trainers linked to this gym
  trainers: mongoose.Schema.Types.ObjectId[];

  // Subscription plan for gym on the platform
  platformPlan: "free" | "basic" | "pro" | "enterprise";

  // Settings
  isActive: boolean;
  memberCount: number;

  // Metadata
  timezone: string;
  currency: string;
  language: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GymSchema - MongoDB Schema definition
 * Features:
 * - Complete worldwide gym support with coordinates
 * - Two-tier verification: pending → under_review → verified/rejected
 * - Subscription plans for gyms
 * - Trainer management
 * - Social media integration
 * - Automatic timestamps and indexes
 */
const GymSchema = new Schema<IGym>(
  {
    // ===== BASIC INFO =====
    name: {
      type: String,
      required: [true, "Gym name is required"],
      trim: true,
      minlength: [2, "Gym name must be at least 2 characters"],
      maxlength: [100, "Gym name must be less than 100 characters"],
      index: true,
    },
    description: {
      type: String,
      default: "",
      maxlength: [1000, "Description must be less than 1000 characters"],
    },
    logoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    coverImageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // ===== OWNER =====
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner ID is required"],
    },

    // ===== LOCATION (WORLDWIDE) =====
    address: {
      street: {
        type: String,
        default: "",
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
        index: true,
      },
      state: {
        type: String,
        default: "",
        trim: true,
      },
      country: {
        type: String,
        required: [true, "Country is required"],
        trim: true,
        index: true,
      },
      postalCode: {
        type: String,
        default: "",
        trim: true,
      },
      coordinates: {
        lat: {
          type: Number,
          default: null,
        },
        lng: {
          type: Number,
          default: null,
        },
      },
    },

    // ===== CONTACT =====
    email: {
      type: String,
      required: [true, "Gym email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
      index: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    website: {
      type: String,
      default: "",
      trim: true,
    },
    socialMedia: {
      instagram: {
        type: String,
        default: "",
        trim: true,
      },
      facebook: {
        type: String,
        default: "",
        trim: true,
      },
      twitter: {
        type: String,
        default: "",
        trim: true,
      },
      youtube: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // ===== VERIFICATION =====
    verificationStatus: {
      type: String,
      enum: {
        values: ["pending", "under_review", "verified", "rejected", "suspended"],
        message: "{VALUE} is not a valid verification status",
      },
      default: "pending",
    },
    verificationDocuments: {
      type: [String],
      default: [],
    },
    verificationNote: {
      type: String,
      default: "",
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ===== TRAINERS =====
    trainers: {
      type: [Schema.Types.ObjectId],
      ref: "Trainer",
      default: [],
    },

    // ===== SUBSCRIPTION PLAN =====
    platformPlan: {
      type: String,
      enum: {
        values: ["free", "basic", "pro", "enterprise"],
        message: "{VALUE} is not a valid platform plan",
      },
      default: "free",
      index: true,
    },

    // ===== SETTINGS =====
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    memberCount: {
      type: Number,
      default: 0,
      min: [0, "Member count cannot be negative"],
    },

    // ===== METADATA =====
    timezone: {
      type: String,
      default: "UTC",
      trim: true,
    },
    currency: {
      type: String,
      default: "USD",
      trim: true,
    },
    language: {
      type: String,
      default: "en",
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
// Compound index for country and city (important for worldwide search)
GymSchema.index({ "address.country": 1, "address.city": 1 });
// Index for owner lookup
GymSchema.index({ ownerId: 1 });
// Index for verification status
GymSchema.index({ verificationStatus: 1 });
// Full-text search index for name and location
GymSchema.index({
  name: "text",
  "address.city": "text",
  "address.country": "text",
});
// Compound index for active verified gyms
GymSchema.index({ isActive: 1, verificationStatus: 1 });

// Export model
export default mongoose.models.Gym || mongoose.model<IGym>('Gym', GymSchema)
