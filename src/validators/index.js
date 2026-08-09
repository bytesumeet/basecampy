import { body } from "express-validator";

export const userRegistrationValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
        body("username")
            .trim()
            .notEmpty()
            .withMessage("Username is required")
            .isLength({ min: 4 })
            .withMessage("Username must be at least 4 characters long")
            .isLowercase()
            .withMessage("Username should be in lowercase"),
        body("password")
            .notEmpty()
            .withMessage("Password is required")
            .isStrongPassword({
                minLength: 8,
                minLowercase: 1,
                minNumbers: 1,
                minSymbols: 1,
                minUppercase: 1,
            })
            .withMessage(
                "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character",
            ),
        body("fullName").optional().trim(),
    ];
};

export const userLoginValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
        body("password")
            .notEmpty()
            .withMessage("Password is required")
            .isLength({ min: 8 }),
    ];
};

export const userChangeCurrentPasswordValidator = () => {
    return [
        body("oldPassword")
            .notEmpty()
            .withMessage("Old password is required")
            .isLength({ min: 8 }),
        body("newPassword")
            .notEmpty()
            .withMessage("New password is required")
            .isStrongPassword({
                minLength: 8,
                minLowercase: 1,
                minNumbers: 1,
                minSymbols: 1,
                minUppercase: 1,
            })
            .withMessage(
                "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character",
            ),
    ];
};

export const userForgotPasswordValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
    ];
};

export const userResetForgotPasswordValidator = () => {
    return [
        body("newPassword")
            .notEmpty()
            .withMessage("Password is required")
            .isStrongPassword({
                minLength: 8,
                minLowercase: 1,
                minNumbers: 1,
                minSymbols: 1,
                minUppercase: 1,
            })
            .withMessage(
                "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character",
            ),
    ];
};