import mongoose, { Schema, Document } from 'mongoose'

/**
 * IRecipeQueryCache Interface
 * Stores cached results of Spoonacular findByNutrients queries
 * Prevents duplicate API calls for the same nutrient filter combinations
 */
export interface IRecipeQueryCache extends Document {
    // Cache key built from sorted filter params
    cacheKey: string
    
    // Original filters used (for debugging)
    filtersUsed: Record<string, any>
    
    // Array of Spoonacular recipe IDs returned
    recipeIds: number[]
    
    // Basic recipe info cached for fast list rendering
    recipeListData: Array<{
        spoonacularId: number
        mongoId: mongoose.Schema.Types.ObjectId
        title: string
        imageUrl: string
        calories: number
        protein: number
        carbs: number
        fat: number
    }>
    
    // Pagination
    resultCount: number
    offset: number
    totalResultsAvailable?: number
    
    // Cache tracking
    cachedAt: Date
    hitCount: number
    lastHitAt: Date
    
    // Timestamps
    createdAt?: Date
    updatedAt?: Date
}

/**
 * RecipeQueryCacheSchema
 * TTL: 3 days (recipe search results can change)
 */
const RecipeQueryCacheSchema = new Schema<IRecipeQueryCache>(
    {
        cacheKey: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        
        filtersUsed: {
            type: Schema.Types.Mixed,
            default: {}
        },
        
        recipeIds: [Number],
        
        recipeListData: [{
            spoonacularId: Number,
            mongoId: Schema.Types.ObjectId,
            title: String,
            imageUrl: String,
            calories: Number,
            protein: Number,
            carbs: Number,
            fat: Number
        }],
        
        resultCount: { type: Number, default: 0 },
        offset: { type: Number, default: 0 },
        totalResultsAvailable: Number,
        
        cachedAt: { type: Date, default: Date.now },
        hitCount: { type: Number, default: 1 },
        lastHitAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
)

// TTL Index: Auto-expire after 3 days (259,200 seconds)
RecipeQueryCacheSchema.index(
    { cachedAt: 1 },
    { expireAfterSeconds: 259200, background: true }
)

// Index for cache hit analysis
RecipeQueryCacheSchema.index({ hitCount: -1 })

/**
 * RecipeQueryCache Model
 * Used to cache findByNutrients API responses from Spoonacular
 */
export default mongoose.models.RecipeQueryCache || mongoose.model<IRecipeQueryCache>('RecipeQueryCache', RecipeQueryCacheSchema)