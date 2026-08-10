import { Schema, model } from "mongoose";
import { USER_ROLES_ENUM, AVAILABLE_USER_ROLES } from "../constants.js";

const projectMemberSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
		},
		role: {
			type: String,
			enum: AVAILABLE_USER_ROLES,
			required: true,
			default: USER_ROLES_ENUM.MEMBER
        }
    },
    { timestamps: true },
);

export const ProjectMember = model("ProjectMember", projectMemberSchema);
