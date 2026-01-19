import { Schema, model, models } from "mongoose";

export interface SalaryComponent {
  name: string;
  amount: number;
}

export type SalarySlipStatus = "draft" | "finalized" | "paid";

export interface SalarySlipDocument {
  _id: Schema.Types.ObjectId;
  user: Schema.Types.ObjectId;
  month: number; // 1-12
  year: number;

  basicSalary: number;
  earnings: SalaryComponent[];
  deductions: SalaryComponent[];

  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;

  attendanceSummary?: {
    startDate: Date;
    endDate: Date;
    presentDays: number;
    halfDays: number;
    absentDays: number;
    onLeaveDays: number;
    totalMinutes: number;
  };

  status: SalarySlipStatus;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const salaryComponentSchema = new Schema<SalaryComponent>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const salarySlipSchema = new Schema<SalarySlipDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      index: true
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
      index: true
    },
    basicSalary: {
      type: Number,
      required: true,
      min: 0
    },
    earnings: {
      type: [salaryComponentSchema],
      default: []
    },
    deductions: {
      type: [salaryComponentSchema],
      default: []
    },
    grossEarnings: {
      type: Number,
      required: true,
      min: 0
    },
    totalDeductions: {
      type: Number,
      required: true,
      min: 0
    },
    netSalary: {
      type: Number,
      required: true
    },
    attendanceSummary: {
      startDate: Date,
      endDate: Date,
      presentDays: Number,
      halfDays: Number,
      absentDays: Number,
      onLeaveDays: Number,
      totalMinutes: Number
    },
    status: {
      type: String,
      enum: ["draft", "finalized", "paid"],
      default: "draft"
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

salarySlipSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

const SalarySlipModel =
  models.SalarySlip || model<SalarySlipDocument>("SalarySlip", salarySlipSchema);

export default SalarySlipModel;



