const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('./cloudinary'); // seu cloudinary.js

// Storage para fotos
const storageFoto = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'personals_fotos',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, crop: "limit" }]
    }
});

const uploadFoto = multer({ storage: storageFoto });

// Storage para vídeos
const storageVideo = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'exercicios_videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'webm', 'ogg']
    }
});

const uploadVideo = multer({ storage: storageVideo });

module.exports = { uploadFoto, uploadVideo };
