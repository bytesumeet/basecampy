import { Schema, model } from "mongoose";
import { AVAILABLE_TASK_STATUSES, TASK_STATUS_ENUM } from "../constants.js";

const taskSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        assignedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: AVAILABLE_TASK_STATUSES,
            default: TASK_STATUS_ENUM.TODO,
        },
        attachment: {
            type: [
                {
                    url: String,
                    mimeType: String,
                    size: Number,
                },
            ],
            default: [],
        },
    },
    { timestamps: true },
);

export const Task = model("Task", taskSchema);
