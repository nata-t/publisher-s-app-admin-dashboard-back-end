const { PrismaClient } = require("@prisma/client");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const upload = require("../../regMulterMiddleware");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const uploadFields = upload.fields([{ name: "profilePicture", maxCount: 1 }]);

const prisma = new PrismaClient();

// Update BASE_URL and UPLOADS_DIR for flexibility
const BASE_URL = "http://localhost:3000";
const UPLOADS_DIR = path.join(__dirname, "../../uploads");

// Convert file path to URL-friendly format
function convertToUrl(filePath) {
  if (!filePath) {
    return `${BASE_URL}/uploads/_placeholders/placeholder-1.jpg`;
  } else {
    return `${BASE_URL}${filePath.replace(UPLOADS_DIR, "/uploads")}`;
  }
}

exports.signUp = async (req, res) => {
  try {
    uploadFields(req, res, async (err) => {
      if (err) {
        cleanupFiles(req.files);
        return res.status(500).json({
          message: "Error uploading profile picture",
          status: "failed",
          data: null,
        });
      }

      const publisher = req.body;
      const errors = await validateSignUpData(publisher);

      if (errors.length > 0) {
        cleanupFiles(req.files);
        return res.status(400).json({
          message: "Invalid publisher data: " + errors.join(", "),
          status: "failed",
          data: null,
        });
      }

      const [
        existingPublisherUserName,
        existingPublisherEmail,
        existingPublisherPhone,
      ] = await Promise.all([
        prisma.publisher.findUnique({
          where: { userName: publisher.userName },
        }),
        prisma.publisher.findUnique({ where: { email: publisher.email } }),
        prisma.publisher.findUnique({ where: { phone: publisher.phone } }),
      ]);

      if (
        existingPublisherUserName ||
        existingPublisherEmail ||
        existingPublisherPhone
      ) {
        cleanupFiles(req.files);
        return res.status(409).json({
          message:
            "Publisher with this userName, email, or phone number already exists",
          status: "failed",
          data: null,
        });
      }

      const hashedPassword = await argon2.hash(publisher.password);
      const profilePicturePath = req.files.profilePicture
        ? `/uploads/${publisher.userName}/${path.basename(
            req.files.profilePicture[0].path
          )}`
        : null;

      const relativeProfilePicturePath = profilePicturePath
        ? profilePicturePath.replace(UPLOADS_DIR, "")
        : null;

      const newPublisher = await prisma.publisher.create({
        data: {
          email: publisher.email,
          password: hashedPassword,
          userName: publisher.userName,
          firstName: publisher.firstName,
          lastName: publisher.lastName,
          phone: publisher.phone,
          profilePicture: relativeProfilePicturePath,
        },
      });
      const responseProfilePictureUrl = convertToUrl(
        relativeProfilePicturePath
      );

      res.status(201).json({
        message: "Publisher created successfully",
        status: "success",
        data: {
          ...newPublisher,
          profilePicture: responseProfilePictureUrl,
        },
      });
    });
  } catch (error) {
    console.error("Sign-up error:", error);
    cleanupFiles(req.files);
    res.status(500).json({
      message: "Internal server error",
      status: "failed",
      data: null,
    });
  }
};

exports.signIn = async (req, res) => {
  try {
    const credentials = req.body;
    const errors = validateSignInData(credentials);

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Invalid credentials: " + errors.join(", "),
        status: "error",
        data: null,
      });
    }

    const publisher = await prisma.publisher.findUnique({
      where: { userName: credentials.userName },
    });

    if (!publisher) {
      return res.status(401).json({
        message: "Invalid userName or password",
        status: "error",
        data: null,
      });
    }

    const isValidPassword = await argon2.verify(
      publisher.password,
      credentials.password
    );

    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid userName or password",
        status: "error",
        data: null,
      });
    }

    const token = jwt.sign(
      { userId: publisher.id, email: publisher.email, role: publisher.role },
      process.env.JWT_SECRET
    );

    res.status(200).json({
      message: "Authentication successful",
      status: "success",
      data: {
        userName: publisher.userName,
        email: publisher.email,
        phone: publisher.phone,
        firstName: publisher.firstName,
        lastName: publisher.lastName,
        status: publisher.status,
        profilePicture: convertToUrl(publisher.profilePicture),
        token,
      },
    });
  } catch (error) {
    console.error("Sign-in error:", error);
    res.status(500).json({
      message: "Internal server error",
      status: "error",
      data: null,
    });
  }
};

function validateSignUpData(publisher) {
  const errors = [];

  if (
    !publisher.firstName ||
    typeof publisher.firstName !== "string" ||
    publisher.firstName.trim().length === 0
  ) {
    errors.push("First name must be a non-empty string");
  }

  if (
    !publisher.lastName ||
    typeof publisher.lastName !== "string" ||
    publisher.lastName.trim().length === 0
  ) {
    errors.push("Last name must be a non-empty string");
  }

  if (!publisher.email || !isValidEmail(publisher.email)) {
    errors.push("Email must be a valid email address");
  }

  if (
    !publisher.password ||
    typeof publisher.password !== "string" ||
    publisher.password.trim().length === 0
  ) {
    errors.push("Password must be a non-empty string");
  }
  if (
    !publisher.phone ||
    typeof publisher.phone !== "string" ||
    publisher.phone.trim().length === 0 ||
    !publisher.phone.startsWith("+251")
  ) {
    errors.push("phone number must be a valid phone number");
  }
  return errors;
}

function validateSignInData(credentials) {
  const errors = [];

  if (!credentials.userName) {
    errors.push("userName must be a non-empty string");
  }

  if (
    !credentials.password ||
    typeof credentials.password !== "string" ||
    credentials.password.trim().length === 0
  ) {
    errors.push("Password must be a non-empty string");
  }

  return errors;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function cleanupFiles(files) {
  if (!files) return;

  for (const key in files) {
    if (files[key]) {
      files[key].forEach((file) => {
        fs.unlink(file.path, (err) => {
          if (err) {
            console.error("Failed to delete file:", file.path, err);
          } else {
            console.log("Successfully deleted file:", file.path);
          }
        });
      });
    }
  }
}
