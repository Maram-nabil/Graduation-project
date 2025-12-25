/**
 * Sanitize input to prevent XSS and injection attacks
 */

// Remove potentially dangerous characters
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
};

// Recursively sanitize object
const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const key of Object.keys(obj)) {
            // Skip MongoDB operators
            if (key.startsWith('$')) continue;
            sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
    }
    
    return obj;
};

/**
 * Middleware to sanitize request body, query, and params
 */
export const sanitizeInput = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    
    next();
};

/**
 * Prevent NoSQL injection by removing $ operators from user input
 */
export const preventNoSQLInjection = (req, res, next) => {
    const removeOperators = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        const cleaned = {};
        for (const key of Object.keys(obj)) {
            if (!key.startsWith('$')) {
                cleaned[key] = typeof obj[key] === 'object' 
                    ? removeOperators(obj[key]) 
                    : obj[key];
            }
        }
        return cleaned;
    };
    
    if (req.body) req.body = removeOperators(req.body);
    if (req.query) req.query = removeOperators(req.query);
    
    next();
};
