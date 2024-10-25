const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");

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

//get all publishers

exports.allPublishers = async (req, res) => {
  try {
    const publishers = await prisma.publisher.findMany({
      include: {
        news: true,
      },
    });

    const allPublishers = publishers.map((publisher) => ({
      UserName: publisher.userName,
      fristName: publisher.firstName,
      lastName: publisher.lastName,
      email: publisher.email,
      phone: publisher.phone,
      profilePicture: convertToUrl(publisher.profilePicture),
      status: publisher.status,
      news: publisher.news,
    }));
    res.status(200).json({
      message: "Publishers retrieved successfully",
      status: "success",
      data: allPublishers,
    });
  } catch {
    res.status(500).json({
      message: "Internal server error",
      status: "failed",
      data: null,
    });
  }
};

//get publisher by userName
exports.getPublisherByUserName = async (req, res) => {
  try {
    if (!req.body.userName) {
      return res.status(400).json({
        message: "userName is required",
        status: "failed",
        data: null,
      });
    }
    const publisher = await prisma.publisher.findUnique({
      where: { userName: req.body.userName },
      include: {
        news: true,
      },
    });
    if (!publisher) {
      return res.status(404).json({
        message: "Publisher not found",
        status: "failed",
        data: null,
      });
    }
    res.status(200).json({
      message: "Publishers retrieved successfully",
      status: "success",
      data: {
        userName: publisher.userName,
        fristName: publisher.firstName,
        lastName: publisher.lastName,
        email: publisher.email,
        phone: publisher.phone,
        profilePicture: convertToUrl(publisher.profilePicture),
        status: publisher.status,
        news: publisher.news,
      },
    });
  } catch {
    res.status(500).json({
      message: "Internal server error",
      status: "failed",
      data: null,
    });
  }
};

//approve a publisher
exports.approvePublisher = async (req, res) => {
  try {
    if (!req.body.userName) {
      return res.status(400).json({
        message: "userName is required",
        status: "failed",
        data: null,
      });
    }
    const publisher = await prisma.publisher.findUnique({
      where: { userName: req.body.userName },
      include: {
        news: true,
      },
    });
    if (!publisher) {
      return res.status(404).json({
        message: "Publisher not found",
        status: "failed",
        data: null,
      });
    }
    if (publisher.status === "APPROVED") {
      return res.status(409).json({
        message: "Publisher already approved",
        status: "failed",
        data: null,
      });
    }
    await prisma.publisher.update({
      where: { userName: req.body.userName },
      data: { status: "APPROVED" },
    });
    res.status(200).json({
      message: "Publisher approved successfully",
      status: "success",
      data: null,
    });
  } catch {
    res.status(500).json({
      message: "Internal server error",
      status: "failed",
      data: null,
    });
  }
};

//suspend a publisher
exports.suspendPublisher = async (req, res) => {
  try {
    if (!req.body.userName) {
      return res.status(400).json({
        message: "userName is required",
        status: "failed",
        data: null,
      });
    }
    const publisher = await prisma.publisher.findUnique({
      where: { userName: req.body.userName },
      include: {
        news: true,
      },
    });
    if (!publisher) {
      return res.status(404).json({
        message: "Publisher not found",
        status: "failed",
        data: null,
      });
    }
    if (publisher.status === "SUSPENDED") {
      return res.status(409).json({
        message: "Publisher already suspended",
        status: "failed",
        data: null,
      });
    }
    await prisma.publisher.update({
      where: { userName: req.body.userName },
      data: { status: "SUSPENDED" },
    });
    res.status(200).json({
      message: "Publisher suspended successfully",
      status: "success",
      data: null,
    });
  } catch {
    res.status(500).json({
      message: "Internal server error",
      status: "failed",
      data: null,
    });
  }
};
