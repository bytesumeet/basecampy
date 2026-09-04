import mongoose from "mongoose";
import { ApiError } from "../utils/apiError.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { ProjectMember } from "../models/projectmember.model.js";

export const validateProjectPermissions = (roles = []) => {
    AsyncHandler(async (req, res, next) => {
        const { projectId } = req.params;
        const user = req.user;
        if (!projectId) {
            throw new ApiError(400, "Project id is missing");
        }
        const projectMember = await ProjectMember.findOne({
            project: new mongoose.Types.ObjectId(projectId),
            user: new mongoose.Types.ObjectId(user?._id),
        });
        if (!projectMember) {
            throw new ApiError(404, "No project found");
		}
		const givenRole = projectMember?.role;
		user.role = givenRole;
		if(!roles.includes(givenRole)){
			throw new ApiError(403, "You do not have permission to access this project");
		}
		next();
    });
};
