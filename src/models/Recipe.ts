import mongoose, { Document, Schema } from "mongoose";

/**
 * IRecipe Interface - Defines the Recipe document structure
 * Represents nutritional recipes with macro/micro nutrient tracking
 */
export interface IRecipe extends Document {
    // Basic Info
    title: string;
    imageUrl: string;
    mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack";
    prepTimeMinutes: number;
    
    // Nutrition (macros)
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    
    // Recipe Details
    ingredients: string[];
    instructions: string[];
    
    // ─ SPOONACULAR SOURCE TRACKING ─
    spoonacularId?: number;
    dataSource?: "manual" | "spoonacular";

    // ─ EXTENDED RECIPE INFO ─
    readyInMinutes?: number;
    servings?: number;
    sourceUrl?: string;
    summary?: string;  // HTML string from Spoonacular

    // ─ DIETARY TAGS ─
    cuisines?: string[];
    dishTypes?: string[];
    diets?: string[];
    occasions?: string[];

    // ─ STRUCTURED INGREDIENTS ─
    extendedIngredients?: Array<{
        spoonacularIngredientId?: number;
        name: string;
        nameClean?: string;
        amount?: number;
        unit?: string;
        originalString?: string;
        imageUrl?: string;
    }>;

    // ─ STEP-BY-STEP INSTRUCTIONS ─
    analyzedInstructions?: Array<{
        sectionName?: string;
        steps: Array<{
            stepNumber: number;
            stepText: string;
            ingredientsUsed?: Array<{ name: string; imageUrl?: string }>;
            equipmentUsed?: Array<{ name: string; imageUrl?: string }>;
        }>;
    }>;

    // ─ EXTENDED NUTRITION ─
    fullNutrition?: {
        nutrients: Array<{
            name: string;
            amount: number;
            unit: string;
            percentOfDailyNeeds?: number;
        }>;
        caloricBreakdown?: {
            percentProtein?: number;
            percentFat?: number;
            percentCarbs?: number;
        };
        weightPerServing?: {
            amount?: number;
            unit?: string;
        };
    };

    // ─ IMAGE TYPE ─
    imageType?: string;

    // ─ CACHE MANAGEMENT ─
    cachedAt?: Date;
    spoonacularFetchedAt?: Date;
    isFullyLoaded?: boolean;
    
    // Status & Audit
    isActive: boolean;
    createdBy?: mongoose.Schema.Types.ObjectId;
    updatedBy?: mongoose.Schema.Types.ObjectId;
    
    // Timestamps
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * RecipeSchema - MongoDB Schema definition
 * Features:
 * - Macro nutrient tracking (calories, protein, carbs, fat)
 * - Meal type enum validation
 * - Admin audit trail (createdBy, updatedBy)
 * - Soft delete via isActive flag
 * - Array fields for ingredients and instructions
 * - Numeric validation with min values
 * - Indexes for common queries
 * - Timestamps for auditing
 */
const RecipeSchema = new Schema<IRecipe>(
    {
        // ===== BASIC INFO =====
        title: {
            type: String,
            required: [true, "Recipe title is required"],
            trim: true,
            minlength: [3, "Title must be at least 3 characters"],
            maxlength: [150, "Title must be less than 150 characters"],
            index: true,
        },
        imageUrl: {
            type: String,
            default: "",
            trim: true,
        },
        mealType: {
            type: String,
            enum: {
                values: ["Breakfast", "Lunch", "Dinner", "Snack"],
                message: "{VALUE} is not a valid meal type"
            },
            required: [true, "Meal type is required"],
            index: true,
        },
        prepTimeMinutes: {
            type: Number,
            default: 0,
            min: [0, "Prep time cannot be negative"],
        },
        
        // ===== NUTRITION (MACROS) =====
        /**
         * All nutrition values in grams or calories
         * Validation ensures no negative values
         */
        calories: {
            type: Number,
            default: 0,
            min: [0, "Calories cannot be negative"],
            max: [10000, "Calories seems unrealistic"],
        },
        protein: {
            type: Number,
            default: 0,
            min: [0, "Protein cannot be negative"],
            max: [500, "Protein seems unrealistic"],
        },
        carbs: {
            type: Number,
            default: 0,
            min: [0, "Carbs cannot be negative"],
            max: [500, "Carbs seems unrealistic"],
        },
        fat: {
            type: Number,
            default: 0,
            min: [0, "Fat cannot be negative"],
            max: [200, "Fat seems unrealistic"],
        },
        
        // ===== RECIPE DETAILS =====
        ingredients: {
            type: [String],
            default: [],
            validate: {
                validator: function (v: string[]) {
                    return v.every(ing => ing && ing.trim().length > 0 && ing.length <= 200);
                },
                message: "Each ingredient must be 1-200 characters"
            }
        },
        instructions: {
            type: [String],
            default: [],
            validate: {
                validator: function (v: string[]) {
                    return v.every(inst => inst && inst.trim().length > 0 && inst.length <= 500);
                },
                message: "Each instruction must be 1-500 characters"
            }
        },

        // ===== SPOONACULAR SOURCE TRACKING =====
        spoonacularId: {
            type: Number,
            sparse: true
        },
        dataSource: {
            type: String,
            enum: ['manual', 'spoonacular'],
            default: 'manual'
        },

        // ===== EXTENDED RECIPE INFO =====
        readyInMinutes: { type: Number, default: 0 },
        servings: { type: Number, default: 1 },
        sourceUrl: { type: String, default: '' },
        summary: { type: String, default: '' },

        // ===== DIETARY TAGS =====
        cuisines: [{ type: String }],
        dishTypes: [{ type: String }],
        diets: [{ type: String }],
        occasions: [{ type: String }],

        // ===== STRUCTURED INGREDIENTS =====
        extendedIngredients: [{
            spoonacularIngredientId: Number,
            name: { type: String, required: true },
            nameClean: String,
            amount: Number,
            unit: String,
            originalString: String,
            imageUrl: String
        }],

        // ===== STEP-BY-STEP INSTRUCTIONS =====
        analyzedInstructions: [{
            sectionName: String,
            steps: [{
                stepNumber: Number,
                stepText: String,
                ingredientsUsed: [{
                    name: String,
                    imageUrl: String
                }],
                equipmentUsed: [{
                    name: String,
                    imageUrl: String
                }]
            }]
        }],

        // ===== EXTENDED NUTRITION =====
        fullNutrition: {
            nutrients: [{
                name: String,
                amount: Number,
                unit: String,
                percentOfDailyNeeds: Number
            }],
            caloricBreakdown: {
                percentProtein: Number,
                percentFat: Number,
                percentCarbs: Number
            },
            weightPerServing: {
                amount: Number,
                unit: String
            }
        },

        // ===== MEDIA =====
        imageType: { type: String, default: '' },

        // ===== CACHE MANAGEMENT =====
        cachedAt: { type: Date, default: Date.now },
        spoonacularFetchedAt: Date,
        isFullyLoaded: {
            type: Boolean,
            default: false
        },
        
        // Status & Audit
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ===== INDEXES =====
// Indexes for Spoonacular recipes
RecipeSchema.index({ spoonacularId: 1 }, { sparse: true });
RecipeSchema.index({ mealType: 1, isActive: 1 });
RecipeSchema.index({ diets: 1 });
RecipeSchema.index({ cuisines: 1 });
RecipeSchema.index({ dishTypes: 1 });
RecipeSchema.index({ 'fullNutrition.nutrients.name': 1 });
RecipeSchema.index({ cachedAt: 1 });
// Index for range queries (nutrient filtering)
RecipeSchema.index({ calories: 1, protein: 1, carbs: 1, fat: 1 });
// Full-text search index
RecipeSchema.index({
    title: 'text',
    summary: 'text',
    'extendedIngredients.name': 'text'
});
// Old indexes (keep for backward compatibility)
RecipeSchema.index({ isActive: 1, createdAt: -1 });

// ===== VIRTUALS =====
/**
 * Macro ratio calculation for nutrition insights
 */
RecipeSchema.virtual("macroRatio").get(function (this: IRecipe) {
    const totalMacros = (this.protein * 4) + (this.carbs * 4) + (this.fat * 9);
    if (totalMacros === 0) return { protein: 0, carbs: 0, fat: 0 };
    
    return {
        protein: ((this.protein * 4 / totalMacros) * 100).toFixed(1),
        carbs: ((this.carbs * 4 / totalMacros) * 100).toFixed(1),
        fat: ((this.fat * 9 / totalMacros) * 100).toFixed(1),
    };
});

// ===== MODEL EXPORT =====
export default mongoose.models.Recipe || mongoose.model<IRecipe>('Recipe', RecipeSchema)
