import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename with original extension
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// File filter - only allow images
const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Upload single image
router.post(
  '/',
  authMiddleware,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    upload.single('image')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ApiError('File too large. Maximum size is 10MB.', 400));
        }
        return next(new ApiError(err.message, 400));
      } else if (err) {
        return next(new ApiError(err.message, 400));
      }
      next();
    });
  },
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new ApiError('No image file provided', 400);
      }

      // Construct the URL for the uploaded file
      const imageUrl = `/uploads/${req.file.filename}`;

      res.status(201).json({
        success: true,
        image_url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete an uploaded image (only by the uploader or for cleanup)
router.delete('/:filename', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      throw new ApiError('Invalid filename', 400);
    }

    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new ApiError('File not found', 404);
    }

    fs.unlinkSync(filePath);

    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
