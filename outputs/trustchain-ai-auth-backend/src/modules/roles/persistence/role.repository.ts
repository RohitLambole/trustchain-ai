import { BaseRepository } from "../../../shared/repositories/base.repository";
import type { Role } from "../domain/role.types";
import { RoleModel } from "./role.model";

export class RoleRepository extends BaseRepository<Role> {
  constructor() {
    super(RoleModel);
  }

  findByName(name: string) {
    return RoleModel.findOne({ name: name.toUpperCase() }).exec();
  }

  findOrCreateSystemRole(name: string, description?: string) {
    return RoleModel.findOneAndUpdate(
      { name: name.toUpperCase() },
      {
        $setOnInsert: {
          name: name.toUpperCase(),
          description: description ?? `${name.toUpperCase()} system role`,
          permissions: [],
          isSystemRole: true
        }
      },
      { upsert: true, new: true }
    ).exec();
  }
}
