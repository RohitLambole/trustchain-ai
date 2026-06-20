import { Types } from "mongoose";
import { BaseRepository } from "../../../shared/repositories/base.repository";
import { UserModel } from "./user.model";
import type { User } from "../domain/user.types";

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(UserModel);
  }

  findByEmailWithSecrets(email: string) {
    return UserModel.findOne({ email: email.toLowerCase() })
      .select("+passwordHash +totpSecretEncrypted +pendingTotpSecretEncrypted +passwordResetTokenHash +passwordResetExpiresAt")
      .populate({ path: "roles", populate: { path: "permissions" } })
      .exec();
  }

  findByEmail(email: string) {
    return UserModel.findOne({ email: email.toLowerCase() }).exec();
  }

  findByIdWithRoles(userId: string) {
    return UserModel.findById(userId).populate({ path: "roles", populate: { path: "permissions" } }).exec();
  }

  updatePassword(userId: string, passwordHash: string) {
    return UserModel.findByIdAndUpdate(userId, {
      $set: { passwordHash, passwordChangedAt: new Date() },
      $unset: { passwordResetTokenHash: "", passwordResetExpiresAt: "" }
    }).exec();
  }

  setPendingTotpSecret(userId: string, encryptedSecret: string) {
    return UserModel.findByIdAndUpdate(userId, { $set: { pendingTotpSecretEncrypted: encryptedSecret } }).exec();
  }

  enableTotp(userId: string, encryptedSecret: string) {
    return UserModel.findByIdAndUpdate(userId, {
      $set: { totpEnabled: true, totpSecretEncrypted: encryptedSecret },
      $unset: { pendingTotpSecretEncrypted: "" }
    }).exec();
  }

  setPasswordReset(userId: string | Types.ObjectId, tokenHash: string, expiresAt: Date) {
    return UserModel.findByIdAndUpdate(userId, {
      $set: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt }
    }).exec();
  }

  clearPasswordReset(userId: string | Types.ObjectId) {
    return UserModel.findByIdAndUpdate(userId, {
      $unset: { passwordResetTokenHash: "", passwordResetExpiresAt: "" }
    }).exec();
  }

  updateLastLogin(userId: string) {
    return UserModel.findByIdAndUpdate(userId, { $set: { lastLoginAt: new Date() } }).exec();
  }
}
