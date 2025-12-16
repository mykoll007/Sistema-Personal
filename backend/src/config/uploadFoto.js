const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadFotoPath = path.join(__dirname, '../../uploads');

// cria a pasta se não existir
if (!fs.existsSync(uploadFotoPath)) {
    fs.mkdirSync(uploadFotoPath, { recursive: true });
}

const storageFoto = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadFotoPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const uploadFoto = multer({
    storage: storageFoto,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB (padrão bom pra foto)
    },
    fileFilter: (req, file, cb) => {
        const allowed = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (!allowed.includes(file.mimetype)) {
            return cb(new Error('Formato de imagem inválido'));
        }

        cb(null, true);
    }
});

module.exports = uploadFoto;
