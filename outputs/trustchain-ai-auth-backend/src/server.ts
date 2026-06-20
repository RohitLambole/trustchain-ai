import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { createApp } from "./app";

async function main() {
  await connectDatabase();
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`TrustChain AI auth API listening on port ${env.PORT}`);
  });
}

main().catch((error) => {
  console.error("Unable to start TrustChain AI auth API", error);
  process.exit(1);
});
