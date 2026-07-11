import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

/**
 * IUser Interface - Defines the User document structure
 * Represents a user account with authentication and subscription management
 */
export interface IUser extends Document {
    // Authentication
    email: string;
    password: string;
    
    // Profile
    fullName: string;
    avatarUrl?: string;
    
    // Role & Permissions
    role: "admin" | "trainer" | "user" | "gym_owner" | "super_admin";
    
    // Verification & Account Status
    verificationStatus: "pending" | "verified" | "rejected" | "suspended";
    
    // Subscription & Billing
    subscription?: {
        plan: "basic" | "pro" | "elite" | null;
        status: "active" | "inactive" | "cancelled";
        startDate?: Date;
        endDate?: Date;
        paymentId?: string;
    };
    
    // Worldwide Support
    country?: string;
    phoneNumber?: string;
    profileImage?: string;
    language?: string;
    timezone?: string;
    currency?: string;
    
    // Chat & Engagement
    freeChatsUsed: number;
    lastActive?: Date;
    
    // Account Status & Audit
    isActive: boolean;
    lastLogin?: Date;
    
    // Password Reset (Forgot Password)
    passwordResetToken?: string | null;
    passwordResetExpires?: Date | null;
    
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    
    // Methods
    comparePassword(candidate: string): Promise<boolean>;
}

/**
 * UserSchema - MongoDB Schema definition
 * Features:
 * - Password hashing with bcryptjs (pre-save hook)
 * - Email uniqueness validation
 * - Subscription tracking for payment module
 * - Soft delete capability via isActive flag
 * - Automatic timestamps (createdAt, updatedAt)
 * - Indexes for performance
 */
const UserSchema = new Schema<IUser>(
    {
        // ===== AUTHENTICATION =====
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please provide a valid email"
            ],
            index: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
            select: false, // Never include password in default queries
        },
        
        // ===== PROFILE =====
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
            minlength: [2, "Full name must be at least 2 characters"],
            maxlength: [100, "Full name must be less than 100 characters"],
            index: true,
        },
        avatarUrl: {
            type: String,
            default: null,
            trim: true,
        },
        
        // ===== ROLE & PERMISSIONS =====
        role: {
            type: String,
            enum: {
                values: ["admin", "trainer", "user", "gym_owner", "super_admin"],
                message: "{VALUE} is not a valid role"
            },
            default: "user",
            index: true,
        },
        
        // ===== VERIFICATION & ACCOUNT STATUS =====
        verificationStatus: {
            type: String,
            enum: {
                values: ["pending", "verified", "rejected", "suspended"],
                message: "{VALUE} is not a valid verification status"
            },
            default: "pending",
            index: true,
        },
        
        // ===== SUBSCRIPTION & BILLING =====
        subscription: {
            plan: {
                type: String,
                enum: {
                    values: ["basic", "pro", "elite", null],
                    message: "{VALUE} is not a valid plan"
                },
                default: null,
            },
            status: {
                type: String,
                enum: {
                    values: ["active", "inactive", "cancelled"],
                    message: "{VALUE} is not a valid subscription status"
                },
                default: "inactive",
            },
            startDate: {
                type: Date,
                default: null,
            },
            endDate: {
                type: Date,
                default: null,
            },
            paymentId: {
                type: String,
                default: null,
            },
        },
        
        // ===== WORLDWIDE SUPPORT =====
        country: {
            type: String,
            default: "",
            trim: true,
            index: true,
        },
        phoneNumber: {
            type: String,
            default: "",
            trim: true,
        },
        profileImage: {
            type: String,
            default: "",
            trim: true,
        },
        language: {
            type: String,
            default: "en",
            trim: true,
        },
        timezone: {
            type: String,
            default: "UTC",
            trim: true,
        },
        currency: {
            type: String,
            default: "USD",
            trim: true,
        },
        
        // ===== CHAT & ENGAGEMENT =====
        freeChatsUsed: {
            type: Number,
            default: 0,
            min: [0, "Free chats used cannot be negative"],
        },
        lastActive: {
            type: Date,
            default: () => new Date(),
            index: true,
        },
        
        // ===== ACCOUNT STATUS & AUDIT =====
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        lastLogin: {
            type: Date,
            default: null,
        },

        // ===== PASSWORD RESET (Forgot Password) =====
        passwordResetToken: {
            type: String,
            default: null,
            select: false, // Never include in queries by default
        },
        passwordResetExpires: {
            type: Date,
            default: null,
            select: false, // Never include in queries by default
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ===== INDEXES =====
// Compound index for subscription lookup
UserSchema.index({ "subscription.status": 1, "subscription.plan": 1 });
// Index for active users
UserSchema.index({ isActive: 1, createdAt: -1 });
// Indexes for role-based queries
UserSchema.index({ role: 1, verificationStatus: 1 });
// Index for country-based queries (worldwide support)
UserSchema.index({ country: 1, role: 1 });
// Index for tracking last active users
UserSchema.index({ lastActive: -1 });
// Index for password reset token lookup (faster reset lookups)
UserSchema.index({ passwordResetToken: 1, passwordResetExpires: 1 });

// ===== PRE-SAVE HOOKS =====
/**
 * Hash password before saving if modified
 * This ensures passwords are never stored in plain text
 */
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err: any) {
        next(err);
    }
});

// ===== INSTANCE METHODS =====
/**
 * Compare candidate password with hashed password
 * Used during login to verify password
 */
UserSchema.methods.comparePassword = async function (
    candidate: string
): Promise<boolean> {
    return bcrypt.compare(candidate, this.password);
};

// ===== VIRTUALS =====
/**
 * Virtual field to check if subscription is currently active
 */
UserSchema.virtual("hasActiveSubscription").get(function (this: IUser) {
    if (!this.subscription) return false;
    if (this.subscription.status !== "active") return false;
    if (!this.subscription.endDate) return false;
    return new Date() < this.subscription.endDate;
});

// ===== MODEL EXPORT =====
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
