import mongoose, { Schema, Document } from 'mongoose'

/**
 * IDailyNutritionPlan Interface
 * 
 * Trainer creates a daily meal plan for each client for a specific calendar date
 * Each day can have a different plan
 * Plan must be approved by trainer before user sees it
 * User tracks actual eaten food in MealLog (separate model)
 */
export interface IDailyNutritionPlan extends Document {
    // Who this plan is for
    userId:         mongoose.Types.ObjectId;
    trainerId:      mongoose.Types.ObjectId;
    relationshipId: mongoose.Types.ObjectId;

    // The specific calendar date this plan is for
    planDate:    string;   // YYYY-MM-DD format
    dayOfWeek:   string;   // "monday", "tuesday", etc.

    // The meals for this day
    meals: Array<{
        mealType:   'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'late_snack';
        mealLabel?: string;        // e.g. "Post-workout breakfast"
        targetTimeHH?: string;     // e.g. "08:00"

        // Food items in this meal
        items: Array<{
            wgerIngredientId:  number;
            ingredientName:    string;
            brand?:            string;
            imageUrl?:         string;
            thumbnailUrl?:     string;

            servingAmountG:    number;
            servingUnit:       string;

            // Nutrition scaled to serving size
            caloriesForServing: number;
            proteinForServing: number;
            carbsForServing:   number;
            fatForServing:     number;
            fiberForServing:   number;

            notes?: string;
        }>;

        // Totals for this meal
        totalCalories: number;
        totalProtein:  number;
        totalCarbs:    number;
        totalFat:      number;
        totalFiber:    number;
    }>;

    // Daily totals
    dailyTotals: {
        targetCalories: number;
        targetProtein:  number;
        targetCarbs:    number;
        targetFat:      number;
        targetFiber:    number;
    };

    // Trainer goals for this day
    goals?: {
        calorieTarget?: number;
        proteinTarget?: number;
        carbTarget?:    number;
        fatTarget?:     number;
        notes?:         string;
        focusGoal?:     string;     // e.g. "High protein day", "Recovery day"
    };

    // Approval workflow
    status: 'draft' | 'pending' | 'approved' | 'active' | 'completed';
    alertSentAt?:    Date;
    approvedAt?:     Date;
    trainerNotes?:   string;

    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Nested schemas
const PlannedMealItemSchema = new Schema({
    wgerIngredientId:  { type: Number, required: true },
    ingredientName:    { type: String, required: true },
    brand:             String,
    imageUrl:          String,
    thumbnailUrl:      String,

    servingAmountG:    { type: Number, required: true },
    servingUnit:       { type: String, default: 'g' },

    caloriesForServing: Number,
    proteinForServing: Number,
    carbsForServing:   Number,
    fatForServing:     Number,
    fiberForServing:   Number,

    notes: String
}, { _id: false })

const PlannedMealSchema = new Schema({
    mealType: {
        type: String,
        enum: ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'late_snack'],
        required: true
    },
    mealLabel:    String,
    targetTimeHH: String,
    items:        [PlannedMealItemSchema],

    totalCalories: Number,
    totalProtein:  Number,
    totalCarbs:    Number,
    totalFat:      Number,
    totalFiber:    Number
}, { _id: false })

const DailyNutritionPlanSchema = new Schema<IDailyNutritionPlan>(
    {
        // Who this plan is for
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        trainerId: {
            type: Schema.Types.ObjectId,
            ref: 'Trainer',
            required: true,
            index: true
        },
        relationshipId: {
            type: Schema.Types.ObjectId,
            ref: 'TrainerClientRelationship'
        },

        // The specific calendar date
        planDate: {
            type: String,
            required: true,
            index: true
        },
        dayOfWeek: String,

        // Meals
        meals: [PlannedMealSchema],

        // Daily totals
        dailyTotals: {
            targetCalories: Number,
            targetProtein:  Number,
            targetCarbs:    Number,
            targetFat:      Number,
            targetFiber:    Number
        },

        // Goals
        goals: {
            calorieTarget: Number,
            proteinTarget: Number,
            carbTarget:    Number,
            fatTarget:     Number,
            notes:         String,
            focusGoal:     String
        },

        // Approval workflow
        status: {
            type: String,
            enum: ['draft', 'pending', 'approved', 'active', 'completed'],
            default: 'draft',
            index: true
        },
        alertSentAt:    Date,
        approvedAt:     Date,
        trainerNotes:   String,

        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
)

// Compound unique index: one plan per user per date
DailyNutritionPlanSchema.index({ userId: 1, planDate: 1 }, { unique: true })
DailyNutritionPlanSchema.index({ trainerId: 1, planDate: 1 })
DailyNutritionPlanSchema.index({ planDate: 1, status: 1 })

export default mongoose.models.DailyNutritionPlan || mongoose.model<IDailyNutritionPlan>('DailyNutritionPlan', DailyNutritionPlanSchema)