import mongoose, { Schema, Document } from "mongoose";

/**
 * ITrainerClientRelationship Interface
 * 
 * Defines the structure of trainer-client relationships
 * Enforces privacy: ONLY connected user-trainer pairs can communicate
 * 
 * Key Rules:
 * - One relationship per user-trainer pair (unique compound index)
 * - Both must agree for relationship to become "active"
 * - Controls what each party can access (accessFlags)
 * - Tracks free messages for free tier users
 */
export interface ITrainerClientRelationship extends Document {
    // Core IDs
    trainerId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    gymId?: mongoose.Types.ObjectId;

    // How the relationship started
    initiatedBy: "user" | "trainer" | "gym_owner" | "admin";

    // Relationship Status
    status:
        | "pending" // user requested, trainer hasn't responded
        | "active" // both confirmed, full access
        | "paused" // temporarily paused
        | "terminated" // ended by either party
        | "rejected"; // trainer rejected

    // Termination tracking
    terminatedBy?: mongoose.Types.ObjectId;
    terminationReason?: string;
    terminatedAt?: Date;

    // Granular access control
    accessFlags: {
        canChat: boolean; // can message each other
        canViewSchedule: boolean; // user sees trainer's schedule
        canViewProgress: boolean; // trainer sees user's progress
        canEditSchedule: boolean; // trainer can modify user's plan
        canViewNutrition: boolean; // trainer can see meal logs
    };

    // Linked data
    assignedPlanId?: mongoose.Types.ObjectId; // ref: WorkoutPlan
    conversationId?: mongoose.Types.ObjectId; // ref: Conversation

    // Free chat tracking (only for free tier users)
    freeMessagesUsed: number;
    freeMessagesLimit: number; // default 5

    // Timestamps
    requestedAt: Date;
    acceptedAt?: Date;
    notes?: string; // trainer's private notes (select: false)

    // System
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TrainerClientRelationshipSchema = new Schema<ITrainerClientRelationship>(
    {
        // ===== CORE IDs =====
        trainerId: {
            type: Schema.Types.ObjectId,
            ref: "Trainer",
            required: [true, "Trainer ID is required"],
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
            index: true,
        },
        gymId: {
            type: Schema.Types.ObjectId,
            ref: "Gym",
        },

        // ===== INITIATION =====
        initiatedBy: {
            type: String,
            enum: {
                values: ["user", "trainer", "gym_owner", "admin"],
                message: "{VALUE} is not a valid initiator type",
            },
            required: true,
        },

        // ===== STATUS =====
        status: {
            type: String,
            enum: {
                values: ["pending", "active", "paused", "terminated", "rejected"],
                message: "{VALUE} is not a valid status",
            },
            default: "pending",
            index: true,
        },

        // ===== TERMINATION =====
        terminatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        terminationReason: String,
        terminatedAt: Date,

        // ===== ACCESS CONTROL =====
        accessFlags: {
            canChat: {
                type: Boolean,
                default: false,
            },
            canViewSchedule: {
                type: Boolean,
                default: false,
            },
            canViewProgress: {
                type: Boolean,
                default: false,
            },
            canEditSchedule: {
                type: Boolean,
                default: false,
            },
            canViewNutrition: {
                type: Boolean,
                default: false,
            },
        },

        // ===== LINKED DATA =====
        assignedPlanId: {
            type: Schema.Types.ObjectId,
            ref: "WorkoutPlan",
        },
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
        },

        // ===== FREE CHAT TRACKING =====
        freeMessagesUsed: {
            type: Number,
            default: 0,
            min: [0, "Cannot have negative messages used"],
        },
        freeMessagesLimit: {
            type: Number,
            default: 5,
            min: [1, "Free message limit must be at least 1"],
        },

        // ===== TIMESTAMPS =====
        requestedAt: {
            type: Date,
            default: Date.now,
            required: true,
        },
        acceptedAt: Date,
        notes: {
            type: String,
            select: false, // Hidden by default, only show when explicitly requested
        },

        // ===== SYSTEM =====
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true, // createdAt, updatedAt
    }
);

// Compound unique index: one relationship per user-trainer pair
TrainerClientRelationshipSchema.index(
    { trainerId: 1, userId: 1 },
    { unique: true, sparse: true }
);

// Common query patterns
TrainerClientRelationshipSchema.index({ userId: 1, status: 1 });
TrainerClientRelationshipSchema.index({ trainerId: 1, status: 1 });
TrainerClientRelationshipSchema.index({ gymId: 1 });
TrainerClientRelationshipSchema.index({ conversationId: 1 });
TrainerClientRelationshipSchema.index({ createdAt: -1 });

export default mongoose.models.TrainerClientRelationship || mongoose.model<ITrainerClientRelationship>('TrainerClientRelationship', TrainerClientRelationshipSchema)
