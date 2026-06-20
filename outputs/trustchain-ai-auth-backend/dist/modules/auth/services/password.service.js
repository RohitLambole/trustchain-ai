"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const env_1 = require("../../../config/env");
class PasswordService {
    hash(password) {
        return bcrypt_1.default.hash(password, env_1.env.PASSWORD_BCRYPT_ROUNDS);
    }
    verify(password, hash) {
        return bcrypt_1.default.compare(password, hash);
    }
}
exports.PasswordService = PasswordService;
