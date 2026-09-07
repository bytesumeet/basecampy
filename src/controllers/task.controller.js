import { AsyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { Task } from "../models/task.model.js";
import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectmember.model.js";
import { AVAILABLE_TASK_STATUSES, TASK_STATUS_ENUM } from "../constants.js";
import mongoose from "mongoose";

const createTask = AsyncHandler(async (req, res) => {
	const { title, description, assignedToUserId, projectId } = req.body;
	if (!title) {
		throw new ApiError(400, "Title is required");
	}
	const task = Task.create(
		{
			title: title,
			description: description,
			assignedBy: new mongoose.Types.ObjectId(req.user._id),
			assignedTo: new mongoose.Types.ObjectId(assignedToUserId),
			project: new mongoose.Types.ObjectId(projectId),
			status: TASK_STATUS_ENUM.TODO,
			attachment: uri
		}
	)
});
const getTasks = AsyncHandler(async (req, res) => {});
const getTaskById = AsyncHandler(async (req, res) => {});
const updateTask = AsyncHandler(async (req, res) => {});
const deleteTask = AsyncHandler(async (req, res) => {});

export { createTask, getTasks, getTaskById, updateTask, deleteTask };
