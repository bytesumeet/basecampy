import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { userRegistrationVaildator } from "../validators/index.js";

const userRouter = Router();
userRouter.route("/register").post(userRegistrationVaildator(), validate,registerUser);

export { userRouter };
