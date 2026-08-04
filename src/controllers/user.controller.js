import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import {
    sendEmail,
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
} from "../utils/mail.js";

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

export { registerUser, loginUser, logoutUser };
