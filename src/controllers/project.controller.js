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
                user: new mongoose.Types.ObjectId(req.user?._id)
            },
        },

        // STAGE 2: Join the corresponding Project document & count its total members
        {
            $lookup: {
                from: "projects",              // Collection name in MongoDB (pluralized)
                localField: "project",         // Field in ProjectMember holding the project ID
                foreignField: "_id",           // Target field in the 'projects' collection
                as: "project",                 // Output field name (initially an array)

                // Sub-pipeline running directly inside the joined Project document
                pipeline: [
                    // Sub-Stage A: Find ALL member records belonging to this project
                    {
                        $lookup: {
                            from: "projectmembers",   // Join with projectmembers collection
                            localField: "_id",        // Project ID
                            foreignField: "project",  // Matching project ID in projectmembers
                            as: "projectmembers",    // Store matched array of member records
                        },
                    },
                    // Sub-Stage B: Count total array elements and add it as 'members' field
                    {
                        $addFields: {
                            members: { $size: "$projectmembers" }
                        },
                    },
                ],
            },
        },

        // STAGE 3: Convert 'project' from a single-element array `[{...}]` into an object `{...}`
        {
            $unwind: "$project"
        },

        // STAGE 4: Whitelist and reshape final JSON output fields
        {
            $project: {
                project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    members: 1,      // Computed total member count
                    createdAt: 1,
                    createdBy: 1,
                },
                role: 1,             // User's project role (from root ProjectMember doc)
                _id: 0,              // Suppress outer ProjectMember document _id
            },
        },
    ]);

    // 3. Return HTTP 200 with standardized JSON response wrapper
    return res
        .status(200)
        .json(new ApiResponse(200, projects[0], "Projects fetched successfully"));
});
const getProjectById = AsyncHandler(async (req, res) => {});
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
