import { Schema, model } from "mongoose";
import { AVAILABLE_TASK_STATUSES, TASK_STATUS_ENUM } from "../constants.js";

const subTaskSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        task: {
            type: Schema.Types.ObjectId,
            ref: "Task",
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: AVAILABLE_TASK_STATUSES,
            default: TASK_STATUS_ENUM.TODO,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

export const SubTask = model("SubTask", subTaskSchema);
