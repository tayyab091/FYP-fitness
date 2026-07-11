import mongoose, { Schema, Document } from "mongoose";

export interface IPlatformSettings extends Document {
  settingKey: string;
  settingValue: any;
  description?: string;
  category?: string;
  lastUpdatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    settingKey: {
      type: String,
      required: [true, "Setting key is required"],
      unique: true,
      index: true,
      trim: true,
    },
    settingValue: {
      type: Schema.Types.Mixed,
      required: [true, "Setting value is required"],
    },
    description: String,
    category: {
      type: String,
      enum: [
        "chat",
        "registration",
        "maintenance",
        "subscriptions",
        "api",
      ],
      default: "general",
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.PlatformSettings || mongoose.model<IPlatformSettings>('PlatformSettings', PlatformSettingsSchema)
