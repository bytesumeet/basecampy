import { validationResult } from "express-validator";
import { ApiError } from "../utils/apiError.js";

export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const extractedErros = [];
    errors.array().map((error) => {
        extractedErros.push({
            type: error.type,
            value: error.value,
            msg: error.msg,
        });
    });
    throw new ApiError(422, "Recieved data is not vaild", extractedErros);
};
