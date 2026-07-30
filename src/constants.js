const PORT = process.env.PORT || 8000;
const CORS_ORIGIN = process.env.CORS_ORIGIN?.split(",") || "*";
const USER_ROLES_ENUM = {
    ADMIN: "admin",
    PROJECT_ADMIN: "project_admin",
    MEMBER: "member",
};
const AVAILABLE_USER_ROLES = Object.values(USER_ROLES_ENUM);
const Task_Status_Enum = {
    TODO: "todo",
    IN_PROGRESS: "in_progress",
    DONE: "done",
};
const AVAILABLE_TASK_STATUSES = Object.values(Task_Status_Enum);

export {
    PORT,
    CORS_ORIGIN,
    USER_ROLES_ENUM,
    AVAILABLE_USER_ROLES,
    Task_Status_Enum,
    AVAILABLE_TASK_STATUSES,
};
