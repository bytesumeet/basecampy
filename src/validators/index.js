import { body } from "express-validator";

export const userRegistrationVaildator = () => {
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
            .withMessage("Username must be atleast of 4 character long")
            .isLowercase()
            .withMessage("Username should be in lowercase"),
        body("password")
            .trim()
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
                "Password must have length of 8 with 1 uppercase, 1 lowercase, 1 number, 1 special character",
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
            .trim()
            .notEmpty()
            .withMessage("Password is required")
            .isLength({ min: 8 }),
    ];
};
