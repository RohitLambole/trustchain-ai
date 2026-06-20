import type { NextFunction, Request, Response } from "express";
import { AuditLogModel } from "../../audit-logs/persistence/audit-log.model";
import { DeviceModel } from "../../devices/persistence/device.model";
import { PermissionModel } from "../../roles/persistence/permission.model";
import { RoleModel } from "../../roles/persistence/role.model";
import { UserModel } from "../../users/persistence/user.model";

export class AdminController {
  async dashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const [users, roles, permissions, devices, auditEvents, recentUsers] = await Promise.all([
        UserModel.countDocuments({}).exec(),
        RoleModel.countDocuments({}).exec(),
        PermissionModel.countDocuments({}).exec(),
        DeviceModel.countDocuments({}).exec(),
        AuditLogModel.countDocuments({}).exec(),
        UserModel.find({})
          .sort({ createdAt: -1 })
          .limit(25)
          .select("email status roles lastLoginAt createdAt")
          .populate({ path: "roles", select: "name" })
          .lean()
          .exec()
      ]);

      res.status(200).json({
        stats: {
          users,
          roles,
          permissions,
          devices,
          auditEvents,
          health: "OK"
        },
        recentUsers: recentUsers.map((user) => ({
          id: user._id.toString(),
          email: user.email,
          status: user.status,
          roles: (user.roles ?? []).map((role: any) => role.name ?? role.toString()).filter(Boolean),
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        }))
      });
    } catch (error) {
      next(error);
    }
  }
}
