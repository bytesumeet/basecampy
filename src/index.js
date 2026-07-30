import dotenv from "dotenv/config";
import app from "./app.js";
import { PORT } from "./constants.js";
import connectToDatabase from "./db/dbConnection.js";

connectToDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is listening on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error(`Failed to connect with database Error: ${error}`);
    });
