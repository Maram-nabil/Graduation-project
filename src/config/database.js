/**
 * Database Connection Module
 * Handles MongoDB connection with retry logic
 */
import mongoose from 'mongoose';
import { config } from './index.js';

let isConnected = false;

export async function connectDatabase() {
  if (isConnected) {
    console.log('[DB] Using existing connection');
    return;
  }

  if (!config.mongoUri) {
    console.error('[DB] MONGO_URI is missing');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    isConnected = true;
    console.log(`[DB] Connected to MongoDB: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('[DB] Connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('[DB] Disconnected from MongoDB');
      isConnected = false;
    });
    
  } catch (error) {
    console.error('[DB] Connection failed:', error.message);
    process.exit(1);
  }
}

export async function disconnectDatabase() {
  if (!isConnected) return;
  
  await mongoose.connection.close();
  isConnected = false;
  console.log('[DB] Connection closed');
}
