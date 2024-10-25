const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { v4: uuidv4 } = require("uuid");
const sanitize = (title) => {
  return title.replace(/\s+/g, "_").replace(/[^\w.-]+/g, "");
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const publisherUserName = JSON.parse(req.headers.authorization).userName;
    const uploadPath = path.join(__dirname, "uploads", publisherUserName);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const title = req.body.title ? sanitize(req.body.title) : "default";
    const uniqueName = `${Date.now()}-${uuidv4()}`;
    cb(null, `${uniqueName}-${title}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

module.exports = upload;
