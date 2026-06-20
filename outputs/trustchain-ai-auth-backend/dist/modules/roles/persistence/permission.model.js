"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionModel = void 0;
const mongoose_1 = require("mongoose");
const PermissionSchema = new mongoose_1.Schema({
    resource: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true },
    scope: { type: String, enum: ["SELF", "LIMITED", "ANY"], required: true },
    code: { type: String, required: true, unique: true, trim: true },
    description: String,
    riskLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true }
}, { timestamps: true, versionKey: false });
PermissionSchema.index({ resource: 1, action: 1, scope: 1 }, { unique: true });
exports.PermissionModel = (0, mongoose_1.model)("Permission", PermissionSchema, "permissions");
