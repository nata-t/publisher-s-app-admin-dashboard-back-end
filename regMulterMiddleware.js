const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const publisherUserName = req.body.userName;
    const uploadPath = path.join(__dirname, "uploads", publisherUserName);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const userName = req.body.userName;
    cb(null, `${Date.now()}-${userName}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

module.exports = upload;
