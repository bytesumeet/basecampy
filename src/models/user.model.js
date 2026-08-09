import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
    ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRY,
} from "../constants.js";
import crypto from "crypto";

const userSchema = new Schema(
    {
        avatar: {
            type: {
                url: String,
                localPath: String,
            },
            default: {
                url: "https://placehold.co/200x200",
                localPath: "",
            },
        },
        username: {
            type: String,
            required: [true, "Username is required"],
            trim: true,
            unique: true,
            lowercase: true,
			minlength: [4, "Username must be at least 4 characters"],
            index: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            unique: true,
			lowercase: true,
            index: true
        },
        fullName: {
            type: String,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        refreshToken: {
            type: String,
        },
        forgotPasswordToken: {
            type: String,
        },
        forgotPasswordExpiry: {
            type: Date,
        },
        emailVerificationToken: {
            type: String,
        },
        emailVerificationExpiry: {
            type: Date,
        },
    },
    {
        timestamps: true,
    },
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            email: this.email,
        },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY },
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY },
    );
};

userSchema.methods.generateTemporaryToken = function () {
    const unHashedToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
        .createHash("sha256")
        .update(unHashedToken)
        .digest("hex");
    const tokenExpiry = Date.now() + 20 * 60 * 1000; // 20 minutes expiry

    return {
        hashToken: hashedToken,
        unHashToken: unHashedToken,
        expiry: tokenExpiry,
    };
};

export const User = model("User", userSchema);