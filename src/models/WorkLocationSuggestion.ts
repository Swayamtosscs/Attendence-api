import { Schema, model, models } from "mongoose";

export type WorkLocationSuggestionStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface WorkLocationSuggestionDocument {
  _id: Schema.Types.ObjectId;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  notes?: string;
  status: WorkLocationSuggestionStatus;
  createdBy: Schema.Types.ObjectId;
  decidedBy?: Schema.Types.ObjectId;
  decidedAt?: Date;
  decisionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const workLocationSuggestionSchema =
  new Schema<WorkLocationSuggestionDocument>(
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
      notes: {
        type: String,
        trim: true
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
        index: true
      },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
      },
      decidedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
      },
      decidedAt: {
        type: Date
      },
      decisionReason: {
        type: String,
        trim: true
      }
    },
    { timestamps: true }
  );

workLocationSuggestionSchema.index({
  latitude: 1,
  longitude: 1,
  status: 1
});

const WorkLocationSuggestionModel =
  models.WorkLocationSuggestion ||
  model<WorkLocationSuggestionDocument>(
    "WorkLocationSuggestion",
    workLocationSuggestionSchema
  );

export default WorkLocationSuggestionModel;


