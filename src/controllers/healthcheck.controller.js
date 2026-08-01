import { ApiResponse } from "../utils/apiResponse.js";
import { AsyncHandler } from "../utils/asyncHandler.js";

// const healthCheck = (req, res, next) => {
//     try {
//         res.status(200).json(
//             new ApiResponse(200, { message: "Server is running" }),
//         );
//     } catch (error) {
//         next(error);
//     }
// };

const healthCheck = AsyncHandler(async (req, res) => {
    res.status(200).json(
        new ApiResponse(200, { message: "Server is still running" }),
    );
});

export { healthCheck };
