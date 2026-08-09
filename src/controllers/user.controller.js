import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import {
    sendEmail,
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
} from "../utils/mail.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import {
    FORGOT_PASSWORD_REDIRECT_URL,
    REFRESH_TOKEN_SECRET,
} from "../constants.js";
import { log } from "console";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            throw new ApiError(404, "User not found");
        }
        const accessToken = await existingUser.generateAccessToken();
        const refreshToken = await existingUser.generateRefreshToken();
        existingUser.refreshToken = refreshToken;
        await existingUser.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating access and refresh tokens",
            [error],
        );
    }
};

const registerUser = AsyncHandler(async (req, res) => {
    const { username, email, password, fullName } = req.body;
    const existingUser = await User.findOne({
        $or: [{ username }, { email }],
    });
    if (existingUser) {
        throw new ApiError(
            409,
            "User with this username or email already exists",
        );
    }
    const user = await User.create({
        username,
        email,
        password,
        fullName,
        isEmailVerified: false,
    });
    const { hashToken, unHashToken, expiry } = user.generateTemporaryToken();
    user.emailVerificationToken = hashToken;
    user.emailVerificationExpiry = expiry;
    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user?.email,
        subject: "Please verify your email address",
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/auth/verify-email/${unHashToken}`,
        ),
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -isEmailVerified -forgotPasswordToken -forgotPasswordExpiry -emailVerificationToken -emailVerificationExpiry",
    );
    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while creating the user",
        );
    }
    return res.status(201).json(
        new ApiResponse(
            201,
            { user: createdUser },
            "User registered successfully. Verification email has been sent.",
        ),
    );
});

const loginUser = AsyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id,
    );
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -isEmailVerified -forgotPasswordToken -forgotPasswordExpiry -emailVerificationToken -emailVerificationExpiry",
    );
    if (!loggedInUser) {
        throw new ApiError(500, "Something went wrong while logging in");
    }

    const cookieOptions = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully",
            ),
        );
});

const logoutUser = AsyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized request");
    }
    await User.findByIdAndUpdate(user._id, {
        $unset: { refreshToken: 1 },
    });

    const cookieOptions = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const getCurrentUser = AsyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized request");
    }
    const userData = await User.findById(user._id).select(
        "-password -refreshToken -isEmailVerified -forgotPasswordToken -forgotPasswordExpiry -emailVerificationToken -emailVerificationExpiry",
    );
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user: userData },
                "User fetched successfully",
            ),
        );
});

const verifyEmail = AsyncHandler(async (req, res) => {
	const { verificationToken } = req.params;
	console.log(verificationToken)
    if (!verificationToken) {
        throw new ApiError(400, "Email verification token is required");
    }
    const hashedVerificationToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");

    const user = await User.findOne({
        emailVerificationToken: hashedVerificationToken,
        emailVerificationExpiry: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(404, "Token is invalid or expired");
    }
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(
            200,
            { isEmailVerified: user.isEmailVerified },
            "Email verified successfully",
        ),
    );
});

const resendVerificationEmail = AsyncHandler(async (req, res) => {
    const email = req.user?.email;
    if (!email) {
        throw new ApiError(400, "Email is required to send verification email");
    }
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    if (user.isEmailVerified) {
        throw new ApiError(409, "Email is already verified");
    }
    const { hashToken, unHashToken, expiry } = user.generateTemporaryToken();
    user.emailVerificationToken = hashToken;
    user.emailVerificationExpiry = expiry;
    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: email,
        subject: "Please verify your email address",
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashToken}`,
        ),
    });
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Verification email sent"));
});

const refreshAccessToken = AsyncHandler(async (req, res) => {
    const requestedRefreshToken =
        req.cookies?.refreshToken ||
        req.body.refreshToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!requestedRefreshToken) {
        throw new ApiError(401, "Unauthorized access");
    }

    try {
        const decodedToken = jwt.verify(
            requestedRefreshToken,
            REFRESH_TOKEN_SECRET,
        );
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Unauthorized request or invalid credentials");
        }
        if (requestedRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or already used");
        }
        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        const sanitizedUser = await User.findById(user._id).select(
            "-password -refreshToken -isEmailVerified -forgotPasswordToken -forgotPasswordExpiry -emailVerificationToken -emailVerificationExpiry",
        );
        const cookieOptions = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", newRefreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: sanitizedUser,
                        accessToken,
                        refreshToken: newRefreshToken,
                    },
                    "Access token has been refreshed successfully",
                ),
            );
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(401, "Invalid refresh token");
    }
});

const forgotPasswordRequest = AsyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Prevent user enumeration by sending success response even if user doesn't exist
    if (user) {
        const { hashToken, unHashToken, expiry } = user.generateTemporaryToken();
        user.forgotPasswordToken = hashToken;
        user.forgotPasswordExpiry = expiry;
        await user.save({ validateBeforeSave: false });

        await sendEmail({
            email: user?.email,
            subject: "Password reset request",
            mailgenContent: forgotPasswordMailgenContent(
                user.username,
                `${FORGOT_PASSWORD_REDIRECT_URL}/${unHashToken}`,
            ),
        });
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "If that email address exists in our database, a password reset link has been sent.",
            ),
        );
});

const resetForgotPassword = AsyncHandler(async (req, res) => {
    const { resetPasswordToken } = req.params;
    const { newPassword } = req.body;
    const hashedPasswordToken = crypto
        .createHash("sha256")
        .update(resetPasswordToken)
        .digest("hex");

    const user = await User.findOne({
        forgotPasswordToken: hashedPasswordToken,
        forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(401, "Token is invalid or expired");
    }

    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password reset successfully"));
});

const changeCurrentPassword = AsyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password updated successfully"));
});

export {
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
};