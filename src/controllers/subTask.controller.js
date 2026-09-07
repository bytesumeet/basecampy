import { AsyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { Task } from "../models/task.model.js";
import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectmember.model.js";
import { SubTask } from "../models/subtask.model.js";
import { AVAILABLE_TASK_STATUSES, TASK_STATUS_ENUM } from "../constants.js";
import mongoose from "mongoose";

const createSubTask = AsyncHandler(async (req, res) => {});
const getSubTasks = AsyncHandler(async (req, res) => {});
const updateSubTask = AsyncHandler(async (req, res) => {});
const deleteSubTask = AsyncHandler(async (req, res) => {});
// const getSubTaskById = AsyncHandler(async (req, res) => {});

export { createSubTask, getSubTasks, updateSubTask, deleteSubTask };
