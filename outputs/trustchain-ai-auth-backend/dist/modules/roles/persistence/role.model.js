"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleModel = void 0;
const mongoose_1 = require("mongoose");
const RoleSchema = new mongoose_1.Schema({
    name: { type: String, required: true, uppercase: true, trim: true, unique: true },
    description: String,
    permissions: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Permission", required: true, index: true }],
    isSystemRole: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false });
exports.RoleModel = (0, mongoose_1.model)("Role", RoleSchema, "roles");
