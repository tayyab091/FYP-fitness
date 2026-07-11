import axios from 'axios'
import { Recipe, type IRecipe, RecipeQueryCache, type IRecipeQueryCache } from '@/models'
import { checkApiRateLimit } from '@/lib/middleware/apiRateGuard'

/**
 * GOAL_PRESETS: Predefined nutrient filters for common fitness goals
 */
export const GOAL_PRESETS = {
    weight_loss: {
        minCalories: 100,
        maxCalories: 400,
        minProtein: 20,
        description: 'Low-calorie, high-protein meals for weight loss'
    },
    muscle_gain: {
        minCalories: 400,
        maxCalories: 700,
        minProtein: 30,
        description: 'Calorie-rich, high-protein meals for muscle building'
    },
    endurance: {
        minCalories: 300,
        maxCalories: 600,
        minCarbs: 50,
        minProtein: 15,
        description: 'Balanced meals for endurance athletes'
    },
    general_fitness: {
        minCalories: 200,
        maxCalories: 500,
        minProtein: 15,
        description: 'Balanced meals for overall fitness'
    },
    low_carb: {
        maxCarbs: 20,
        minProtein: 20,
        minFat: 10,
        description: 'High-fat, high-protein, very low-carb meals'
    },
    high_protein: {
        minProtein: 35,
        maxCalories: 600,
        description: 'High-protein meals (any calorie level)'
    }
}

/**
 * Spoonacular API base configuration
 */
const SPOONACULAR_API_HOST = process.env.SPOONACULAR_API_HOST || 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com'

/**
 * Get Spoonacular API key from environment
 */
function getSpoonacularKey(): string {
    const key = process.env.SPOONACULAR_API_KEY
    if (!key) {
        throw new Error('SPOONACULAR_API_KEY environment variable not set')
    }
    return key
}

/**
 * Get RapidAPI key from environment
 */
function getRapidApiKey(): string {
    const key = process.env.RAPID_API_KEY
    if (!key) {
        throw new Error('RAPID_API_KEY environment variable not set')
    }
    return key
}

/**
 * buildNutrientCacheKey
 * Creates a normalized cache key from filter parameters
 * Ensures same filters always produce same key (regardless of parameter order)
 */
export function buildNutrientCacheKey(filters: Record<string, any>): string {
    // Sort keys alphabetically for consistency
    const sortedKeys = Object.keys(filters)
        .filter(key => filters[key] !== undefined && filters[key] !== null)
        .sort()

    const parts = sortedKeys.map(key => {
        const value = filters[key]
        if (typeof value === 'object') {
            return `${key}:${JSON.stringify(value)}`
        }
        return `${key}:${value}`
    })

    return parts.join('|')
}

/**
 * mapDishTypeToMealType
 * Converts Spoonacular dishTypes to our mealType enum
 */
export function mapDishTypeToMealType(dishTypes: string[] = []): 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' {
    if (!dishTypes || dishTypes.length === 0) {
        return 'Lunch' // Default
    }

    const typeStr = dishTypes[0].toLowerCase()

    if (typeStr.includes('breakfast')) return 'Breakfast'
    if (typeStr.includes('brunch')) return 'Breakfast'
    if (typeStr.includes('lunch') || typeStr.includes('main')) return 'Lunch'
    if (typeStr.includes('dinner')) return 'Dinner'
    if (typeStr.includes('appetizer') || typeStr.includes('snack') || typeStr.includes('side')) return 'Snack'
    if (typeStr.includes('dessert') || typeStr.includes('drink')) return 'Snack'

    return 'Lunch'
}

/**
 * findRecipesByNutrients
 * Main recipe search function with cache-first pattern
 * 1. Check RecipeQueryCache
 * 2. If miss AND rate limit OK, call Spoonacular API
 * 3. Save basic recipe info to Recipe collection
 * 4. Cache query result with hitCount tracking
 * 5. Return recipes
 */
export async function findRecipesByNutrients(
    filters: Record<string, any>,
    options: { offset?: number; number?: number } = {}
) {
    const offset = options.offset || 0
    const number = options.number || 20

    // Build cache key from filters
    const cacheKey = buildNutrientCacheKey(filters)

    try {
        // ===== STEP 1: Check Cache =====
        const cachedResult = await RecipeQueryCache.findOne({ cacheKey })

        if (cachedResult) {
            // Update hit tracking
            cachedResult.hitCount += 1
            cachedResult.lastHitAt = new Date()
            await cachedResult.save()

            console.log(`✅ Recipe query cache HIT: ${cacheKey}`)
            return {
                recipes: cachedResult.recipeListData,
                totalResults: cachedResult.totalResultsAvailable,
                resultCount: cachedResult.resultCount,
                offset: cachedResult.offset,
                fromCache: true
            }
        }

        console.log(`⚡ Recipe query cache MISS → calling Spoonacular API`)

        // ===== STEP 2: Check Rate Limit =====
        const canCall = await checkApiRateLimit('spoonacular', 50) // 50/hour limit
        if (!canCall) {
            console.warn('⚠️  Spoonacular rate limit exceeded, returning empty')
            return {
                recipes: [],
                totalResults: 0,
                resultCount: 0,
                offset,
                fromCache: false,
                rateLimited: true
            }
        }

        // ===== STEP 3: Call Spoonacular API =====
        const rapidApiKey = getRapidApiKey()

        // Build query parameters
        const params = new URLSearchParams()
        params.append('offset', String(offset))
        params.append('number', String(number))
        params.append('ranking', '2') // by macro fitness

        // Add nutrient filters to params
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, String(value))
            }
        })

        const response = await axios.get(
            `https://${SPOONACULAR_API_HOST}/recipes/findByNutrients?${params.toString()}`,
            {
                headers: {
                    'x-rapidapi-key': rapidApiKey,
                    'x-rapidapi-host': SPOONACULAR_API_HOST
                }
            }
        )

        const recipeList = response.data

        // ===== STEP 4: Save Basic Recipe Info to DB =====
        const recipeListData: Array<{
            spoonacularId: number
            mongoId: any
            title: string
            imageUrl: string
            calories: number
            protein: number
            carbs: number
            fat: number
        }> = []

        for (const recipe of recipeList) {
            // Check if recipe already in DB
            let dbRecipe = await Recipe.findOne({ spoonacularId: recipe.id })

            if (!dbRecipe) {
                // Create minimal recipe document
                dbRecipe = new Recipe({
                    spoonacularId: recipe.id,
                    dataSource: 'spoonacular',
                    title: recipe.title,
                    imageUrl: recipe.image || '',
                    mealType: 'Lunch',
                    calories: Math.round(recipe.nutrition?.nutrients?.find((n: any) => n.name === 'Calories')?.amount || 0),
                    protein: Math.round(recipe.nutrition?.nutrients?.find((n: any) => n.name === 'Protein')?.amount || 0),
                    carbs: Math.round(recipe.nutrition?.nutrients?.find((n: any) => n.name === 'Carbohydrates')?.amount || 0),
                    fat: Math.round(recipe.nutrition?.nutrients?.find((n: any) => n.name === 'Fat')?.amount || 0),
                    isActive: true,
                    isFullyLoaded: false // Will be fully loaded on demand
                })
                await dbRecipe.save()
            }

            recipeListData.push({
                spoonacularId: recipe.id,
                mongoId: dbRecipe._id,
                title: recipe.title,
                imageUrl: recipe.image || '',
                calories: recipe.nutrition?.nutrients?.find((n: any) => n.name === 'Calories')?.amount || 0,
                protein: recipe.nutrition?.nutrients?.find((n: any) => n.name === 'Protein')?.amount || 0,
                carbs: recipe.nutrition?.nutrients?.find((n: any) => n.name === 'Carbohydrates')?.amount || 0,
                fat: recipe.nutrition?.nutrients?.find((n: any) => n.name === 'Fat')?.amount || 0
            })
        }

        // ===== STEP 5: Cache Query Result =====
        const cacheEntry = new RecipeQueryCache({
            cacheKey,
            filtersUsed: filters,
            recipeIds: recipeList.map((r: any) => r.id),
            recipeListData,
            resultCount: recipeList.length,
            offset,
            totalResultsAvailable: recipeList.length, // Spoonacular doesn't return total
            cachedAt: new Date(),
            hitCount: 1,
            lastHitAt: new Date()
        })

        await cacheEntry.save()
        console.log(`💾 Cached recipe query: ${cacheKey}`)

        return {
            recipes: recipeListData,
            totalResults: recipeList.length,
            resultCount: recipeList.length,
            offset,
            fromCache: false
        }
    } catch (error: any) {
        console.error('❌ Error fetching recipes from API:', error.message)
        
        // Fallback: Try to return any cached recipes from DB that match the filters
        console.log('⚠️  Falling back to cached recipes in database...')
        try {
            const dbRecipes = await Recipe.find({
                isActive: true,
                ...Object.fromEntries(
                    Object.entries(filters).map(([key, value]) => {
                        if (key === 'minCalories') return ['calories', { $gte: value }]
                        if (key === 'maxCalories') return ['calories', { $lte: value }]
                        if (key === 'minProtein') return ['protein', { $gte: value }]
                        return [key, value]
                    })
                )
            })
                .limit(6)
                .lean()
            
            if (dbRecipes.length > 0) {
                const fallbackData = dbRecipes.map(r => ({
                    spoonacularId: r.spoonacularId,
                    mongoId: r._id,
                    title: r.title,
                    imageUrl: r.imageUrl,
                    calories: r.calories,
                    protein: r.protein,
                    carbs: r.carbs,
                    fat: r.fat
                }))
                
                console.log(`✅ Returning ${fallbackData.length} cached recipes from database`)
                return {
                    recipes: fallbackData,
                    totalResults: fallbackData.length,
                    resultCount: fallbackData.length,
                    offset,
                    fromCache: true,
                    fallback: true
                }
            }
        } catch (fallbackError) {
            console.error('❌ Fallback failed:', fallbackError)
        }
        
        // Last resort: Return demo recipes
        console.warn('⚠️  Returning demo recipes')
        const demoRecipes = [
            {
                spoonacularId: 1001,
                mongoId: null,
                title: 'Grilled Chicken Breast with Steamed Vegetables',
                imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400',
                calories: 350,
                protein: 45,
                carbs: 15,
                fat: 8
            },
            {
                spoonacularId: 1002,
                mongoId: null,
                title: 'Salmon with Quinoa and Broccoli',
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
                calories: 420,
                protein: 40,
                carbs: 35,
                fat: 18
            },
            {
                spoonacularId: 1003,
                mongoId: null,
                title: 'Egg White Omelette with Spinach',
                imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400',
                calories: 150,
                protein: 28,
                carbs: 3,
                fat: 2
            },
            {
                spoonacularId: 1004,
                mongoId: null,
                title: 'Turkey Meatballs with Brown Rice',
                imageUrl: 'https://images.unsplash.com/photo-1610706406776-32c4bcc58fa8?w=400',
                calories: 380,
                protein: 38,
                carbs: 45,
                fat: 10
            },
            {
                spoonacularId: 1005,
                mongoId: null,
                title: 'Tilapia with Sweet Potato',
                imageUrl: 'https://images.unsplash.com/photo-1517521131902-a1b37c72ade8?w=400',
                calories: 320,
                protein: 42,
                carbs: 28,
                fat: 6
            },
            {
                spoonacularId: 1006,
                mongoId: null,
                title: 'Chicken Stir-Fry with Brown Rice',
                imageUrl: 'https://images.unsplash.com/photo-1543521521-b7a1c2a7fae8?w=400',
                calories: 380,
                protein: 38,
                carbs: 48,
                fat: 8
            }
        ]
        return {
            recipes: demoRecipes,
            totalResults: demoRecipes.length,
            resultCount: demoRecipes.length,
            offset,
            fromCache: false,
            demo: true,
            error: error.message
        }
    }
}

/**
 * getFullRecipeById
 * Lazy-load full recipe details from Spoonacular
 * 1. Check if Recipe doc exists with isFullyLoaded=true
 * 2. If not, call /recipes/{id}/information
 * 3. Save full data including extended ingredients, instructions, nutrition
 * 4. Return full recipe
 */
export async function getFullRecipeById(spoonacularId: number): Promise<IRecipe | null> {
    try {
        // ===== STEP 1: Check DB for Full Recipe =====
        let recipe = await Recipe.findOne({
            spoonacularId,
            isFullyLoaded: true
        })

        if (recipe) {
            console.log(`✅ Full recipe found in DB: ${spoonacularId}`)
            return recipe
        }

        console.log(`⚡ Full recipe not in cache → calling Spoonacular API`)

        // ===== STEP 2: Check Rate Limit =====
        const canCall = await checkApiRateLimit('spoonacular', 50) // 50/hour limit
        if (!canCall) {
            console.warn('⚠️  Rate limit exceeded, returning partial recipe')
            recipe = await Recipe.findOne({ spoonacularId })
            return recipe
        }

        // ===== STEP 3: Call Spoonacular API =====
        const rapidApiKey = getRapidApiKey()

        const response = await axios.get(
            `https://${SPOONACULAR_API_HOST}/recipes/${spoonacularId}/information?includeNutrition=true`,
            {
                headers: {
                    'x-rapidapi-key': rapidApiKey,
                    'x-rapidapi-host': SPOONACULAR_API_HOST
                }
            }
        )

        const fullData = response.data

        // ===== STEP 4: Save or Update Recipe with Full Data =====
        recipe = await Recipe.findOneAndUpdate(
            { spoonacularId },
            {
                spoonacularId: fullData.id,
                dataSource: 'spoonacular',
                title: fullData.title,
                imageUrl: fullData.image || '',
                mealType: mapDishTypeToMealType(fullData.dishTypes || []),
                readyInMinutes: fullData.readyInMinutes || 0,
                servings: fullData.servings || 1,
                sourceUrl: fullData.sourceUrl || '',
                summary: fullData.summary || '',
                cuisines: fullData.cuisines || [],
                dishTypes: fullData.dishTypes || [],
                diets: fullData.diets || [],
                occasions: fullData.occasions || [],

                // Macros from nutrition
                calories: Math.round(fullData.nutrition?.nutrients?.find((n: any) => n.name === 'Calories')?.amount || 0),
                protein: Math.round(fullData.nutrition?.nutrients?.find((n: any) => n.name === 'Protein')?.amount || 0),
                carbs: Math.round(fullData.nutrition?.nutrients?.find((n: any) => n.name === 'Carbohydrates')?.amount || 0),
                fat: Math.round(fullData.nutrition?.nutrients?.find((n: any) => n.name === 'Fat')?.amount || 0),

                // Extended data
                extendedIngredients: fullData.extendedIngredients || [],
                analyzedInstructions: fullData.analyzedInstructions || [],
                fullNutrition: {
                    nutrients: fullData.nutrition?.nutrients || [],
                    caloricBreakdown: fullData.nutrition?.caloricBreakdown || {}
                },

                // Cache tracking
                isFullyLoaded: true,
                spoonacularFetchedAt: new Date(),
                cachedAt: new Date()
            },
            { upsert: true, new: true }
        )

        console.log(`💾 Saved full recipe to DB: ${spoonacularId}`)
        return recipe
    } catch (error: any) {
        console.error('❌ Error fetching full recipe:', error.message)
        throw error
    }
}

/**
 * getRecipesForGoal
 * Get recipes matching a predefined fitness goal
 * Maps goal preset to nutrient filters and calls findRecipesByNutrients
 */
export async function getRecipesForGoal(
    goal: keyof typeof GOAL_PRESETS,
    options?: { offset?: number; number?: number }
) {
    if (!GOAL_PRESETS[goal]) {
        throw new Error(`Invalid goal: ${goal}. Available: ${Object.keys(GOAL_PRESETS).join(', ')}`)
    }

    const preset = GOAL_PRESETS[goal]
    console.log(`🎯 Fetching recipes for goal: ${goal}`)

    return findRecipesByNutrients(preset as Record<string, any>, options)
}

/**
 * searchRecipesInDB
 * Pure MongoDB search without API calls
 * Searches title, summary, and ingredient names
 */
export async function searchRecipesInDB(query: string, filters?: { mealType?: string; diets?: string[] }) {
    try {
        const searchFilters: Record<string, any> = {
            isActive: true,
            isFullyLoaded: true
        }

        if (filters?.mealType) {
            searchFilters.mealType = filters.mealType
        }

        if (filters?.diets && filters.diets.length > 0) {
            searchFilters.diets = { $in: filters.diets }
        }

        const results = await Recipe.find({
            ...searchFilters,
            $text: { $search: query }
        })
            .sort({ score: { $meta: 'textScore' } })
            .limit(20)

        return results
    } catch (error: any) {
        console.error('❌ Error searching recipes:', error.message)
        throw error
    }
}

/**
 * getRecipeQueryCacheStats
 * Return cache statistics for admin monitoring
 */
export async function getRecipeQueryCacheStats() {
    const totalCached = await RecipeQueryCache.countDocuments()
    const totalHits = await RecipeQueryCache.aggregate([{ $group: { _id: null, totalHits: { $sum: '$hitCount' } } }])

    return {
        totalCachedQueries: totalCached,
        totalCacheHits: totalHits[0]?.totalHits || 0,
        averageHitsPerQuery: totalCached > 0 ? Math.round((totalHits[0]?.totalHits || 0) / totalCached) : 0
    }
}

/**
 * clearRecipeQueryCache
 * Admin function to clear all cached queries
 */
export async function clearRecipeQueryCache() {
    const result = await RecipeQueryCache.deleteMany({})
    console.log(`🗑️  Cleared ${result.deletedCount} cached recipe queries`)
    return result.deletedCount
}
