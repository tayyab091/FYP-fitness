/**
 * Nutrition Service
 * 
 * Handles all nutrition data from API Ninjas:
 * - Freeform nutrition extraction (e.g. "1lb brisket and fries")
 * - Single item nutrition queries (e.g. "chicken breast", quantity "200g")
 * 
 * All queries are cached in MongoDB with 7-day TTL
 * Uses cache-first pattern: always check MongoDB before calling external API
 */

import axios from "axios";
import { NutritionCache, type INutritionItem } from '@/models';
import { checkApiRateLimit } from "@/lib/middleware/apiRateGuard";

const NUTRITION_BASE = "https://api.api-ninjas.com/v1";
const TTL_DAYS = parseInt(process.env.NUTRITION_CACHE_TTL_DAYS || "7");

// ===== HELPER FUNCTIONS =====

/**
 * Normalize query for consistent cache keys
 * "1lb Chicken  " → "1lb chicken" (lowercase, trimmed, single spaces)
 */
const normalizeQuery = (query: string): string =>
    query.toLowerCase().trim().replace(/\s+/g, " ");

// Get API key dynamically to ensure it's loaded from .env
const getApiNinjasKey = (): string => {
    const key = process.env.API_NINJAS_KEY;
    if (!key) {
        throw new Error("API_NINJAS_KEY not found in environment variables");
    }
    return key;
};

// ===== FREEFORM QUERY (e.g. "1lb brisket and fries") =====

/**
 * Get nutrition from freeform text query
 * Example: "2 eggs and toast" → returns nutrition for both items
 * 
 * @param query - Freeform food description
 * @returns {data, fromCache, hitCount} - Nutrition data + cache status
 */
export async function getNutritionFromText(query: string) {
    try {
        const queryKey = normalizeQuery(query);
        const staleDate = new Date(Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000);
        const API_NINJAS_KEY = getApiNinjasKey();

        // ===== STEP 1: CHECK MONGODB CACHE =====
        const cached = await NutritionCache.findOne({
            queryKey,
            queryType: "freeform",
            cachedAt: { $gte: staleDate },
        });

        if (cached) {
            // Update hit stats without blocking response
            NutritionCache.findByIdAndUpdate(
                cached._id,
                {
                    $inc: { hitCount: 1 },
                    lastHitAt: new Date(),
                },
                { new: true }
            ).exec();

            console.log(`✅ Nutrition cache HIT for: "${queryKey}"`);
            return {
                data: cached.results,
                fromCache: true,
                hitCount: cached.hitCount + 1,
            };
        }

        // ===== STEP 2: CALL EXTERNAL API (if cache miss) =====
        console.log(
            `⚡ Nutrition cache MISS — calling API Ninjas for: "${queryKey}"`
        );

        // Check rate limit before calling API
        const canCall = await checkApiRateLimit(
            "api_ninjas",
            parseInt(process.env.MAX_API_NINJAS_CALLS_PER_HOUR || "100")
        );

        if (!canCall) {
            console.warn(
                "⛔ API Ninjas rate limit reached — returning stale cache if available"
            );
            // Return stale cache if available (don't fail, return what we have)
            const staleCache = await NutritionCache.findOne({
                queryKey,
                queryType: "freeform",
            });
            if (staleCache) {
                return {
                    data: staleCache.results,
                    fromCache: true,
                    stale: true,
                    hitCount: staleCache.hitCount,
                };
            }
            throw new Error(
                "API_NINJAS_RATE_LIMIT_REACHED_AND_NO_CACHED_DATA_AVAILABLE"
            );
        }

        const response = await axios.get(`${NUTRITION_BASE}/nutrition`, {
            params: { query: queryKey },
            headers: { 
                "X-Api-Key": API_NINJAS_KEY,
            },
        });
        
        console.log(`✅ API Ninjas responded successfully for: "${queryKey}"`);

        const results = Array.isArray(response.data) ? response.data : [response.data];
        
        // Transform results to handle premium-only strings and ensure numeric fields
        const cleanedResults = results.map((item: any) => ({
            ...item,
            calories: typeof item.calories === 'number' ? item.calories : 0,
            fat_total_g: typeof item.fat_total_g === 'number' ? item.fat_total_g : 0,
            fat_saturated_g: typeof item.fat_saturated_g === 'number' ? item.fat_saturated_g : 0,
            protein_g: typeof item.protein_g === 'number' ? item.protein_g : 0,
            sodium_mg: typeof item.sodium_mg === 'number' ? item.sodium_mg : 0,
            potassium_mg: typeof item.potassium_mg === 'number' ? item.potassium_mg : 0,
            cholesterol_mg: typeof item.cholesterol_mg === 'number' ? item.cholesterol_mg : 0,
            carbohydrates_total_g: typeof item.carbohydrates_total_g === 'number' ? item.carbohydrates_total_g : 0,
            fiber_g: typeof item.fiber_g === 'number' ? item.fiber_g : 0,
            sugar_g: typeof item.sugar_g === 'number' ? item.sugar_g : 0,
            serving_size_g: typeof item.serving_size_g === 'number' ? item.serving_size_g : 100,
        }));

        if (!cleanedResults || cleanedResults.length === 0) {
            console.log(`ℹ️  No nutrition data found for: "${queryKey}"`);
            return { data: [], fromCache: false, hitCount: 0 };
        }

        // ===== STEP 3: SAVE TO MONGODB ATLAS =====
        await NutritionCache.findOneAndUpdate(
            { queryKey, queryType: "freeform" },
            {
                queryKey,
                originalQuery: query,
                queryType: "freeform",
                results: cleanedResults,
                cachedAt: new Date(),
                hitCount: 1,
                lastHitAt: new Date(),
            },
            { upsert: true, new: true }
        );

        console.log(`💾 Nutrition data saved to MongoDB for: "${queryKey}"`);
        return { data: cleanedResults, fromCache: false, hitCount: 1 };
    } catch (error: any) {
        console.error("❌ getNutritionFromText error:", error.message);
        if (error.response) {
            console.error("  API Status:", error.response.status);
            console.error("  API Response:", error.response.data);
            console.error("  API Headers:", error.response.headers);
        }
        throw error;
    }
}

// ===== SINGLE ITEM QUERY (e.g. food="chicken breast", quantity="200g") =====

/**
 * Get nutrition for a single food item with specific quantity
 * Example: food="chicken breast", quantity="200g"
 * 
 * @param food - Food item name
 * @param quantity - Quantity (e.g. "1 cup", "100g", "2 tbsp")
 * @returns {data, fromCache} - Nutrition data + cache status
 */
export async function getNutritionForItem(food: string, quantity: string) {
    try {
        const queryKey = `${normalizeQuery(food)}__${quantity.toLowerCase().trim()}`;
        const staleDate = new Date(Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000);
        const API_NINJAS_KEY = getApiNinjasKey();

        // ===== STEP 1: CHECK MONGODB CACHE =====
        const cached = await NutritionCache.findOne({
            queryKey,
            queryType: "item",
            cachedAt: { $gte: staleDate },
        });

        if (cached) {
            NutritionCache.findByIdAndUpdate(
                cached._id,
                {
                    $inc: { hitCount: 1 },
                    lastHitAt: new Date(),
                },
                { new: true }
            ).exec();

            console.log(
                `✅ Nutrition item cache HIT for: "${food}" x "${quantity}"`
            );
            return { data: cached.results, fromCache: true };
        }

        // ===== STEP 2: CALL EXTERNAL API =====
        console.log(
            `⚡ Nutrition item cache MISS — calling API Ninjas for: "${food}" x "${quantity}"`
        );

        // Check rate limit
        const canCall = await checkApiRateLimit(
            "api_ninjas",
            parseInt(process.env.MAX_API_NINJAS_CALLS_PER_HOUR || "100")
        );

        if (!canCall) {
            console.warn(
                "⛔ API Ninjas rate limit reached — returning stale cache if available"
            );
            const staleCache = await NutritionCache.findOne({
                queryKey,
                queryType: "item",
            });
            if (staleCache) {
                return { data: staleCache.results, fromCache: true, stale: true };
            }
            throw new Error("API_NINJAS_RATE_LIMIT_REACHED");
        }

        const response = await axios.get(`${NUTRITION_BASE}/nutritionitem`, {
            params: { query: food, quantity },
            headers: { "X-Api-Key": API_NINJAS_KEY },
        });

        const item = response.data;
        
        // Clean the data to convert premium-only strings to 0
        const cleanedItem = {
            ...item,
            calories: typeof item.calories === 'number' ? item.calories : 0,
            fat_total_g: typeof item.fat_total_g === 'number' ? item.fat_total_g : 0,
            fat_saturated_g: typeof item.fat_saturated_g === 'number' ? item.fat_saturated_g : 0,
            protein_g: typeof item.protein_g === 'number' ? item.protein_g : 0,
            sodium_mg: typeof item.sodium_mg === 'number' ? item.sodium_mg : 0,
            potassium_mg: typeof item.potassium_mg === 'number' ? item.potassium_mg : 0,
            cholesterol_mg: typeof item.cholesterol_mg === 'number' ? item.cholesterol_mg : 0,
            carbohydrates_total_g: typeof item.carbohydrates_total_g === 'number' ? item.carbohydrates_total_g : 0,
            fiber_g: typeof item.fiber_g === 'number' ? item.fiber_g : 0,
            sugar_g: typeof item.sugar_g === 'number' ? item.sugar_g : 0,
            serving_size_g: typeof item.serving_size_g === 'number' ? item.serving_size_g : 100,
        };

        const results = [cleanedItem];

        // ===== STEP 3: SAVE TO MONGODB ATLAS =====
        await NutritionCache.findOneAndUpdate(
            { queryKey, queryType: "item" },
            {
                queryKey,
                originalQuery: food,
                queryType: "item",
                quantity,
                results,
                cachedAt: new Date(),
                hitCount: 1,
                lastHitAt: new Date(),
            },
            { upsert: true, new: true }
        );

        console.log(
            `💾 Nutrition item data saved to MongoDB for: "${food}" x "${quantity}"`
        );
        return { data: results, fromCache: false };
    } catch (error: any) {
        console.error("❌ getNutritionForItem error:", error.message);
        throw error;
    }
}

// ===== ADMIN FUNCTIONS =====

/**
 * Get cache statistics (admin only)
 * Returns: total cached queries, most searched items, cache hit rate
 */
export async function getNutritionCacheStats() {
    try {
        const total = await NutritionCache.countDocuments();

        const topQueries = await NutritionCache.find()
            .sort({ hitCount: -1 })
            .limit(10)
            .select({ queryKey: 1, queryType: 1, hitCount: 1, cachedAt: 1 });

        const stats = {
            totalCachedQueries: total,
            topQueries,
            timestamp: new Date(),
        };

        return stats;
    } catch (error: any) {
        console.error("❌ getNutritionCacheStats error:", error.message);
        throw error;
    }
}

/**
 * Clear nutrition cache (admin only)
 * Removes all cached nutrition queries
 */
export async function clearNutritionCache() {
    try {
        const result = await NutritionCache.deleteMany({});
        console.log(`🗑️  Cleared ${result.deletedCount} nutrition cache entries`);
        return { deletedCount: result.deletedCount };
    } catch (error: any) {
        console.error("❌ clearNutritionCache error:", error.message);
        throw error;
    }
}
