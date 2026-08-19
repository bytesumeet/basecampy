import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectmember.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { USER_ROLES_ENUM } from "../constants.js";

const createProject = AsyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (!name || !description) {
        throw new ApiError(400, "Name and description are required");
    }
    const project = await Project.create({
        name,
        description,
        createdBy: new mongoose.Types.ObjectId(req.user._id), // making as 100% mongoose object id
    });
    await ProjectMember.create({
        user: new mongoose.Types.ObjectId(req.user._id),
        project: new mongoose.Types.ObjectId(project._id),
        role: USER_ROLES_ENUM.ADMIN, // can create project, add member, update member role etc.
    });
    return res
        .status(201)
        .json(new ApiResponse(201, project, "Project created successfully"));
});
const updateProject = AsyncHandler(async (req, res) => {
    const projectId = req.params.projectId;
    const { name, description } = req.body;
    const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        { name, description },
        { new: true },
    );
    if (!updatedProject) {
        throw new ApiError(404, "Project not found");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedProject,
                "Project updated successfully",
            ),
        );
});
const getProjects = AsyncHandler(async (req, res) => {});
const getProjectById = AsyncHandler(async (req, res) => {});
const deleteProject = AsyncHandler(async (req, res) => {});
const addMemberToProject = AsyncHandler(async (req, res) => {});
const getProjectMember = AsyncHandler(async (req, res) => {});
const updateProjectMemberRole = AsyncHandler(async (req, res) => {});
const deleteProjectMember = AsyncHandler(async (req, res) => {});

export {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    addMemberToProject,
    getProjectMember,
    updateProjectMemberRole,
    deleteProjectMember,
};
