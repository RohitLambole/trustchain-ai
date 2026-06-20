"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./config/env");
const auth_routes_1 = require("./modules/auth/auth.routes");
const device_routes_1 = require("./modules/devices/device.routes");
const error_middleware_1 = require("./shared/middleware/error.middleware");
const not_found_middleware_1 = require("./shared/middleware/not-found.middleware");
function createApp() {
    const app = (0, express_1.default)();
    app.set("trust proxy", 1);
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({ origin: env_1.corsOrigins, credentials: true }));
    app.use((0, compression_1.default)());
    app.use(express_1.default.json({ limit: "1mb" }));
    app.use(express_1.default.urlencoded({ extended: false }));
    if (env_1.env.NODE_ENV !== "test") {
        app.use((0, morgan_1.default)("combined"));
    }
    app.get("/health", (_req, res) => {
        res.status(200).json({ status: "ok", service: "trustchain-ai-auth" });
    });
    app.use("/api/auth", auth_routes_1.authRouter);
    app.use("/devices", device_routes_1.deviceRouter);
    app.use("/api/devices", device_routes_1.deviceRouter);
    app.use(not_found_middleware_1.notFoundMiddleware);
    app.use(error_middleware_1.errorMiddleware);
    return app;
}
