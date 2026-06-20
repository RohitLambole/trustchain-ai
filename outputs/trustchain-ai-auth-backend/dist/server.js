"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const app_1 = require("./app");
async function main() {
    await (0, database_1.connectDatabase)();
    const app = (0, app_1.createApp)();
    app.listen(env_1.env.PORT, () => {
        console.log(`TrustChain AI auth API listening on port ${env_1.env.PORT}`);
    });
}
main().catch((error) => {
    console.error("Unable to start TrustChain AI auth API", error);
    process.exit(1);
});
