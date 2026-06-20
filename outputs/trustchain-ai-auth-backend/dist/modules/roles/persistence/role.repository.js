"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleRepository = void 0;
const base_repository_1 = require("../../../shared/repositories/base.repository");
const role_model_1 = require("./role.model");
class RoleRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(role_model_1.RoleModel);
    }
    findByName(name) {
        return role_model_1.RoleModel.findOne({ name: name.toUpperCase() }).exec();
    }
}
exports.RoleRepository = RoleRepository;
