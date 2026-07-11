/**
 * Seed Nutrition Cache
 * 
 * Populates MongoDB nutrition cache with sample data for testing
 * This allows the nutrition page to display data even when API rate limit is hit
 */

import { NutritionCache, type INutritionItem } from '@/models';

// Sample nutritional data for common meals (based on typical API Ninjas responses)
const SAMPLE_MEALS = {
  "1 eggs scrambled with toast": [
    {
      name: "Eggs Scrambled (1 large egg)",
      calories: 90,
      serving_size_g: 50,
      fat_total_g: 7,
      fat_saturated_g: 2.7,
      protein_g: 6.3,
      sodium_mg: 71,
      potassium_mg: 69,
      cholesterol_mg: 185,
      carbohydrates_total_g: 0.6,
      fiber_g: 0,
      sugar_g: 0.6,
    },
    {
      name: "Bread, whole wheat (1 slice)",
      calories: 80,
      serving_size_g: 28,
      fat_total_g: 1.0,
      fat_saturated_g: 0.2,
      protein_g: 4.0,
      sodium_mg: 140,
      potassium_mg: 100,
      cholesterol_mg: 0,
      carbohydrates_total_g: 14.0,
      fiber_g: 2.4,
      sugar_g: 1.0,
    },
  ],

  "grilled chicken breast with rice": [
    {
      name: "Chicken Breast, grilled (100g)",
      calories: 165,
      serving_size_g: 100,
      fat_total_g: 3.6,
      fat_saturated_g: 1.0,
      protein_g: 31.0,
      sodium_mg: 75,
      potassium_mg: 350,
      cholesterol_mg: 85,
      carbohydrates_total_g: 0,
      fiber_g: 0,
      sugar_g: 0,
    },
    {
      name: "Rice, cooked white (1 cup)",
      calories: 206,
      serving_size_g: 158,
      fat_total_g: 0.4,
      fat_saturated_g: 0.1,
      protein_g: 4.3,
      sodium_mg: 2,
      potassium_mg: 55,
      cholesterol_mg: 0,
      carbohydrates_total_g: 45.0,
      fiber_g: 0.6,
      sugar_g: 0,
    },
  ],

  "apple with almond butter": [
    {
      name: "Apple, raw with skin (1 medium)",
      calories: 95,
      serving_size_g: 182,
      fat_total_g: 0.3,
      fat_saturated_g: 0.1,
      protein_g: 0.5,
      sodium_mg: 2,
      potassium_mg: 195,
      cholesterol_mg: 0,
      carbohydrates_total_g: 25.0,
      fiber_g: 4.4,
      sugar_g: 19.0,
    },
    {
      name: "Almond Butter (2 tbsp)",
      calories: 190,
      serving_size_g: 32,
      fat_total_g: 17.0,
      fat_saturated_g: 1.4,
      protein_g: 7.0,
      sodium_mg: 140,
      potassium_mg: 200,
      cholesterol_mg: 0,
      carbohydrates_total_g: 6.0,
      fiber_g: 3.5,
      sugar_g: 1.2,
    },
  ],

  "salmon with steamed broccoli": [
    {
      name: "Salmon, cooked (100g)",
      calories: 208,
      serving_size_g: 100,
      fat_total_g: 13.0,
      fat_saturated_g: 3.1,
      protein_g: 22.0,
      sodium_mg: 75,
      potassium_mg: 628,
      cholesterol_mg: 63,
      carbohydrates_total_g: 0,
      fiber_g: 0,
      sugar_g: 0,
    },
    {
      name: "Broccoli, steamed (1 cup)",
      calories: 55,
      serving_size_g: 156,
      fat_total_g: 0.6,
      fat_saturated_g: 0.1,
      protein_g: 3.7,
      sodium_mg: 64,
      potassium_mg: 290,
      cholesterol_mg: 0,
      carbohydrates_total_g: 11.0,
      fiber_g: 2.4,
      sugar_g: 2.2,
    },
  ],
};

const normalizeQuery = (query: string): string =>
  query.toLowerCase().trim().replace(/\s+/g, " ");

/**
 * Seed the nutrition cache with sample data
 * Run this once after deployment or when cache is empty
 */
export async function seedNutritionCache(): Promise<void> {
  try {
    console.log("🌱 Starting nutrition cache seed...");

    for (const [query, items] of Object.entries(SAMPLE_MEALS)) {
      const queryKey = normalizeQuery(query);

      // Check if already exists
      const exists = await NutritionCache.findOne({
        queryKey,
        queryType: "freeform",
      });

      if (exists) {
        console.log(`⏭️  Cache already exists for: "${query}"`);
        continue;
      }

      // Create cache entry
      await NutritionCache.create({
        queryKey,
        originalQuery: query,
        queryType: "freeform",
        results: items,
        cachedAt: new Date(),
        hitCount: 0,
        lastHitAt: new Date(),
      });

      console.log(`✅ Seeded cache for: "${query}" (${items.length} items)`);
    }

    console.log("✨ Nutrition cache seed complete!");
  } catch (error: any) {
    console.error("❌ Failed to seed nutrition cache:", error.message);
    throw error;
  }
}

/**
 * Clear all nutrition cache
 */
export async function clearAllNutritionCache(): Promise<void> {
  try {
    const result = await NutritionCache.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} cache entries`);
  } catch (error: any) {
    console.error("❌ Failed to clear nutrition cache:", error.message);
    throw error;
  }
}

/**
 * Get nutrition cache statistics
 */
export async function getNutritionCacheStats() {
  try {
    const totalCount = await NutritionCache.countDocuments();
    const totalHits = await NutritionCache.aggregate([
      { $group: { _id: null, totalHits: { $sum: "$hitCount" } } },
    ]);

    const stats = {
      totalCachedQueries: totalCount,
      totalCacheHits: totalHits[0]?.totalHits || 0,
      averageHitsPerQuery: totalCount > 0 ? (totalHits[0]?.totalHits || 0) / totalCount : 0,
    };

    return stats;
  } catch (error: any) {
    console.error("❌ Failed to get cache stats:", error.message);
    throw error;
  }
}
