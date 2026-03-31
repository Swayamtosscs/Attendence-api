import { Schema, model, models } from "mongoose";

export interface AttendancePolicyDocument {
  _id: Schema.Types.ObjectId;
  halfDayMinutes: number;
  fullDayMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const attendancePolicySchema = new Schema<AttendancePolicyDocument>(
  {
    halfDayMinutes: { type: Number, required: true, min: 0 },
    fullDayMinutes: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

attendancePolicySchema.index({}, { unique: true });

const AttendancePolicyModel =
  models.AttendancePolicy ||
  model<AttendancePolicyDocument>("AttendancePolicy", attendancePolicySchema);

export default AttendancePolicyModel;

