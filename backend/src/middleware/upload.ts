/**
 * @file upload.ts
 * @description Multer storage configuration for parsing multipart/form-data image uploads and routing them to AWS S3 / Cloudflare R2.
 */

import multer from "multer";
import type { Request } from "express";

// Maximum file size: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif"
];

/**
 * Configure Multer to store uploaded files in memory.
 */
const storage = multer.memoryStorage();

/**
 * Validate uploaded file types.
 */
function imageFileFilter(
    req: Request,
    file: Express.Multer.File,
    callback: multer.FileFilterCallback
): void {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(new Error(
            "Invalid file type. Only PNG, JPEG, WebP, and GIF images are allowed."
        ));
    }
}

/**
 * Reusable middleware for image uploads.
 */
export const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1
    },
    fileFilter: imageFileFilter
});

/**
 * Middleware for uploading a single image.
 *
 * The frontend must send the file using the field name "image".
 */
export const uploadImage = upload.single("image");