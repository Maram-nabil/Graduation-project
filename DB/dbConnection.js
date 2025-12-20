import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// Check for Mongo URI
if (!MONGO_URI) {
  console.log("[DB_CONNECTION] Database connection failed: MONGO_URI is missing in environment variables");
  process.exit(1); // Exit the application if the URI is missing
}

// Connect to MongoDB
export const dbConnection = mongoose.connect(MONGO_URI)
  .then(() => console.log("[DB_CONNECTION] Database connected successfully!"))
  .catch((error) => {
    console.log("[DB_CONNECTION] Database connection error:", error.message);
    process.exit(1); // Exit the application if the connection fails
  });


  