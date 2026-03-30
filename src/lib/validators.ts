import { z } from "zod";

export const registerUserSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(["admin", "manager", "employee"]).optional().default("employee"),
  department: z.string().optional(),
  designation: z.string().optional(),
  managerId: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  deviceId: z.string().min(1).max(128).optional()
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  role: z.enum(["admin", "manager", "employee"]).optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  managerId: z.string().nullable().optional()
});

export const attendanceCheckInSchema = z.object({
  notes: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  deviceInfo: z.string().optional()
});

export const attendanceCheckOutSchema = z.object({
  notes: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  deviceInfo: z.string().optional()
});

export const attendanceQuerySchema = z.object({
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["present", "absent", "half-day", "on-leave"]).optional()
});

export const attendanceManualEntrySchema = z.object({
  userId: z.string(),
  date: z.string().datetime(),
  checkInAt: z.string().datetime(),
  checkOutAt: z.string().datetime().optional(),
  status: z.enum(["present", "absent", "half-day", "on-leave"]).optional(),
  notes: z.string().optional()
});

export const attendanceUpdateSchema = z.object({
  date: z.string().datetime().optional(),
  checkInAt: z.string().datetime().optional(),
  checkOutAt: z.string().datetime().optional(),
  status: z.enum(["present", "absent", "half-day", "on-leave"]).optional(),
  notes: z.string().optional()
});

export const leaveRequestSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  type: z.enum(["sick", "casual", "earned", "unpaid", "other"]).default("other"),
  reason: z.string().min(3).max(500).optional()
});

export const leaveDecisionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reply: z.string().min(3).max(500).optional()
});

export const sendMessageSchema = z.object({
  recipientId: z.string().min(1),
  content: z.string().min(1).max(5000)
});

export const getMessagesQuerySchema = z.object({
  userId: z.string().optional(),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
  before: z.string().datetime().optional()
});

export const workLocationCreateSchema = z.object({
  name: z.string().min(1).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(1).max(10000)
});

export const workLocationUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(1).max(10000).optional(),
  isActive: z.boolean().optional()
});

export const holidayCreateSchema = z.object({
  // Accept ISO date or datetime; backend will normalize to start-of-day UTC.
  date: z.string().min(4),
  name: z.string().min(1).max(200),
  type: z.enum(["public", "company"]).optional().default("company"),
  description: z.string().max(500).optional()
});

export const holidayUpdateSchema = z.object({
  date: z.string().min(4).optional(),
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["public", "company"]).optional(),
  description: z.string().max(500).optional()
});

export const holidayQuerySchema = z.object({
  year: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : undefined)),
  month: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : undefined))
});

export const salarySlipCreateSchema = z.object({
  userId: z.string(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  basicSalary: z.number().min(0),
  earnings: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        amount: z.number().min(0)
      })
    )
    .optional()
    .default([]),
  deductions: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        amount: z.number().min(0)
      })
    )
    .optional()
    .default([]),
  notes: z.string().max(1000).optional()
});

export const salarySlipQuerySchema = z.object({
  userId: z.string().optional(),
  month: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  year: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
});


