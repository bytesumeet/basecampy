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

export default app;
