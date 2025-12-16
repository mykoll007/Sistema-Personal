const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadVideoPath = path.join(__dirname, '../../uploads/videos');

// cria a pasta se não existir
if (!fs.existsSync(uploadVideoPath)) {
    fs.mkdirSync(uploadVideoPath, { recursive: true });
}

const storageVideo = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadVideoPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const uploadVideo = multer({
    storage: storageVideo,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'video/mp4',
            'video/quicktime', // MOV
            'video/webm',
            'video/ogg'
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(
                new Error(`Formato de vídeo inválido (${file.mimetype})`)
            );
        }

        cb(null, true);
    }
});

module.exports = uploadVideo;
