/**
 * Legacy Database Connection
 * Use src/config/database.js for new implementations
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.log("[DB] MONGO_URI missing");
  process.exit(1);
}

export const dbConnection = mongoose.connect(MONGO_URI)
  .then(() => console.log("[DB] Connected successfully"))
  .catch((error) => {
    console.log("[DB] Connection error:", error.message);
    process.exit(1);
  });


  