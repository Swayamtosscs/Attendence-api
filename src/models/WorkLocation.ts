import { Schema, model, models } from "mongoose";

export interface WorkLocationDocument {
  _id: Schema.Types.ObjectId;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  createdBy?: Schema.Types.ObjectId;
  isActive: boolean;
  status: "pending" | "approved" | "rejected";
  approvedBy?: Schema.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const workLocationSchema = new Schema<WorkLocationDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    radius: {
      type: Number,
      required: true,
      min: 1,
      max: 10000
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    approvedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Compound index for location queries
workLocationSchema.index({ latitude: 1, longitude: 1 });
workLocationSchema.index({ isActive: 1, name: 1 });
workLocationSchema.index({ status: 1, createdAt: -1 });

const WorkLocationModel =
  models.WorkLocation ||
  model<WorkLocationDocument>("WorkLocation", workLocationSchema);

export default WorkLocationModel;






