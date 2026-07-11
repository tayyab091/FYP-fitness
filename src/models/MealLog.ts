import mongoose, { Schema, Document } from "mongoose";

/**
 * IMealLog Interface
 * 
 * Tracks meals eaten by users for nutrition monitoring
 * Trainers can review and provide feedback on nutrition
 */
export interface IMealLog extends Document {
    userId: mongoose.Types.ObjectId;
    trainerId?: mongoose.Types.ObjectId;
    relationshipId: mongoose.Types.ObjectId;

    loggedAt: Date;
    mealType:
        | "breakfast"
        | "morning_snack"
        | "lunch"
        | "afternoon_snack"
        | "dinner"
        | "late_snack";

    // Food items in this meal
    foods: Array<{
        name: string;
        recipeId?: mongoose.Types.ObjectId;
        servingSize: number; // grams
        servingUnit: string; // 'g', 'ml', 'piece', 'cup'
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber?: number;
    }>;

    // Daily totals (auto-calculated)
    totals: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber?: number;
    };

    waterIntakeMl?: number;
    notes?: string;

    // Trainer review
    trainerReview?: {
        comment: string;
        reviewedAt: Date;
    };

    createdAt: Date;
    updatedAt: Date;
}

const FoodItemSchema = new Schema(
    {
        name: { type: String, required: true },
        recipeId: { type: Schema.Types.ObjectId, ref: "Recipe" },
        servingSize: { type: Number, required: true },
        servingUnit: { type: String, required: true },
        calories: { type: Number, required: true },
        protein: { type: Number, required: true },
        carbs: { type: Number, required: true },
        fat: { type: Number, required: true },
        fiber: Number,
    },
    { _id: false }
);

const MacroTotalsSchema = new Schema(
    {
        calories: { type: Number, default: 0 },
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fat: { type: Number, default: 0 },
        fiber: { type: Number, default: 0 },
    },
    { _id: false }
);

const TrainerReviewSchema = new Schema(
    {
        comment: String,
        reviewedAt: Date,
    },
    { _id: false }
);

const MealLogSchema = new Schema<IMealLog>(
    {
        // ===== OWNERSHIP =====
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        trainerId: {
            type: Schema.Types.ObjectId,
            ref: "Trainer",
            index: true,
        },
        relationshipId: {
            type: Schema.Types.ObjectId,
            ref: "TrainerClientRelationship",
            required: true,
        },

        // ===== WHEN & WHAT =====
        loggedAt: {
            type: Date,
            default: Date.now,
            required: true,
            index: true,
        },
        mealType: {
            type: String,
            enum: {
                values: [
                    "breakfast",
                    "morning_snack",
                    "lunch",
                    "afternoon_snack",
                    "dinner",
                    "late_snack",
                ],
                message: "{VALUE} is not a valid meal type",
            },
            required: true,
        },

        // ===== FOODS =====
        foods: [FoodItemSchema],

        // ===== TOTALS =====
        totals: {
            type: MacroTotalsSchema,
            required: true,
        },

        // ===== HYDRATION & NOTES =====
        waterIntakeMl: Number,
        notes: String,

        // ===== TRAINER REVIEW =====
        trainerReview: TrainerReviewSchema,
    },
    {
        timestamps: true,
    }
);

// Indexes
MealLogSchema.index({ userId: 1, loggedAt: -1 });
MealLogSchema.index({ trainerId: 1 });
MealLogSchema.index({ mealType: 1 });

export default mongoose.models.MealLog || mongoose.model<IMealLog>('MealLog', MealLogSchema)
