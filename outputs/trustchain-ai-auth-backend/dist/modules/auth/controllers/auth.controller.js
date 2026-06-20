"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const authService = new auth_service_1.AuthService();
function contextFrom(req) {
    return {
        ipAddress: req.ip ?? req.socket.remoteAddress ?? "0.0.0.0",
        userAgent: req.get("user-agent")
    };
}
class AuthController {
    register(req, res, next) {
        authService.register(req.body).then((result) => res.status(201).json(result)).catch(next);
    }
    login(req, res, next) {
        authService.login(req.body, contextFrom(req)).then((result) => res.status(200).json(result)).catch(next);
    }
    refresh(req, res, next) {
        authService.refresh(req.body).then((result) => res.status(200).json(result)).catch(next);
    }
    enrollTotp(req, res, next) {
        authService.enrollTotp(req.auth.sub).then((result) => res.status(200).json(result)).catch(next);
    }
    verifyTotp(req, res, next) {
        authService.verifyTotp(req.auth.sub, req.body).then((result) => res.status(200).json(result)).catch(next);
    }
    logout(req, res, next) {
        authService.logout(req.auth.sub, req.auth.sessionId, req.body).then((result) => res.status(200).json(result)).catch(next);
    }
    requestPasswordReset(req, res, next) {
        authService.requestPasswordReset(req.body).then((result) => res.status(202).json(result)).catch(next);
    }
    confirmPasswordReset(req, res, next) {
        authService.confirmPasswordReset(req.body).then((result) => res.status(200).json(result)).catch(next);
    }
}
exports.AuthController = AuthController;
