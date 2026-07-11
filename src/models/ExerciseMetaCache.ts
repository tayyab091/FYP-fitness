import mongoose, { Schema, Document } from "mongoose";

/**
 * IExerciseMetaCache Interface
 * Stores stable metadata lists from RapidAPI Exercise Database and wger
 * These lists rarely change, so we cache them for 90 days
 */
export interface IExerciseMetaCache extends Document {
    // What type of meta data: 'muscles' | 'bodyparts' | 'equipments' | 'exercisetypes' | 'categories'
    metaType: "muscles" | "bodyparts" | "equipments" | "exercisetypes" | "categories";

    // The actual list from the API
    data: any[];

    // Cache management
    cachedAt: Date;
    hitCount: number;

    // Timestamps
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * ExerciseMetaCacheSchema
 * Stores stable metadata lists from RapidAPI and wger
 * Automatically expires after 90 days via TTL index
 */
const ExerciseMetaCacheSchema = new Schema<IExerciseMetaCache>(
    {
        // ===== META TYPE =====
        // What type of meta data: 'muscles' | 'bodyparts' | 'equipments' | 'exercisetypes' | 'categories'
        metaType: {
            type: String,
            enum: {
                values: ["muscles", "bodyparts", "equipments", "exercisetypes", "categories"],
                message: "{VALUE} is not a valid meta type"
            },
            required: true,
            unique: true,
            index: true,
        },

        // ===== DATA =====
        // The actual list from the API (array of strings or objects)
        data: {
            type: [Schema.Types.Mixed] as any,
            default: [],
            required: true,
        },

        // ===== CACHE MANAGEMENT =====
        cachedAt: { type: Date, default: Date.now },
        hitCount: { type: Number, default: 1 },
    },
    {
        timestamps: true,
    }
);

/**
 * TTL Index: Auto-expire meta cache after 90 days
 * MongoDB will automatically delete documents 90 days after cachedAt
 * 90 days = 7,776,000 seconds
 */
ExerciseMetaCacheSchema.index(
    { cachedAt: 1 },
    { expireAfterSeconds: 7776000, background: true }
);

/**
 * Model Export
 */
export default mongoose.models.ExerciseMetaCache || mongoose.model<IExerciseMetaCache>('ExerciseMetaCache', ExerciseMetaCacheSchema)
