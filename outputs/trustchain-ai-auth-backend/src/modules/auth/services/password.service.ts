import bcrypt from "bcrypt";
import { env } from "../../../config/env";

export class PasswordService {
  hash(password: string) {
    return bcrypt.hash(password, env.PASSWORD_BCRYPT_ROUNDS);
  }

  verify(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }
}
