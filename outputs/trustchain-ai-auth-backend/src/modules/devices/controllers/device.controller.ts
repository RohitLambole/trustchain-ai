import type { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../../../shared/errors/app-error";
import { DeviceTrustService } from "../services/device-trust.service";

const deviceTrustService = new DeviceTrustService();

function requestContext(req: Request) {
  return {
    ipAddress: req.ip ?? req.socket.remoteAddress ?? "0.0.0.0",
    userAgent: req.get("user-agent")
  };
}

export class DeviceController {
  list(req: Request, res: Response, next: NextFunction) {
    deviceTrustService
      .listUserDevices(req.auth!.sub)
      .then((devices) => res.status(200).json({ devices }))
      .catch(next);
  }

  getById(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    if (!id) return next(new NotFoundError("Device not found"));

    deviceTrustService
      .getUserDevice(req.auth!.sub, id)
      .then((device) => res.status(200).json({ device }))
      .catch(next);
  }

  register(req: Request, res: Response, next: NextFunction) {
    deviceTrustService
      .registerDevice(req.auth!.sub, req.body.fingerprint, requestContext(req))
      .then((result) => res.status(result.isNew ? 201 : 200).json(result))
      .catch(next);
  }

  trust(req: Request, res: Response, next: NextFunction) {
    deviceTrustService
      .trustDevice(req.auth!.sub, req.body.deviceId)
      .then((device) => res.status(200).json({ device }))
      .catch(next);
  }

  block(req: Request, res: Response, next: NextFunction) {
    deviceTrustService
      .blockDevice(req.auth!.sub, req.body.deviceId, req.body.reason)
      .then((device) => res.status(200).json({ device }))
      .catch(next);
  }

  unblock(req: Request, res: Response, next: NextFunction) {
    deviceTrustService
      .unblockDevice(req.auth!.sub, req.body.deviceId)
      .then((device) => res.status(200).json({ device }))
      .catch(next);
  }
}
