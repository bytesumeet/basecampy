import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    verifyEmail,
    resendVerificationEmail,
    refreshAccessToken,
    forgotPasswordRequest,
    resetForgotPassword,
    changeCurrentPassword,
} from "../controllers/user.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
    userLoginValidator,
    userRegistrationValidator,
    userChangeCurrentPasswordValidator,
    userForgotPasswordValidator,
    userResetForgotPasswordValidator,
} from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

// Unprotected routes
userRouter
    .route("/register")
    .post(userRegistrationValidator(), validate, registerUser);
userRouter.route("/verify-email/:verificationToken").get(verifyEmail);
userRouter.route("/login").post(userLoginValidator(), validate, loginUser);
userRouter.route("/refresh-token").post(refreshAccessToken);
userRouter
    .route("/forgot-password")
    .post(userForgotPasswordValidator(), validate, forgotPasswordRequest);
userRouter
    .route("/reset-password/:resetPasswordToken")
    .post(userResetForgotPasswordValidator(), validate, resetForgotPassword);

// Protected routes
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/current-user").get(verifyJWT, getCurrentUser);
userRouter
    .route("/resend-verification-email")
    .post(verifyJWT, resendVerificationEmail);
userRouter
    .route("/change-password")
    .post(
        userChangeCurrentPasswordValidator(),
        validate,
        verifyJWT,
        changeCurrentPassword,
    );

export { userRouter };