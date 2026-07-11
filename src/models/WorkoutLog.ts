import mongoose, { Schema, Document } from "mongoose";

/**
 * IWorkoutLog Interface
 * 
 * Tracks actual workouts completed by users
 * Records what exercises were actually done vs what was planned
 * Trainer can review and provide feedback
 */
export interface IWorkoutLog extends Document {
    // Who and what
    userId: mongoose.Types.ObjectId;
    trainerId?: mongoose.Types.ObjectId;
    planId: mongoose.Types.ObjectId;
    relationshipId: mongoose.Types.ObjectId;

    // When
    scheduledDate: Date; // day it was supposed to happen
    completedDate?: Date; // day user actually did it
    dayOfWeek?: string;
    sessionName?: string;

    // Status
    status: "pending" | "in_progress" | "completed" | "skipped" | "missed";

    // Time tracking
    startedAt?: Date;
    finishedAt?: Date;
    durationMinutes?: number;

    // Exercises performed
    exercises: Array<{
        exerciseId: mongoose.Types.ObjectId;
        exerciseName: string;
        plannedSets: number;
        plannedReps: number;
        plannedWeight?: number;
        completedSets: Array<{
            setNumber: number;
            reps: number;
            weight: number;
            duration?: number;
            rpe?: number; // Rate of Perceived Exertion (1-10)
            notes?: string;
            completedAt?: Date;
        }>;
        wasSkipped: boolean;
        skipReason?: string;
    }>;

    // User feedback
    userFeedback?: {
        energyLevel: number; // 1-5
        difficultyLevel: number; // 1-5
        moodAfter: number; // 1-5
        notes?: string;
    };

    // Trainer review
    trainerReview?: {
        comment: string;
        reviewedAt: Date;
        reviewedBy: mongoose.Types.ObjectId;
    };

    // Calculated metrics
    metrics?: {
        totalVolume: number;
        completionRate: number;
        totalCalories?: number;
    };

    createdAt: Date;
    updatedAt: Date;
}

const CompletedSetSchema = new Schema(
    {
        setNumber: Number,
        reps: Number,
        weight: Number,
        duration: Number,
        rpe: { type: Number, min: 1, max: 10 },
        notes: String,
        completedAt: Date,
    },
    { _id: false }
);

const ExerciseLogSchema = new Schema(
    {
        exerciseId: {
            type: Schema.Types.ObjectId,
            ref: "Exercise",
        },
        exerciseName: String,
        plannedSets: Number,
        plannedReps: Number,
        plannedWeight: Number,
        completedSets: [CompletedSetSchema],
        wasSkipped: { type: Boolean, default: false },
        skipReason: String,
    },
    { _id: false }
);

const WorkoutLogSchema = new Schema<IWorkoutLog>(
    {
        // ===== OWNERSHIP =====
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        trainerId: {
            type: Schema.Types.ObjectId,
            ref: "Trainer",
        },
        planId: {
            type: Schema.Types.ObjectId,
            ref: "WorkoutPlan",
            required: true,
            index: true,
        },
        relationshipId: {
            type: Schema.Types.ObjectId,
            ref: "TrainerClientRelationship",
            required: true,
        },

        // ===== WHEN =====
        scheduledDate: {
            type: Date,
            required: true,
            index: true,
        },
        completedDate: Date,
        dayOfWeek: String,
        sessionName: String,

        // ===== STATUS =====
        status: {
            type: String,
            enum: {
                values: ["pending", "in_progress", "completed", "skipped", "missed"],
                message: "{VALUE} is not a valid status",
            },
            default: "pending",
            index: true,
        },

        // ===== TIME TRACKING =====
        startedAt: Date,
        finishedAt: Date,
        durationMinutes: Number,

        // ===== EXERCISES =====
        exercises: [ExerciseLogSchema],

        // ===== USER FEEDBACK =====
        userFeedback: {
            energyLevel: { type: Number, min: 1, max: 5 },
            difficultyLevel: { type: Number, min: 1, max: 5 },
            moodAfter: { type: Number, min: 1, max: 5 },
            notes: String,
        },

        // ===== TRAINER REVIEW =====
        trainerReview: {
            comment: String,
            reviewedAt: Date,
            reviewedBy: {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        },

        // ===== METRICS =====
        metrics: {
            totalVolume: Number,
            completionRate: Number,
            totalCalories: Number,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
WorkoutLogSchema.index({ userId: 1, scheduledDate: -1 });
WorkoutLogSchema.index({ trainerId: 1, scheduledDate: -1 });
WorkoutLogSchema.index({ userId: 1, status: 1 });
WorkoutLogSchema.index({ completedDate: -1 });

export default mongoose.models.WorkoutLog || mongoose.model<IWorkoutLog>('WorkoutLog', WorkoutLogSchema)
