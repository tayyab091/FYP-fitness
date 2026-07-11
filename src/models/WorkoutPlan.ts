import mongoose, { Schema, Document } from "mongoose";

/**
 * IWorkoutPlan Interface
 * 
 * Represents a custom workout plan created by trainer for a specific user
 * Contains weekly schedule with exercises, sets, reps, etc.
 */
export interface IWorkoutPlan extends Document {
    // Ownership
    trainerId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    relationshipId: mongoose.Types.ObjectId;
    gymId?: mongoose.Types.ObjectId;

    // Plan Info
    title: string;
    description?: string;
    goal:
        | "weight_loss"
        | "muscle_gain"
        | "endurance"
        | "flexibility"
        | "general_fitness"
        | "rehabilitation";
    level: "beginner" | "intermediate" | "advanced";

    // Duration
    durationWeeks: number;
    startDate?: Date;
    endDate?: Date;

    // Weekly Schedule (7 days)
    weeklySchedule: Array<{
        dayOfWeek:
            | "monday"
            | "tuesday"
            | "wednesday"
            | "thursday"
            | "friday"
            | "saturday"
            | "sunday";
        isRestDay: boolean;
        sessionName?: string;
        targetMuscles?: string[];
        estimatedDuration?: number; // minutes
        exercises: Array<{
            exerciseId: mongoose.Types.ObjectId;
            exerciseName: string;
            sets: number;
            reps: number;
            duration?: number; // seconds
            restSeconds: number;
            weight?: number; // kg
            notes?: string;
            order: number;
        }>;
        notes?: string;
    }>;

    // Status
    status: "draft" | "active" | "completed" | "paused" | "cancelled";

    // Notes
    trainerNotes?: string;
    userNotes?: string;

    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ExerciseInPlanSchema = new Schema(
    {
        exerciseId: {
            type: Schema.Types.ObjectId,
            ref: "Exercise",
            required: true,
        },
        exerciseName: String,
        sets: { type: Number, default: 3, min: 1 },
        reps: { type: Number, default: 10, min: 1 },
        duration: Number, // seconds
        restSeconds: { type: Number, default: 60, min: 0 },
        weight: Number, // kg
        notes: String,
        order: { type: Number, default: 0 },
    },
    { _id: false }
);

const DayScheduleSchema = new Schema(
    {
        dayOfWeek: {
            type: String,
            enum: [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
            ],
            required: true,
        },
        isRestDay: { type: Boolean, default: false },
        sessionName: String,
        targetMuscles: [String],
        estimatedDuration: Number,
        exercises: [ExerciseInPlanSchema],
        notes: String,
    },
    { _id: false }
);

const WorkoutPlanSchema = new Schema<IWorkoutPlan>(
    {
        // ===== OWNERSHIP =====
        trainerId: {
            type: Schema.Types.ObjectId,
            ref: "Trainer",
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        relationshipId: {
            type: Schema.Types.ObjectId,
            ref: "TrainerClientRelationship",
            required: true,
        },
        gymId: {
            type: Schema.Types.ObjectId,
            ref: "Gym",
        },

        // ===== PLAN INFO =====
        title: {
            type: String,
            required: [true, "Plan title is required"],
            trim: true,
            minlength: [3, "Title must be at least 3 characters"],
            maxlength: [100, "Title must be less than 100 characters"],
        },
        description: String,
        goal: {
            type: String,
            enum: {
                values: [
                    "weight_loss",
                    "muscle_gain",
                    "endurance",
                    "flexibility",
                    "general_fitness",
                    "rehabilitation",
                ],
                message: "{VALUE} is not a valid goal",
            },
            required: true,
        },
        level: {
            type: String,
            enum: {
                values: ["beginner", "intermediate", "advanced"],
                message: "{VALUE} is not a valid level",
            },
            default: "beginner",
        },

        // ===== DURATION =====
        durationWeeks: {
            type: Number,
            required: true,
            min: [1, "Duration must be at least 1 week"],
            max: [52, "Duration cannot exceed 52 weeks"],
        },
        startDate: Date,
        endDate: Date,

        // ===== WEEKLY SCHEDULE =====
        weeklySchedule: [DayScheduleSchema],

        // ===== STATUS =====
        status: {
            type: String,
            enum: {
                values: ["draft", "active", "completed", "paused", "cancelled"],
                message: "{VALUE} is not a valid status",
            },
            default: "draft",
            index: true,
        },

        // ===== NOTES =====
        trainerNotes: String,
        userNotes: String,

        // ===== SYSTEM =====
        isActive: { type: Boolean, default: true, index: true },
    },
    {
        timestamps: true,
    }
);

// Indexes
WorkoutPlanSchema.index({ trainerId: 1, userId: 1 });
WorkoutPlanSchema.index({ userId: 1, status: 1 });
WorkoutPlanSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.models.WorkoutPlan || mongoose.model<IWorkoutPlan>('WorkoutPlan', WorkoutPlanSchema)
