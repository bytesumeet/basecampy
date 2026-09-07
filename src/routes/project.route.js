import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateProjectPermissions } from "../middlewares/permission.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
    addMemberToProjectValidators,
    createProjectValidators,
} from "../validators/index.js";
import {
    createProject,
    updateProject,
    deleteProject,
    getProjects,
    deleteProjectMember,
    getProjectById,
    getProjectMembers,
    updateProjectMemberRole,
    addMemberToProject,
} from "../controllers/project.controller.js";
import { AVAILABLE_USER_ROLES, USER_ROLES_ENUM } from "../constants.js";

const projectRouter = Router();

projectRouter.use(verifyJWT);
projectRouter
    .route("/")
    .get(getProjects)
    .post(createProjectValidators(), validate, createProject);
projectRouter
    .route("/:projectId")
    .get(validateProjectPermissions(AVAILABLE_USER_ROLES), getProjectById)
    .delete(validateProjectPermissions([USER_ROLES_ENUM.ADMIN]), deleteProject)
    .put(
        validateProjectPermissions([
            USER_ROLES_ENUM.ADMIN,
            USER_ROLES_ENUM.PROJECT_ADMIN,
        ]),
        createProjectValidators(),
        validate,
        updateProject,
    );
projectRouter
    .route("/:projectId/members/:userId")
    .put(
        validateProjectPermissions([USER_ROLES_ENUM.ADMIN]),
        updateProjectMemberRole,
    )
    .delete(
        validateProjectPermissions([USER_ROLES_ENUM.ADMIN]),
        deleteProjectMember,
    );
projectRouter
    .route("/:projectId/members")
    .post(
        validateProjectPermissions([USER_ROLES_ENUM.ADMIN]),
        addMemberToProjectValidators(),
        validate,
        addMemberToProject,
    )
    .get(validateProjectPermissions(AVAILABLE_USER_ROLES), getProjectMembers);
export { projectRouter };
