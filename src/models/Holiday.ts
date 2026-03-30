import { Schema, model, models } from "mongoose";

export type HolidayType = "public" | "company";

export interface HolidayDocument {
  _id: Schema.Types.ObjectId;
  date: Date; // stored as start-of-day UTC
  name: string;
  type: HolidayType;
  description?: string;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const holidaySchema = new Schema<HolidayDocument>(
  {
    date: { type: Date, required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["public", "company"],
      default: "company",
      required: true
    },
    description: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

// One holiday per day
holidaySchema.index({ date: 1 }, { unique: true });

holidaySchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    // eslint-disable-next-line no-param-reassign
    delete ret._id;
    // eslint-disable-next-line no-param-reassign
    delete ret.__v;
    return ret;
  }
});

const HolidayModel =
  models.Holiday || model<HolidayDocument>("Holiday", holidaySchema);

export default HolidayModel;

