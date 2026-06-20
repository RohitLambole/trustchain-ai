import { Router } from "express";
import { authenticate } from "../auth/middleware/authenticate.middleware";
import { AdminController } from "./controllers/admin.controller";

const controller = new AdminController();

export const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.get("/dashboard", controller.dashboard.bind(controller));
