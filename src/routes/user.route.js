import { Router } from "express";
import {
    loginUser,
    logoutUser,
    registerUser,
} from "../controllers/user.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
    userLoginValidator,
    userRegistrationVaildator,
} from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();
userRouter
    .route("/register")
    .post(userRegistrationVaildator(), validate, registerUser);
userRouter.route("/login").post(userLoginValidator(), validate, loginUser);
userRouter.route("/logout").post(verifyJWT, logoutUser);

export { userRouter };
