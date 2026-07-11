/**
 * Exercise Service
 * 
 * Handles exercise data from wger Free Exercise Database (https://wger.de/api/v2)
 * - NO API KEY REQUIRED
 * - Complete free exercise database with videos and images
 * - All data cached in MongoDB with 30-day TTL
 * - Uses cache-first pattern: check MongoDB before calling wger API
 * 
 * The strategy:
 * 1. Check MongoDB cache first (likely to have data)
 * 2. If cache miss, fetch from wger API
 * 3. Map wger fields with exact handling (duration string→float, etc)
 * 4. Save merged data to MongoDB
 * 5. Return to client
 */

import axios from "axios";
import { Exercise, ExerciseMetaCache } from '@/models';
import * as wgerService from '@/services/wgerService';

const EXERCISE_TTL_DAYS = parseInt(process.env.WGER_EXERCISE_CACHE_TTL_DAYS || "30");

// ===== SEARCH & FILTER EXERCISES =====

/**
 * Search exercises with filters (name, difficulty, muscle, equipment, wgerMuscleId)
 * Uses cache-first approach: checks MongoDB before calling wger API
 * 
 * @param filters - name, difficulty, muscle, equipment, wgerMuscleId
 * @returns {data, fromCache, count}
 */
export async function searchExercises(filters: {
    name?: string;
    muscle?: string;
    type?: string;
    difficulty?: string;
    equipment?: string;
    wgerMuscleId?: number;
}) {
    try {
        const staleDate = new Date(
            Date.now() - EXERCISE_TTL_DAYS * 24 * 60 * 60 * 1000
        );

        // ===== STEP 1: BUILD MONGODB QUERY =====
        const dbQuery: any = { isActive: true, cachedAt: { $gte: staleDate } };
        if (filters.muscle) dbQuery.muscle = filters.muscle;
        if (filters.difficulty) dbQuery.difficulty = filters.difficulty;
        if (filters.name) dbQuery.$text = { $search: filters.name };
        if (filters.wgerMuscleId) dbQuery['musclesPrimary.wgerMuscleId'] = filters.wgerMuscleId;
        if (filters.equipment)
            dbQuery.equipmentList = { $regex: filters.equipment, $options: "i" };

        // ===== STEP 2: CHECK MONGODB CACHE =====
        const cachedExercises = await Exercise.find(dbQuery).limit(20);

        if (cachedExercises.length >= 5) {
            console.log(
                `✅ Exercise cache HIT — found ${cachedExercises.length} in MongoDB`
            );
            return {
                data: cachedExercises,
                fromCache: true,
                count: cachedExercises.length,
            };
        }

        // ===== STEP 3: CACHE MISS — CALL WGER API =====
        console.log("⚡ Exercise cache MISS — calling wger API");

        // Use wgerService to fetch exercises from wger
        const wgerResult = await wgerService.getExercisesFromWger({
            name: filters.name,
        });

        // Handle response from wgerService
        const wgerExercises = wgerResult?.data || [];

        if (!wgerExercises || wgerExercises.length === 0) {
            console.log("ℹ️  No exercises found from wger API");
            return { data: [], fromCache: false, count: 0 };
        }

        console.log(`💾 Fetched ${wgerExercises.length} exercises from wger`);

        // ===== STEP 4: APPLY FILTERS IF NEEDED =====
        let filtered = wgerExercises;

        // Apply difficulty filter (from wgerCategory or default to 'beginner')
        if (filters.difficulty) {
            filtered = filtered.filter(
                (ex: any) => (ex.wgerCategory?.name?.toLowerCase() || 'beginner').includes(
                    filters.difficulty!.toLowerCase()
                )
            );
        }

        // Apply wgerMuscleId filter
        if (filters.wgerMuscleId) {
            filtered = filtered.filter((ex: any) =>
                ex.musclesPrimary?.some((m: any) => m.wgerMuscleId === filters.wgerMuscleId)
            );
        }

        // Return wger exercises directly (they're already saved to DB by wgerService)
        console.log(`✅ Returning ${filtered.length} wger exercises`);
        return { data: filtered, fromCache: false, count: filtered.length };
    } catch (error: any) {
        console.error("❌ searchExercises error:", error.message);

        // Fallback: Return any cached exercises from database
        console.log('⚠️  Falling back to cached exercises in database...');
        try {
            const cachedData = await Exercise.find({ isActive: true })
                .limit(12)
                .lean();

            if (cachedData.length > 0) {
                console.log(`✅ Returning ${cachedData.length} cached exercises from database`);
                return { data: cachedData, fromCache: true, fallback: true, count: cachedData.length };
            }
        } catch (fallbackError) {
            console.error('❌ Fallback failed:', fallbackError);
        }

        // Last resort: Return empty
        return { data: [], fromCache: false, count: 0, error: error.message };
    }
}

// ===== SEARCH BY KEYWORD (wger — full-text search) =====

/**
 * Search exercises by keyword (full-text search in MongoDB + wger fallback)
 */
export async function searchExercisesByKeyword(keyword: string) {
    try {
        const staleDate = new Date(
            Date.now() - EXERCISE_TTL_DAYS * 24 * 60 * 60 * 1000
        );

        // ===== STEP 1: CHECK MONGODB TEXT SEARCH =====
        const cached = await Exercise.find({
            $text: { $search: keyword },
            isActive: true,
            cachedAt: { $gte: staleDate },
        }).limit(10);

        if (cached.length >= 3) {
            console.log(`✅ Keyword exercise cache HIT for: "${keyword}"`);
            return { data: cached, fromCache: true };
        }

        // ===== STEP 2: HIT WGER API SEARCH =====
        console.log(
            `⚡ Keyword exercise cache MISS — calling wger for: "${keyword}"`
        );

        const exercises = (await wgerService.getExercisesFromWger({
            name: keyword,
        })) as any;

        if (!exercises || exercises.length === 0) {
            console.log(`ℹ️  No exercises found on wger for: "${keyword}"`);
            return { data: cached, fromCache: true };
        }

        console.log(`💾 ${exercises.length} exercises found on wger`);
        return { data: exercises, fromCache: false, count: exercises.length };
    } catch (error: any) {
        console.error("❌ searchExercisesByKeyword error:", error.message);
        throw error;
    }
}

// ===== GET EXERCISE BY ID =====

/**
 * Get single exercise by MongoDB _id
 */
export async function getExerciseById(id: string) {
    try {
        // Check MongoDB first
        const cached = await Exercise.findById(id);
        if (cached) {
            console.log(`✅ Exercise by ID cache HIT: ${id}`);
            return { data: cached, fromCache: true };
        }
        return { data: null, fromCache: false };
    } catch (error: any) {
        console.error("❌ getExerciseById error:", error.message);
        throw error;
    }
}

// ===== GET METADATA LISTS (muscles, equipment, categories) =====

/**
 * Get metadata lists from wger (with caching)
 * metaType: 'muscles' | 'equipment' | 'categories'
 */
export async function getExerciseMeta(
    metaType: "muscles" | "equipment" | "categories" | "bodyparts" | "exercisetypes"
) {
    try {
        // For backward compatibility, map old meta types to wger types
        const metaTypeMap: Record<string, string> = {
            bodyparts: "muscles",
            exercisetypes: "categories",
        };
        
        const wgerMetaType = metaTypeMap[metaType] || metaType;

        // Use wgerService to get metadata
        const meta = await wgerService.getWgerMeta();

        if (!meta) {
            throw new Error("Failed to fetch wger metadata");
        }

        // Return requested type
        let data;
        switch (wgerMetaType) {
            case "muscles":
                data = meta.muscles || [];
                break;
            case "equipment":
                data = meta.equipment || [];
                break;
            case "categories":
                data = meta.categories || [];
                break;
            default:
                data = [];
        }

        console.log(`✅ Meta fetched for: ${metaType} (${data.length} items)`);
        return { data, fromCache: true };
    } catch (error: any) {
        console.error("❌ getExerciseMeta error:", error.message);
        throw error;
    }
}

// ===== BULK SEED EXERCISES (run once or periodically) =====

/**
 * Bulk seed exercises from wger API
 * Uses wgerService to seed exercises from all wger categories
 * Run once to populate database
 */
export async function seedExercisesFromAPIs() {
    try {
        console.log(`🔄 Seeding exercises from wger...`);
        
        // Use wgerService to seed all exercises
        const totalSaved = await wgerService.seedAllExercisesFromWger();

        console.log(
            `✅ Seeding complete — ${totalSaved} exercises in MongoDB`
        );
        return totalSaved;
    } catch (error: any) {
        console.error("❌ seedExercisesFromAPIs error:", error.message);
        throw error;
    }
}

// ===== ADMIN FUNCTIONS =====

/**
 * Get exercise cache statistics (admin only)
 */
export async function getExerciseCacheStats() {
    try {
        const total = await Exercise.countDocuments({ isActive: true });
        const withVideo = await Exercise.countDocuments({
            isActive: true,
            "media.videoUrl": { $ne: "" },
        });
        const withImages = await Exercise.countDocuments({
            isActive: true,
            "media.imageUrls.0": { $exists: true },
        });
        const byDataSource = await Exercise.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: "$dataSource", count: { $sum: 1 } } },
        ]);

        const stats = {
            totalExercises: total,
            withVideo,
            withImages,
            byDataSource,
            timestamp: new Date(),
        };

        return stats;
    } catch (error: any) {
        console.error("❌ getExerciseCacheStats error:", error.message);
        throw error;
    }
}
