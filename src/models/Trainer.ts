import mongoose, { Document, Schema } from "mongoose";

/**
 * ITrainer Interface - Defines the Trainer document structure
 * Represents fitness trainer profiles with link to User accounts
 */
export interface ITrainer extends Document {
    // Profile
    name: string;
    bio?: string;
    country: string;
    phoneNumber?: string;
    specialty: string[];
    
    // Media
    avatarUrl: string;
    backgroundImageUrl: string;
    
    // Stats
    peopleTrained: number;
    trainingVideos: number;
    rating: number;
    
    // Status
    isFeatured: boolean;
    isActive: boolean;
    
    // Reference to User account
    userId?: mongoose.Schema.Types.ObjectId;
    
    // ===== NEW: GYM & VERIFICATION =====
    // Gym affiliation
    gymId?: mongoose.Schema.Types.ObjectId;
    gymName?: string;
    
    // Gym owner verification (first level)
    gymVerificationStatus: "pending" | "approved" | "rejected" | "not_required";
    gymVerifiedAt?: Date;
    gymVerifiedBy?: mongoose.Schema.Types.ObjectId;
    
    // Admin verification (final level)
    adminVerificationStatus: "pending" | "approved" | "rejected" | "suspended";
    adminVerifiedAt?: Date;
    adminVerifiedBy?: mongoose.Schema.Types.ObjectId;
    
    // Public visibility flag (only true when both gym + admin approved)
    isFullyVerified: boolean;
    
    // Professional documents
    certifications?: string[];
    governmentId?: string;
    profileVideoUrl?: string;
    
    // Professional info
    yearsOfExperience?: number;
    languages?: string[];
    
    // Availability
    availability?: {
      timezone?: string;
      slots?: Array<{
        day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
        startTime: string;
        endTime: string;
      }>;
    };
    
    // Chat stats
    totalChats: number;
    averageResponseTime?: number;
    chatRating: number;
    
    // Profile creation tracking
    createdByRole?: "self" | "gym_owner" | "admin";
    createdByUserId?: mongoose.Schema.Types.ObjectId;
    
    // Timestamps
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * TrainerSchema - MongoDB Schema definition
 * Features:
 * - Link to User model via userId reference
 * - Specialty as array for multiple specializations
 * - Stats validation (min/max for rating, non-negative for counts)
 * - Featured trainer flag for homepage
 * - Soft delete capability via isActive flag
 * - Automatic timestamps
 * - Indexes for performance
 */
const TrainerSchema = new Schema<ITrainer>(
    {
        // ===== PROFILE =====
        name: {
            type: String,
            required: [true, "Trainer name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"],
            maxlength: [100, "Name must be less than 100 characters"],
            index: true,
        },
        bio: {
            type: String,
            default: "",
            maxlength: [500, "Bio must be less than 500 characters"],
        },
        country: {
            type: String,
            required: [true, "Country is required"],
            trim: true,
            index: true,
        },
        phoneNumber: {
            type: String,
            default: "",
            trim: true,
        },
        specialty: {
            type: [String],
            default: [],
            validate: {
                validator: function (v: string[]) {
                    return v.every(s => s && s.length > 0 && s.length <= 50);
                },
                message: "Each specialty must be between 1 and 50 characters"
            }
        },
        
        // ===== MEDIA =====
        avatarUrl: {
            type: String,
            default: "",
            trim: true,
        },
        backgroundImageUrl: {
            type: String,
            default: "",
            trim: true,
        },
        
        // ===== STATS =====
        peopleTrained: {
            type: Number,
            default: 0,
            min: [0, "People trained cannot be negative"],
            index: true,
        },
        trainingVideos: {
            type: Number,
            default: 0,
            min: [0, "Training videos count cannot be negative"],
        },
        rating: {
            type: Number,
            default: 0,
            min: [0, "Rating cannot be less than 0"],
            max: [5, "Rating cannot be greater than 5"],
            index: true,
        },
        
        // ===== STATUS =====
        isFeatured: {
            type: Boolean,
            default: false,
            index: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        
        // ===== RELATIONSHIPS =====
        /**
         * Reference to User account
         * Links trainer profile to a user account for login/management
         */
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
            sparse: true,
            index: true,
        },
        
        // ===== GYM AFFILIATION =====
        /**
         * Reference to Gym
         * Trainer belongs to a specific gym
         */
        gymId: {
            type: Schema.Types.ObjectId,
            ref: "Gym",
            default: null,
            sparse: true,
            index: true,
        },
        // Denormalized gym name for faster queries
        gymName: {
            type: String,
            default: "",
        },
        
        // ===== GYM OWNER VERIFICATION (FIRST LEVEL) =====
        gymVerificationStatus: {
            type: String,
            enum: {
                values: ["pending", "approved", "rejected", "not_required"],
                message: "{VALUE} is not a valid gym verification status"
            },
            default: "pending",
            index: true,
        },
        gymVerifiedAt: {
            type: Date,
            default: null,
        },
        gymVerifiedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        
        // ===== ADMIN VERIFICATION (FINAL LEVEL) =====
        adminVerificationStatus: {
            type: String,
            enum: {
                values: ["pending", "approved", "rejected", "suspended"],
                message: "{VALUE} is not a valid admin verification status"
            },
            default: "pending",
            index: true,
        },
        adminVerifiedAt: {
            type: Date,
            default: null,
        },
        adminVerifiedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        
        // ===== VERIFICATION FLAG =====
        /**
         * True only when both gymVerificationStatus="approved" AND adminVerificationStatus="approved"
         * Controls public visibility
         */
        isFullyVerified: {
            type: Boolean,
            default: false,
            index: true,
        },
        
        // ===== DOCUMENTS =====
        certifications: {
            type: [String],
            default: [],
        },
        governmentId: {
            type: String,
            default: "",
        },
        profileVideoUrl: {
            type: String,
            default: "",
        },
        
        // ===== PROFESSIONAL INFO =====
        yearsOfExperience: {
            type: Number,
            default: 0,
            min: [0, "Years of experience cannot be negative"],
        },
        languages: {
            type: [String],
            default: [],
        },
        
        // ===== AVAILABILITY =====
        availability: {
            timezone: {
                type: String,
                default: "UTC",
            },
            slots: {
                type: [{
                    day: {
                        type: String,
                        enum: {
                            values: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
                            message: "{VALUE} is not a valid day"
                        }
                    },
                    startTime: String,
                    endTime: String,
                }],
                default: [],
            },
        },
        
        // ===== CHAT STATS =====
        totalChats: {
            type: Number,
            default: 0,
            min: [0, "Total chats cannot be negative"],
        },
        averageResponseTime: {
            type: Number,
            default: 0,
            min: [0, "Average response time cannot be negative"],
        },
        chatRating: {
            type: Number,
            default: 0,
            min: [0, "Chat rating cannot be less than 0"],
            max: [5, "Chat rating cannot be greater than 5"],
        },
        
        // ===== PROFILE CREATION TRACKING =====
        createdByRole: {
            type: String,
            enum: {
                values: ["self", "gym_owner", "admin"],
                message: "{VALUE} is not a valid creation role"
            },
            default: "self",
        },
        createdByUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
            sparse: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ===== INDEXES =====
// Compound index for featured trainers
TrainerSchema.index({ isFeatured: 1, rating: -1 });
// Compound index for active trainers sorted by rating
TrainerSchema.index({ isActive: 1, rating: -1 });
// Indexes for verification status
TrainerSchema.index({ gymVerificationStatus: 1, adminVerificationStatus: 1 });
// Index for fully verified public trainers
TrainerSchema.index({ isFullyVerified: 1, rating: -1 });
// Index for trainers by gym
TrainerSchema.index({ gymId: 1, isFullyVerified: 1 });
// Index for pending verifications (admin dashboard)
TrainerSchema.index({ adminVerificationStatus: 1, createdAt: -1 });

// ===== VIRTUALS =====
/**
 * Virtual field to get average rating or "No ratings yet"
 */
TrainerSchema.virtual("displayRating").get(function (this: ITrainer) {
    return this.rating > 0 ? this.rating.toFixed(1) : "New";
});

// ===== MODEL EXPORT =====
export default mongoose.models.Trainer || mongoose.model<ITrainer>('Trainer', TrainerSchema)
