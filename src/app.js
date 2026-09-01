import e from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { CORS_ORIGIN } from "./constants.js";
const app = e();

app.use(
    e.json({
        limit: "16kb",
    }),
);
app.use(
    e.urlencoded({
        extended: true,
        limit: "16kb",
    }),
);
app.use(e.static("public"));
app.use(
    cors({
        origin: CORS_ORIGIN,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
	}),
);

app.use(cookieParser());

import healthCheckRouter from "./routes/healthcheck.route.js";
import { userRouter } from "./routes/user.route.js";
import { projectRouter } from "./routes/project.route.js";

app.use("/api/v1/health-check", healthCheckRouter);
app.use("/api/v1/users/auth", userRouter);
app.use("/api/v1/projects", projectRouter);

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    return res.status(statusCode).json({
        statusCode,
        success: false,
        message,
        errors: err.errors || [],
        data: err.data || null,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
});

export default app;
