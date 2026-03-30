import { Schema, model, models } from "mongoose";

export type UserRole = "admin" | "manager" | "employee";

export interface UserDocument {
  _id: Schema.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  department?: string;
  designation?: string;
  status: "active" | "inactive";
  manager?: Schema.Types.ObjectId;
  profilePicture?: string;
  lastLoginAt?: Date;
  // Stable per-install id used to enforce single-device login.
  deviceId?: string;
  // Updated on each authenticated request from the bound device.
  lastSeenAt?: Date;
  // When the deviceId was (re)bound.
  deviceIdBoundAt?: Date;

  // Personal Information
  phone?: string;
  dob?: Date;
  gender?: "Male" | "Female" | "Other";
  bloodGroup?: string;
  address?: string;

  // Work Information
  joinDate?: Date;
  workLocation?: string;
  shiftTiming?: string;
  team?: string;
  employeeType?: "Full-time" | "Part-time" | "Contract" | "Intern";

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
      default: "employee",
      required: true
    },
    department: {
      type: String,
      trim: true
    },
    designation: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    profilePicture: {
      type: String,
      trim: true
    },
    lastLoginAt: Date,
    deviceId: {
      type: String,
      trim: true
    },
    lastSeenAt: Date,
    deviceIdBoundAt: Date,

    // Personal Information
    phone: {
      type: String,
      trim: true
    },
    dob: {
      type: Date
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"]
    },
    bloodGroup: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },

    // Work Information
    joinDate: {
      type: Date
    },
    workLocation: {
      type: String,
      trim: true
    },
    shiftTiming: {
      type: String,
      trim: true
    },
    team: {
      type: String,
      trim: true
    },
    employeeType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Intern"]
    }
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    // eslint-disable-next-line no-param-reassign
    delete ret.passwordHash;
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const UserModel = models.User || model<UserDocument>("User", userSchema);

export default UserModel;



