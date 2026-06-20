import { model, Schema } from "mongoose";
import type { Role } from "../domain/role.types";

const RoleSchema = new Schema<Role>(
  {
    name: { type: String, required: true, uppercase: true, trim: true, unique: true },
    description: String,
    permissions: [{ type: Schema.Types.ObjectId, ref: "Permission", required: true, index: true }],
    isSystemRole: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);

export const RoleModel = model<Role>("Role", RoleSchema, "roles");
