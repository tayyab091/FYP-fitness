import mongoose, { Schema, Document } from "mongoose";

/**
 * IProgressRecord Interface
 * 
 * Tracks body measurements and fitness benchmarks over time
 * Enables progress comparison and visual tracking
 */
export interface IProgressRecord extends Document {
    userId: mongoose.Types.ObjectId;
    trainerId?: mongoose.Types.ObjectId;
    relationshipId: mongoose.Types.ObjectId;

    recordedAt: Date;

    // Body measurements
    bodyMetrics: {
        weight: number; // kg
        height?: number; // cm (usually set once)
        bodyFatPercent?: number;
        muscleMassKg?: number;
        bmi?: number;
        measurements?: {
            chest?: number;
            waist?: number;
            hips?: number;
            leftArm?: number;
            rightArm?: number;
            leftThigh?: number;
            rightThigh?: number;
            shoulders?: number;
        };
    };

    // Fitness benchmarks
    fitnessMetrics?: {
        maxPushUps?: number;
        maxPullUps?: number;
        plankDurationSec?: number;
        runningPace?: number; // minutes per km
        benchPressMax?: number; // kg
        squatMax?: number; // kg
        deadliftMax?: number; // kg
    };

    // Progress photos
    photos?: {
        front?: string;
        back?: string;
        side?: string;
    };

    // Metadata
    enteredBy: "user" | "trainer";
    notes?: string;

    createdAt: Date;
    updatedAt: Date;
}

const MeasurementsSchema = new Schema(
    {
        chest: Number,
        waist: Number,
        hips: Number,
        leftArm: Number,
        rightArm: Number,
        leftThigh: Number,
        rightThigh: Number,
        shoulders: Number,
    },
    { _id: false }
);

const BodyMetricsSchema = new Schema(
    {
        weight: { type: Number, required: true },
        height: Number,
        bodyFatPercent: Number,
        muscleMassKg: Number,
        bmi: Number,
        measurements: MeasurementsSchema,
    },
    { _id: false }
);

const FitnessMetricsSchema = new Schema(
    {
        maxPushUps: Number,
        maxPullUps: Number,
        plankDurationSec: Number,
        runningPace: Number,
        benchPressMax: Number,
        squatMax: Number,
        deadliftMax: Number,
    },
    { _id: false }
);

const PhotosSchema = new Schema(
    {
        front: String,
        back: String,
        side: String,
    },
    { _id: false }
);

const ProgressRecordSchema = new Schema<IProgressRecord>(
    {
        // ===== OWNERSHIP =====
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        trainerId: {
            type: Schema.Types.ObjectId,
            ref: "Trainer",
            index: true,
        },
        relationshipId: {
            type: Schema.Types.ObjectId,
            ref: "TrainerClientRelationship",
            required: true,
        },

        // ===== TIMESTAMP =====
        recordedAt: {
            type: Date,
            default: Date.now,
            required: true,
            index: true,
        },

        // ===== MEASUREMENTS =====
        bodyMetrics: {
            type: BodyMetricsSchema,
            required: true,
        },

        // ===== FITNESS BENCHMARKS =====
        fitnessMetrics: FitnessMetricsSchema,

        // ===== PHOTOS =====
        photos: PhotosSchema,

        // ===== METADATA =====
        enteredBy: {
            type: String,
            enum: {
                values: ["user", "trainer"],
                message: "{VALUE} is not a valid entry type",
            },
            default: "user",
        },
        notes: String,
    },
    {
        timestamps: true,
    }
);

// Indexes
ProgressRecordSchema.index({ userId: 1, recordedAt: -1 });
ProgressRecordSchema.index({ trainerId: 1 });

export default mongoose.models.ProgressRecord || mongoose.model<IProgressRecord>('ProgressRecord', ProgressRecordSchema)
