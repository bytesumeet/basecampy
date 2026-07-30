const PORT = process.env.PORT;
const CORS_ORIGIN = process.env.CORS_ORIGIN?.split(",") || "*";
const USER_ROLES_ENUM = {
    ADMIN: "admin",
    PROJECT_ADMIN: "project_admin",
    MEMBER: "member",
};
const AVAILABLE_USER_ROLES = Object.values(USER_ROLES_ENUM);
const TASK_STATUS_ENUM = {
    TODO: "todo",
    IN_PROGRESS: "in_progress",
    DONE: "done",
};
const AVAILABLE_TASK_STATUSES = Object.values(TASK_STATUS_ENUM);
const MONGODB_URI = `${process.env.MONGODB_URI}/basecamp`;

export {
    PORT,
    CORS_ORIGIN,
    USER_ROLES_ENUM,
    AVAILABLE_USER_ROLES,
    TASK_STATUS_ENUM,
    AVAILABLE_TASK_STATUSES,
    MONGODB_URI,
};
