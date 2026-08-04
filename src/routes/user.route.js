import { Router } from "express";
import { loginUser, registerUser } from "../controllers/user.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
    userLoginValidator,
    userRegistrationVaildator,
} from "../validators/index.js";

const userRouter = Router();
userRouter
    .route("/register")
    .post(userRegistrationVaildator(), validate, registerUser);
userRouter.route("/login").post(userLoginValidator(), validate, loginUser);

export { userRouter };
