"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceController = void 0;
const app_error_1 = require("../../../shared/errors/app-error");
const device_trust_service_1 = require("../services/device-trust.service");
const deviceTrustService = new device_trust_service_1.DeviceTrustService();
function requestContext(req) {
    return {
        ipAddress: req.ip ?? req.socket.remoteAddress ?? "0.0.0.0",
        userAgent: req.get("user-agent")
    };
}
class DeviceController {
    list(req, res, next) {
        deviceTrustService
            .listUserDevices(req.auth.sub)
            .then((devices) => res.status(200).json({ devices }))
            .catch(next);
    }
    getById(req, res, next) {
        const { id } = req.params;
        if (!id)
            return next(new app_error_1.NotFoundError("Device not found"));
        deviceTrustService
            .getUserDevice(req.auth.sub, id)
            .then((device) => res.status(200).json({ device }))
            .catch(next);
    }
    register(req, res, next) {
        deviceTrustService
            .registerDevice(req.auth.sub, req.body.fingerprint, requestContext(req))
            .then((result) => res.status(result.isNew ? 201 : 200).json(result))
            .catch(next);
    }
    trust(req, res, next) {
        deviceTrustService
            .trustDevice(req.auth.sub, req.body.deviceId)
            .then((device) => res.status(200).json({ device }))
            .catch(next);
    }
    block(req, res, next) {
        deviceTrustService
            .blockDevice(req.auth.sub, req.body.deviceId, req.body.reason)
            .then((device) => res.status(200).json({ device }))
            .catch(next);
    }
    unblock(req, res, next) {
        deviceTrustService
            .unblockDevice(req.auth.sub, req.body.deviceId)
            .then((device) => res.status(200).json({ device }))
            .catch(next);
    }
}
exports.DeviceController = DeviceController;
