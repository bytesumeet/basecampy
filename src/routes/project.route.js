import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
	createProject,
	updateProject,
	deleteProject,
	getProjects
} from "../controllers/project.controller.js"

const projectRouter = Router();

projectRouter.route("/").post(verifyJWT, createProject);
projectRouter.route("/").get(verifyJWT, getProjects);
projectRouter.route("/:projectId").put(verifyJWT, updateProject);
projectRouter.route("/:projectId").delete(verifyJWT, deleteProject);

export { projectRouter };