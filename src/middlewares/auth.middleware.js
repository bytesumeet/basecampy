import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { ACCESS_TOKEN_SECRET } from "../constants.js";

export const verifyJWT = AsyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        throw new ApiError(401, "Unauthorized request", []);
    }
    try {
        const decodedInfoFromToken = jwt.verify(token, ACCESS_TOKEN_SECRET);
        if (!decodedInfoFromToken) {
            throw new ApiError(401, "Invalid Token", []);
        }
        const user = await User.findById(decodedInfoFromToken?._id).select(
            "-password -refreshToken -isEmailVerified -forgotPasswordToken -forgotPasswordExpiry -emailVerificationToken -emailVerificationExpiry",
        );
        if (!user) {
            throw new ApiError(404, "Invalid request for access token", []);
        }
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(500, "Failed to verify token", []);
    }
});
