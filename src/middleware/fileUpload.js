import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import slug from 'slug';

// Sets up multer for file uploads with custom destination, filter, and size
const fileMulter = (destination, filterType, maxFileSizeMB) => {
    console.log(`[MULTER_SETUP] Start: destination=${destination}`);
    const fileFilter = (req, file, cb) => {
        console.log(`[MULTER_SETUP] File received: ${file.originalname}, MIME type: ${file.mimetype}`);
        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination, { recursive: true });
            console.log(`[MULTER_SETUP] Folder created: ${destination}`);
        }
        if (filterType.some(type => file.mimetype.startsWith(type))) {
            console.log("[MULTER_SETUP] File accepted by filter");
            cb(null, true);
        } else {
            console.log("[MULTER_SETUP] File rejected by filter");
            cb(null, false);
        }
    };
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            console.log(`[MULTER_SETUP] Setting storage destination: ${destination}`);
            cb(null, destination);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const nameWithoutExt = path.basename(file.originalname, ext);
            const uniqueFilename = `${uuidv4()}-${slug(nameWithoutExt)}${ext}`;
            console.log(`[MULTER_SETUP] Generated filename: ${uniqueFilename}`);
            cb(null, uniqueFilename);
        }
    });
    console.log("[MULTER_SETUP] Multer configuration completed.");
    return multer({ 
        storage,
        fileFilter,
        limits: { fileSize: maxFileSizeMB * 1024 * 1024 }
    });
};

// Middleware for uploading a single file
export const uploadSingleFile = (fieldName, destination, filterType) => {
    console.log(`[UPLOAD_SINGLE_FILE] Start: field=${fieldName}`);
    return fileMulter(destination, filterType, 5).single(fieldName);
};

// Middleware for uploading multiple files
export const uploadMixFile = (fieldName, destination, filterType, maxFileSizeMB, maxCount) => {
    console.log(`[UPLOAD_MIX_FILE] Start: field=${fieldName}, maxCount=${maxCount}`);
    return fileMulter(destination, filterType, maxFileSizeMB).array(fieldName, maxCount);
};

// Middleware for uploading multiple fields with multiple files
export const uploadMixOfFile = (arrayOfFields, destination, filterType, maxFileSizeMB) => {
    console.log("[UPLOAD_MIX_OF_FILE] Start: multiple fields");
    return fileMulter(destination, filterType, maxFileSizeMB).fields(arrayOfFields);
};
