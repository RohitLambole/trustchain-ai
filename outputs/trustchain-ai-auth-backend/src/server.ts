import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { createApp } from "./app";
import { runStartupBootstrap } from "./bootstrap/startup-bootstrap";

async function main() {
  await connectDatabase();
  await runStartupBootstrap();
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`TrustChain AI auth API listening on port ${env.PORT}`);
  });
}

main().catch((error) => {
  console.error("Unable to start TrustChain AI auth API", error);
  process.exit(1);
});
