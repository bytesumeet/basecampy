import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectmember.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { USER_ROLES_ENUM, AVAILABLE_USER_ROLES } from "../constants.js";

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
const deleteProject = AsyncHandler(async (req, res) => {
    const projectId = req.params.projectId;
    const deletedProject = await Project.findByIdAndDelete(projectId);
    if (!deletedProject) {
        throw new ApiError(404, "Project not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Project deleted successfully"));
});
const getProjects = AsyncHandler(async (req, res) => {
    // 1. Start the aggregation pipeline query on the 'ProjectMember' collection
    const projects = await ProjectMember.aggregate([
        // STAGE 1: Filter documents matching the logged-in user's ID
        {
            $match: {
                user: new mongoose.Types.ObjectId(req.user?._id),
            },
        },

        // STAGE 2: Join the corresponding Project document & count its total members
        {
            $lookup: {
                from: "projects", // Collection name in MongoDB (pluralized)
                localField: "project", // Field in ProjectMember holding the project ID
                foreignField: "_id", // Target field in the 'projects' collection
                as: "project", // Output field name (initially an array)

                // Sub-pipeline running directly inside the joined Project document
                pipeline: [
                    // Sub-Stage A: Find ALL member records belonging to this project
                    {
                        $lookup: {
                            from: "projectmembers", // Join with projectmembers collection
                            localField: "_id", // Project ID
                            foreignField: "project", // Matching project ID in projectmembers
                            as: "projectmembers", // Store matched array of member records
                        },
                    },
                    // Sub-Stage B: Count total array elements and add it as 'members' field
                    {
                        $addFields: {
                            members: { $size: "$projectmembers" },
                        },
                    },
                ],
            },
        },

        // STAGE 3: Convert 'project' from a single-element array `[{...}]` into an object `{...}`
        {
            $unwind: "$project",
        },

        // STAGE 4: Whitelist and reshape final JSON output fields
        {
            $project: {
                project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    members: 1, // Computed total member count
                    createdAt: 1,
                    createdBy: 1,
                },
                role: 1, // User's project role (from root ProjectMember doc)
                _id: 0, // Suppress outer ProjectMember document _id
            },
        },
    ]);

    // 3. Return HTTP 200 with standardized JSON response wrapper
    return res
        .status(200)
        .json(
            new ApiResponse(200, projects[0], "Projects fetched successfully"),
        );
});
const getProjectById = AsyncHandler(async (req, res) => {
    const projectId = req.params.projectId;
    if (!projectId) {
        throw new ApiError(400, "Project ID is required");
    }
    console.log(projectId);
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, project, "Project fetched successfully"));
});
const addMemberToProject = AsyncHandler(async (req, res) => {
    const { email, role } = req.body;
    const projectId = req.params.projectId;
    if (!email || !role || !projectId) {
        throw new ApiError(400, "Missing required fields");
    }
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User does not exists");
    }
    if (!user.isEmailVerified) {
        throw new ApiError(403, "User email is not verified");
    }
    await ProjectMember.findByIdAndUpdate(
        {
            user: new mongoose.Types.ObjectId(user._id), // owner of project
            project: new mongoose.Types.ObjectId(projectId),
        },
        {
            user: new mongoose.Types.ObjectId(user._id),
            project: new mongoose.Types.ObjectId(projectId),
            role: role,
        },
        {
            new: true,
            upsert: true,
        },
    );
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                {},
                "Project member added successfully with given role",
            ),
        );
});
const getProjectMember = AsyncHandler(async (req, res) => {
    const projectId = req.params.projectId;
    if (!projectId) {
        throw new ApiError(400, "Project ID is required");
    }
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project does not exists");
    }
    const projectMembers = await ProjectMember.aggregate([
        {
            $match: {
                project: new mongoose.Types.ObjectId(projectId), // matching for all document having this project id
            },
        },
        {
            $lookup: {
                from: "users", // looking in users document
                localField: "user", // projectMember document have a user field with users id
                foreignField: "_id", // matching user id from project member document to user document _id
                as: "user",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                            email: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                users: {
                    $arrayElemAt: ["$user", 0],
                },
            },
        },
        {
            $project: {
                project: 1,
                user: 1,
                role: 1,
                createdAt: 1,
                updatedAt: 1,
                _id: 0,
            },
        },
    ]);
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                projectMembers,
                "Project members fetched successfully",
            ),
        );
});
const updateProjectMemberRole = AsyncHandler(async (req, res) => {
    const { newRole } = req.body;
    const { projectId, userId } = req.params;
    if (!AVAILABLE_USER_ROLES.includes(newRole)) {
        throw new ApiError(400, "Invalid Role");
    }
    if (!projectId) {
        throw new ApiError(400, "Project ID is required");
    }
    const projectMember = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(userId),
    });
    if (!projectMember) {
        throw new ApiError(
            404,
            "Project member not found with provided user id and project id",
        );
    }
    const projectMemberWithUpdatedRole = await ProjectMember.findByIdAndUpdate(
        projectMember._id,
        {
            role: newRole,
        },
        { new: true },
    );
    if (!projectMemberWithUpdatedRole) {
        throw new ApiError(404, "Project member not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, "Project member role updated successfully"));
});
const deleteProjectMember = AsyncHandler(async (req, res) => {
    const { projectId, userId } = req.params;
    if (!projectId || !userId) {
        throw new ApiError(400, "Project id and user id are required");
    }
    let projectMember = await ProjectMember.findOne({
        user: userId,
        project: projectId,
    });
    if (!projectMember) {
        throw new ApiError(404, "Project member doesn't exists");
    }
    projectMember = await ProjectMember.findByIdAndDelete(projectMember._id);
    if (!projectMember) {
        throw new ApiError(404, "Project member not found");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                projectMember,
                "Project member removed successfully",
            ),
        );
});

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
