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

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            throw new ApiError(404, "User not found", []);
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
    const { username, email, password, fullName, role } = req.body;
    const existingUser = await User.findOnelogoutUser({
        $or: [{ username }, { email }],
    });
    if (existingUser) {
        throw new ApiError(
            409,
            "User with this username or email already exists",
            [],
        );
    }
    const user = await User.create({
        username,
        email,
        password,
        fullName,
        role,
        isEmailVerified: false,
    });
    const { hashToken, unHashToken, expiry } = user.generateTemporaryToken();
    user.emailVerificationToken = hashToken;
    user.emailVerificationExpiry = expiry;
    await user.save({ validateBeforeSave: false });
    await sendEmail({
        email: user?.email,
        subject: "Please verify your emailVerificationToken",
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashToken}`,
        ),
    });
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -isEmailVerified -forgotPasswordToken -forgotPasswordExpiry -emailVerificationToken -emailVerificationExpiry",
    );
    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while creating the user",
            [],
        );
    }
    return res.status(200).json(
        new ApiResponse(
            201,
            {
                user: createdUser,
            },
            "User registered successfully and verification email has been sent on your email",
        ),
    );
});

const loginUser = AsyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email && !password) {
        throw new ApiError(400, "Email and password are required", []);
    }
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found", []);
    }
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Incorrect password", []);
    }
    // const checkIsEmailVerified = user.isEmailVerified;
    // if (!checkIsEmailVerified) {
    // 	throw new ApiError(401, "Email is not verified", []);
    // }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id,
    );
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -isEmailVerified -forgobravetPasswordToken -forgotPasswordExpiry -emailVerificationToken -emailVerificationExpiry",
    );
    if (!loggedInUser) {
        throw new ApiError(
            500,
            "Something went wrong while creating the user",
            [],
        );
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
        throw new ApiError(401, "Unauthorized request", []);
    }
    const choosenUser = await User.findByIdAndUpdate(user._id, {
        $unset: {
            refreshToken: 1, // this completely remove the refresh token field from user document
        },
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
        throw new ApiError(401, "Unauthorized request", []);
    }
    const userData = await User.findById(user._id).select(
        "-password -refreshToken -isEmailVerified -forgobravetPasswordToken -forgotPasswordExpiry -emailVerificationToken -emailVerificationExpiry ",
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
    const { verificationToken } = req.params; // takes the verification token from the request parameters
    if (!verificationToken) {
        throw new ApiError(400, "Email verification token is required", []);
    }
    const hashVerifcationToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");
    const user = await User.findOne({
        emailVerificationToken: hashVerifcationToken,
        emailVerificationExpiry: {
            // should be grater than current time if the expiry is less than current time than it means token is expired
            $gt: Date.now(), // check if the expiry is greater than current time
        },
    });
    if (!user) {
        throw new ApiError(404, "Token is invalid or expired", []);
    }
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                isEmailVerified: user.isEmailVerified,
            },
            "Email verified successfully",
        ),
    );
});

const resendVerificatonEmail = AsyncHandler(async (req, res) => {
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
        subject: "Please verify your emailVerificationToken",
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashToken}`,
        ),
    });
    return res
        .status(200)
        .json(new ApiResponse(200, "Verification email sent"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    verifyEmail,
    resendVerificatonEmail,
};
