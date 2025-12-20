
// Third-party imports
import express from "express";
import cors from "cors";
import configDotenv from "dotenv";

// Local imports - Utils
import "./src/utils/logger.js"; // Enable logging
import { handleRuntimeError, handleErrorCode } from "./src/utils/outError.js";
import { GlobalError } from "./src/utils/GlobalError.js";
import { URL_Error } from "./src/utils/URL_Catch.js";

// Local imports - Database & Routes
import { dbConnection } from "./DB/dbConnection.js";
import { bootstrap } from "./src/module/bootStrap.js";
// Load environment variables first
configDotenv.config();


// Initialize Express app
const app = express();
const port = process.env.PORT || 3000; // Use environment variable or default to 3000

// Middleware setup
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parse incoming URL-encoded data

// Serve static files
app.use("/uploads", express.static("src/uploads")); // Serve uploads folder
app.use("/arrayFiles", express.static("arrayFiles")); // Serve arrayFiles folder
app.use("/ShuffleFiles", express.static("ShuffleFiles")); // Serve ShuffleFiles folder

// Bootstrap routes
bootstrap(app); // Load the routes dynamically

// Error Handling Middleware
app.use(GlobalError); // Handle global errors

// Process-level error handling
process.on("uncaughtException", handleErrorCode); // Handle uncaught exceptions
process.on("unhandledRejection", handleRuntimeError); // Handle unhandled promise rejections

// Root route
app.get("/api", (req, res) => res.send(" Server is running!")); // Basic health check route

// Catch all undefined routes
app.use(URL_Error);

// Log server start and database connection
console.log("[SERVER] Server is starting...");

// Start the server
app.listen(port, "0.0.0.0", () => console.log(`[SERVER] Server listening on port ${port}!`));
