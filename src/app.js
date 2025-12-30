/**
 * Express Application Setup
 * Separated from server for better testing and modularity
 */
import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';

// Middleware
import { sanitizeInput, preventNoSQLInjection } from './middleware/sanitize.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Error handlers
import { GlobalError } from './utils/GlobalError.js';
import { URL_Error } from './utils/URL_Catch.js';

// Routes
import { bootstrap } from './module/bootStrap.js';

export function createApp() {
  const app = express();

  // Security & CORS
  app.use(cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token']
  }));

  // Rate limiting
  app.use(apiLimiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Input sanitization
  app.use(sanitizeInput);
  app.use(preventNoSQLInjection);

  // Static files
  app.use('/uploads', express.static('src/uploads'));
  app.use('/arrayFiles', express.static('arrayFiles'));
  app.use('/ShuffleFiles', express.static('ShuffleFiles'));

  // Health check endpoint (required for DigitalOcean)
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // API root
  app.get('/api', (req, res) => {
    res.json({ message: 'Server is running!', version: '1.0.0' });
  });

  // Mount routes
  bootstrap(app);

  // 404 handler
  app.use(URL_Error);

  // Global error handler
  app.use(GlobalError);

  return app;
}
