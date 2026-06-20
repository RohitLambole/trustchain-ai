import { env } from "../config/env";
import { DatabaseSeeder } from "./database-seeder";

export async function runStartupBootstrap() {
  if (!env.BOOTSTRAP_DATABASE_ON_START) {
    return;
  }

  const result = await new DatabaseSeeder().seed();
  console.log("TrustChain AI startup bootstrap completed", result);
}
