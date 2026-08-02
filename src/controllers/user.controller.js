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
    if (!username || !email || !password || !fullName) {
        throw new ApiError(400, "All credentials are required", []);
    }
    const existingUser = await User.findOne({
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
    user.save({ validateBeforeSave: false });
    await sendEmail({
        email: user?.email,
        subject: "Please verify your emailVerificationToken",
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashToken}`,
        ),
    });
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -isEmailVerified -forgotPasswordToken -forgotPasswordExpiry -emailVerificationToken -emailVerificationExpiry -avatar",
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
            "User registered successfully and verification has been sent on your email",
        ),
    );
});

export { registerUser };
