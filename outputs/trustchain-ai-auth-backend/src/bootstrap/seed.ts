import { connectDatabase, disconnectDatabase } from "../config/database";
import { DatabaseSeeder } from "./database-seeder";
import { demoUsersSeed } from "./seed-data";

async function main() {
  await connectDatabase();
  const result = await new DatabaseSeeder().seed();
  await disconnectDatabase();

  console.log("TrustChain AI seed completed");
  console.log(JSON.stringify(result, null, 2));
  console.log("\nDemo credentials:");
  for (const user of demoUsersSeed) {
    console.log(`${user.roles.join(",")} | ${user.email} | ${user.password}`);
  }
}

main().catch(async (error) => {
  console.error("TrustChain AI seed failed", error);
  await disconnectDatabase();
  process.exit(1);
});
