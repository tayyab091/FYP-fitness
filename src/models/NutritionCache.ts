import mongoose, { Schema, Document } from "mongoose";

/**
 * INutritionItem Interface
 * Represents a single food item with its nutritional values
 * Now includes complete wger fields for rich food data
 */
export interface INutritionItem {
    // wger IDs
    wgerIngredientId?: number;
    wgerUuid?: string;

    // Names
    name:        string;
    commonName?: string;
    brand?:      string;
    sourceName?: string;

    // Nutrition (per 100g by default)
    calories?: number;
    protein_g?: number;
    carbohydrates_total_g?: number;
    carbohydrates_sugar_g?: number;
    fat_total_g?: number;
    fat_saturated_g?: number;
    fiber_g?: number;
    sodium_g?: number;

    // Alternative serving size
    serving_size_g?: number;
    potassium_mg?: number;
    cholesterol_mg?: number;

    // Legacy fields for backward compatibility
    sugar_g?: number;

    // Dietary info
    isVegan?: boolean | null;
    isVegetarian?: boolean | null;
    nutriscore?: string;

    // Weight units
    weightUnits?: Array<{
        unitId: number;
        gram: number;
        name: string;
    }>;

    // Images
    imageUrl?: string;
    thumbnails?: {
        small?: string;
        smallCropped?: string;
        medium?: string;
        mediumCropped?: string;
        large?: string;
    };

    // Source
    source?: 'api_ninjas' | 'wger' | 'manual';
}

/**
 * INutritionCache Interface
 * Stores cached nutrition query results from API Ninjas
 * Used to avoid calling external API repeatedly for same food queries
 */
export interface INutritionCache extends Document {
    // The query that was searched (normalized to lowercase, trimmed)
    queryKey: string;

    // The original query as typed by the user
    originalQuery: string;

    // Was this a freeform query or a single item query?
    queryType: "freeform" | "item";

    // For item queries, store the quantity used
    quantity?: string;   // e.g. "1 cup", "100g", "2 tbsp"

    // The full API response (array of food items)
    results: INutritionItem[];

    // Cache management
    cachedAt: Date;
    hitCount: number;          // how many times this cache was used
    lastHitAt: Date;

    // Timestamps
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * NutritionItemSchema
 * Stores one food item's nutrition data with complete wger fields
 */
const NutritionItemSchema = new Schema<INutritionItem>(
    {
        // IDs (wger)
        wgerIngredientId: Number,
        wgerUuid:         String,

        // Names
        name:        { type: String, required: true },
        commonName:  String,
        brand:       String,
        sourceName:  String,

        // Nutrition (stored as numbers, parsed from wger strings)
        calories:              Number,
        protein_g:             Number,
        carbohydrates_total_g: Number,
        carbohydrates_sugar_g: Number,
        fat_total_g:           Number,
        fat_saturated_g:       Number,
        fiber_g:               Number,
        sodium_g:              Number,

        serving_size_g:    { type: Number, default: 100 },
        potassium_mg:      Number,
        cholesterol_mg:    Number,

        // Dietary info
        isVegan:      { type: Boolean, default: null },
        isVegetarian: { type: Boolean, default: null },
        nutriscore:   String,

        // Weight units (serving alternatives)
        weightUnits: [{
            unitId: Number,
            gram:   Number,
            name:   String
        }],

        // Images from ingredientinfo endpoint
        imageUrl:  String,
        thumbnails: {
            small:         String,
            smallCropped:  String,
            medium:        String,
            mediumCropped: String,
            large:         String
        },

        // Source
        source: {
            type: String,
            enum: ['api_ninjas', 'wger', 'manual'],
            default: 'wger'
        }
    },
    { _id: false }
);

/**
 * NutritionCacheSchema
 * Stores a full query result (one query can return multiple food items)
 * Automatically expires after 7 days via TTL index
 */
const NutritionCacheSchema = new Schema<INutritionCache>(
    {
        // ===== QUERY INFO =====
        // The query that was searched (normalized to lowercase, trimmed)
        queryKey: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        // The original query as typed by the user
        originalQuery: { type: String, default: "" },

        // Was this a freeform query or a single item query?
        queryType: {
            type: String,
            enum: {
                values: ["freeform", "item"],
                message: "{VALUE} is not a valid query type"
            },
            default: "freeform",
            index: true,
        },

        // For item queries, store the quantity used
        quantity: { type: String, default: "" },

        // ===== RESULTS =====
        // The full API response (array of food items)
        results: {
            type: [NutritionItemSchema],
            default: [],
        },

        // ===== CACHE MANAGEMENT =====
        cachedAt: { type: Date, default: Date.now },
        hitCount: { type: Number, default: 1 },     // how many times this cache was used
        lastHitAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

/**
 * TTL Index: Auto-expire nutrition cache after 7 days
 * MongoDB will automatically delete documents 7 days after cachedAt
 * 7 days = 604,800 seconds
 */
NutritionCacheSchema.index(
    { cachedAt: 1 },
    { expireAfterSeconds: 604800, background: true }
);

// ===== INDEXES =====
// Index for fast lookups by queryKey
NutritionCacheSchema.index({ queryKey: 1, queryType: 1 });
// Index for cache hit rate analysis
NutritionCacheSchema.index({ hitCount: -1 });
// Index for cleanup queries
NutritionCacheSchema.index({ lastHitAt: 1 });

/**
 * Statics: Helper methods for nutrition cache operations
 */
NutritionCacheSchema.statics.normalizeQuery = function (query: string): string {
    // Normalize: lowercase, trim, single spaces
    return query.toLowerCase().trim().replace(/\s+/g, " ");
};

/**
 * Model Export
 */
export default mongoose.models.NutritionCache || mongoose.model<INutritionCache>('NutritionCache', NutritionCacheSchema)
