"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const base_repository_1 = require("../../../shared/repositories/base.repository");
const user_model_1 = require("./user.model");
class UserRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(user_model_1.UserModel);
    }
    findByEmailWithSecrets(email) {
        return user_model_1.UserModel.findOne({ email: email.toLowerCase() })
            .select("+passwordHash +totpSecretEncrypted +pendingTotpSecretEncrypted +passwordResetTokenHash +passwordResetExpiresAt")
            .populate({ path: "roles", populate: { path: "permissions" } })
            .exec();
    }
    findByEmail(email) {
        return user_model_1.UserModel.findOne({ email: email.toLowerCase() }).exec();
    }
    findByIdWithRoles(userId) {
        return user_model_1.UserModel.findById(userId).populate({ path: "roles", populate: { path: "permissions" } }).exec();
    }
    updatePassword(userId, passwordHash) {
        return user_model_1.UserModel.findByIdAndUpdate(userId, {
            $set: { passwordHash, passwordChangedAt: new Date() },
            $unset: { passwordResetTokenHash: "", passwordResetExpiresAt: "" }
        }).exec();
    }
    setPendingTotpSecret(userId, encryptedSecret) {
        return user_model_1.UserModel.findByIdAndUpdate(userId, { $set: { pendingTotpSecretEncrypted: encryptedSecret } }).exec();
    }
    enableTotp(userId, encryptedSecret) {
        return user_model_1.UserModel.findByIdAndUpdate(userId, {
            $set: { totpEnabled: true, totpSecretEncrypted: encryptedSecret },
            $unset: { pendingTotpSecretEncrypted: "" }
        }).exec();
    }
    setPasswordReset(userId, tokenHash, expiresAt) {
        return user_model_1.UserModel.findByIdAndUpdate(userId, {
            $set: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt }
        }).exec();
    }
    clearPasswordReset(userId) {
        return user_model_1.UserModel.findByIdAndUpdate(userId, {
            $unset: { passwordResetTokenHash: "", passwordResetExpiresAt: "" }
        }).exec();
    }
    updateLastLogin(userId) {
        return user_model_1.UserModel.findByIdAndUpdate(userId, { $set: { lastLoginAt: new Date() } }).exec();
    }
}
exports.UserRepository = UserRepository;
