import { Router } from "express";
import { validateBody } from "../../shared/middleware/validate.middleware";
import { authenticate } from "../auth/middleware/authenticate.middleware";
import { DeviceController } from "./controllers/device.controller";
import { BlockDeviceDtoSchema, RegisterDeviceDtoSchema, TrustDeviceDtoSchema } from "./dto/device.dto";

const controller = new DeviceController();

export const deviceRouter = Router();

deviceRouter.use(authenticate);
deviceRouter.get("/", controller.list);
deviceRouter.get("/:id", controller.getById);
deviceRouter.post("/register", validateBody(RegisterDeviceDtoSchema), controller.register);
deviceRouter.post("/trust", validateBody(TrustDeviceDtoSchema), controller.trust);
deviceRouter.post("/block", validateBody(BlockDeviceDtoSchema), controller.block);
deviceRouter.post("/unblock", validateBody(TrustDeviceDtoSchema), controller.unblock);
