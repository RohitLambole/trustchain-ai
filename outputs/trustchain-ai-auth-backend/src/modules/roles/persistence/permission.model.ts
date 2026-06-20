import { model, Schema } from "mongoose";
import type { Permission } from "../domain/role.types";

const PermissionSchema = new Schema<Permission>(
  {
    resource: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true },
    scope: { type: String, enum: ["SELF", "LIMITED", "ANY"], required: true },
    code: { type: String, required: true, unique: true, trim: true },
    description: String,
    riskLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true }
  },
  { timestamps: true, versionKey: false }
);

PermissionSchema.index({ resource: 1, action: 1, scope: 1 }, { unique: true });

export const PermissionModel = model<Permission>("Permission", PermissionSchema, "permissions");
