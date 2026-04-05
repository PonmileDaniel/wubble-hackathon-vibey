import multer from "multer"
import dotenv from "dotenv"

dotenv.config();
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'image/jpeg', 'image/png'];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only MP3, WAV, JPEG, and PNG files are allowed!'), false);
    }
    
    cb(null, true);
  },
});



