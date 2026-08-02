import e from "express";
import cors from "cors";
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

import healthCheckRouter from "./routes/healthcheck.route.js";
import { userRouter } from "./routes/user.route.js";

app.use("/api/v1/health-check", healthCheckRouter);
app.use("/api/v1/users/auth", userRouter);

export default app;
