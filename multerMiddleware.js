const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = (folderName) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, "uploads", folderName);

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });

const getUploadMiddleware = (folderName) =>
  multer({ storage: storage(folderName) });

module.exports = getUploadMiddleware;
