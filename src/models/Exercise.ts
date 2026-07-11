import mongoose, { Document, Schema } from "mongoose";

/**
 * IExercise Interface - Defines the Exercise document structure
 * Represents workout exercises with detailed fitness information
 * Extended to support data from both API Ninjas and RapidAPI with caching
 */
export interface IExercise extends Document {
    // Basic Info
    name: string;
    type: string;
    muscle: string;
    equipment: string;
    
    // Details
    difficulty: "beginner" | "intermediate" | "advanced";
    instructions: string;
    safetyInfo?: string;
    
    // ===== WGER INTEGRATION (Free Exercise Database with Videos + Images) =====
    wgerId?: number;
    wgerUuid?: string;
    wgerCategory?: { id: number; name: string };
    
    // Videos from wger
    wgerVideos?: Array<{
        wgerVideoId: number;
        uuid: string;
        videoUrl: string;
        isMain: boolean;
        durationSec: number;
        width: number;
        height: number;
        codec: string;
        fileSizeBytes: number;
        licenseAuthor: string;
    }>;
    
    // Images from wger
    wgerImages?: Array<{
        wgerImageId: number;
        uuid: string;
        imageUrl: string;
        isMain: boolean;
        isAiGenerated: boolean;
    }>;
    
    // Primary and secondary muscles from wger
    musclesPrimary?: Array<{
        wgerMuscleId: number;
        latinName: string;
        englishName: string;
        displayName: string;
        isFront: boolean;
        svgUrlMain: string;
        svgUrlSecondary: string;
    }>;
    
    musclesSecondary?: Array<{
        wgerMuscleId: number;
        latinName: string;
        englishName: string;
        displayName: string;
        isFront: boolean;
        svgUrlMain: string;
        svgUrlSecondary: string;
    }>;
    
    // Equipment from wger
    wgerEquipment?: Array<{
        wgerEquipmentId: number;
        name: string;
        displayName: string;
    }>;
    
    // Computed convenience fields
    primaryVideoUrl?: string;
    primaryImageUrl?: string;
    hasVideo?: boolean;
    hasImage?: boolean;
    isBodyweight?: boolean;
    imageUrl?: string;
    
    // ===== NEW: ENRICHED DATA FROM APIs =====
    // Media from RapidAPI (videos, images, thumbnails)
    media?: {
        videoUrl?: string;
        thumbnailUrl?: string;
        imageUrls?: string[];
        gifUrl?: string;
    };
    
    // API Source tracking
    apiSource?: {
        apiNinjasId?: string;      // ID from API Ninjas
        rapidApiId?: string;       // ID from RapidAPI
    };
    
    // Additional details from RapidAPI enrichment
    equipmentList?: string[];     // Array of equipment names
    keywords?: string[];          // For better search matching
    bodyPart?: string;            // Body part classification
    
    // Cache management
    cachedAt?: Date;
    lastApiSync?: Date;
    dataSource?: "api_ninjas" | "rapidapi" | "both" | "manual";
    apiNinjasFetchedAt?: Date;
    rapidApiFetchedAt?: Date;
    
    // Status & Audit
    isActive: boolean;
    createdBy?: mongoose.Schema.Types.ObjectId;
    updatedBy?: mongoose.Schema.Types.ObjectId;
    
    // Timestamps
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * ExerciseSchema - MongoDB Schema definition
 * Features:
 * - Detailed exercise information (type, muscle, equipment)
 * - Difficulty level validation (enum)
 * - Admin audit trail (createdBy, updatedBy)
 * - Soft delete via isActive flag
 * - Indexes for common queries
 * - Text search capabilities
 * - Timestamps for tracking
 */
const ExerciseSchema = new Schema<IExercise>(
    {
        // ===== BASIC INFO =====
        name: {
            type: String,
            required: [true, "Exercise name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"],
            maxlength: [150, "Name must be less than 150 characters"],
            index: true,
        },
        type: {
            type: String,
            trim: true,
            enum: {
                values: ["strength", "cardio", "flexibility", "balance", "functional"],
                message: "{VALUE} is not a valid exercise type"
            },
            index: true,
        },
        muscle: {
            type: String,
            trim: true,
            enum: {
                values: [
                    "chest",
                    "back",
                    "shoulders",
                    "biceps",
                    "triceps",
                    "forearms",
                    "quads",
                    "hamstrings",
                    "calves",
                    "glutes",
                    "abs",
                    "obliques",
                    "legs",
                    "full body"
                ],
                message: "{VALUE} is not a valid muscle group"
            },
            index: true,
        },
        equipment: {
            type: String,
            trim: true,
            enum: {
                values: [
                    "barbell",
                    "dumbbell",
                    "kettlebell",
                    "machine",
                    "cable",
                    "bodyweight",
                    "resistance band",
                    "medicine ball",
                    "foam roller",
                    "none"
                ],
                message: "{VALUE} is not a valid equipment type"
            },
            index: true,
        },
        
        // ===== DETAILS =====
        difficulty: {
            type: String,
            enum: {
                values: ["beginner", "intermediate", "advanced"],
                message: "{VALUE} is not a valid difficulty level"
            },
            default: "intermediate",
            index: true,
        },
        instructions: {
            type: String,
            required: [true, "Instructions are required"],
            trim: true,
            minlength: [10, "Instructions must be at least 10 characters"],
            maxlength: [2000, "Instructions must be less than 2000 characters"],
        },
        
        // ===== WGER FIELDS =====
        wgerId: { type: Number, sparse: true },
        wgerUuid: { type: String, sparse: true },
        wgerCategory: {
            id: Number,
            name: String,
        },
        
        // Videos from wger
        wgerVideos: [
            {
                wgerVideoId: Number,
                uuid: String,
                videoUrl: String,
                isMain: Boolean,
                durationSec: Number,
                width: Number,
                height: Number,
                codec: String,
                fileSizeBytes: Number,
                licenseAuthor: String,
            }
        ],
        
        // Images from wger
        wgerImages: [
            {
                wgerImageId: Number,
                uuid: String,
                imageUrl: String,
                isMain: Boolean,
                isAiGenerated: Boolean,
            }
        ],
        
        // Primary muscles from wger
        musclesPrimary: [
            {
                wgerMuscleId: Number,
                latinName: String,
                englishName: String,
                displayName: String,
                isFront: Boolean,
                svgUrlMain: String,
                svgUrlSecondary: String,
            }
        ],
        
        // Secondary muscles from wger
        musclesSecondary: [
            {
                wgerMuscleId: Number,
                latinName: String,
                englishName: String,
                displayName: String,
                isFront: Boolean,
                svgUrlMain: String,
                svgUrlSecondary: String,
            }
        ],
        
        // Equipment from wger
        wgerEquipment: [
            {
                wgerEquipmentId: Number,
                name: String,
                displayName: String,
            }
        ],
        
        // Computed convenience fields
        primaryVideoUrl: { type: String, default: "" },
        primaryImageUrl: { type: String, default: "" },
        hasVideo: { type: Boolean, default: false },
        hasImage: { type: Boolean, default: false },
        isBodyweight: { type: Boolean, default: false },
        imageUrl: { type: String, default: "" },
        
        // ===== MEDIA (from RapidAPI) =====
        media: {
            videoUrl: { type: String, default: "" },
            thumbnailUrl: { type: String, default: "" },
            imageUrls: { type: [String], default: [] },
            gifUrl: { type: String, default: "" },
        },
        
        // ===== API SOURCE TRACKING =====
        apiSource: {
            apiNinjasId: { type: String, default: null },
            rapidApiId: { type: String, default: null },
        },
        
        // ===== EXTENDED DATA (from both APIs) =====
        safetyInfo: { type: String, default: "" },
        equipmentList: { type: [String], default: [] },
        keywords: { type: [String], default: [] },
        bodyPart: { type: String, default: null },
        
        // ===== CACHE MANAGEMENT =====
        cachedAt: { type: Date, default: Date.now },
        lastApiSync: { type: Date, default: Date.now },
        dataSource: {
            type: String,
            enum: {
                values: ["api_ninjas", "rapidapi", "wger", "both", "manual"],
                message: "{VALUE} is not a valid data source"
            },
            default: "manual",
        },
        apiNinjasFetchedAt: { type: Date, default: null },
        rapidApiFetchedAt: { type: Date, default: null },
        
        // ===== STATUS & AUDIT =====
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
// Compound index for filtering exercises
ExerciseSchema.index({ muscle: 1, difficulty: 1, isActive: 1 });
// Compound index for equipment filter
ExerciseSchema.index({ equipment: 1, type: 1, isActive: 1 });
// Text search index for name, instructions, and keywords (for full-text search)
ExerciseSchema.index({ name: "text", instructions: "text", keywords: "text" });
// Index for recent exercises
ExerciseSchema.index({ isActive: 1, createdAt: -1 });
// API tracking indexes
ExerciseSchema.index({ "apiSource.rapidApiId": 1 }, { sparse: true });
ExerciseSchema.index({ bodyPart: 1 });
ExerciseSchema.index({ dataSource: 1 });
// Cache management index for TTL queries
ExerciseSchema.index({ cachedAt: 1 });
// WGER indexes
ExerciseSchema.index({ wgerId: 1 }, { sparse: true });
ExerciseSchema.index({ "wgerCategory.id": 1 });
ExerciseSchema.index({ hasVideo: 1 });
ExerciseSchema.index({ isBodyweight: 1 });

// ===== STATIC METHODS =====
/**
 * Static method to find exercises by muscle group
 */
ExerciseSchema.statics.findByMuscle = async function (muscle: string) {
    return this.find({ muscle, isActive: true });
};

/**
 * Static method to find exercises by difficulty
 */
ExerciseSchema.statics.findByDifficulty = async function (difficulty: string) {
    return this.find({ difficulty, isActive: true });
};

// ===== VIRTUALS =====
/**
 * Display name for difficulty
 */
ExerciseSchema.virtual("difficultyLabel").get(function (this: IExercise) {
    const labels: Record<string, string> = {
        beginner: "🟢 Beginner",
        intermediate: "🟡 Intermediate",
        advanced: "🔴 Advanced"
    };
    return labels[this.difficulty] || this.difficulty;
});

// ===== MODEL EXPORT =====
export default mongoose.models.Exercise || mongoose.model<IExercise>('Exercise', ExerciseSchema)
