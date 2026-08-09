import { Schema, model } from "mongoose";

const projectSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            createdBy: { // reference to the user who created the project
                type: Schema.Types.ObjectId,
                ref: "User",
            },
		},
    },
    {
        timestamps: true,
    },
);

export const Project = model("Project", projectSchema);
