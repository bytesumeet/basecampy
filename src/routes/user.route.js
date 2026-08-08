import { Router } from "express";
import {
    getCurrentUser,
    loginUser,
    logoutUser,
    registerUser,
    resendVerificatonEmail,
    verifyEmail,
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
userRouter.route("/current-user").get(verifyJWT, getCurrentUser);
userRouter.route("/verify-email/:verificationToken").get(verifyEmail);
user.route("/resend-verification-email").post(
    verifyJWT,
    resendVerificatonEmail,
);

export { userRouter };
