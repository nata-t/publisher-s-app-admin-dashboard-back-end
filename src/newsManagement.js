const { PrismaClient } = require("@prisma/client");
const upload = require("../newsMulterMiddleware");
const fs = require("fs");
const path = require("path");
const prisma = new PrismaClient();

const uploadFields = upload.fields([{ name: "coverImage", maxCount: 1 }]);
// Update BASE_URL and UPLOADS_DIR for flexibility
const BASE_URL = "http://localhost:3000";
const UPLOADS_DIR = path.join(__dirname, "../../uploads");

// Convert file path to URL-friendly format
function convertToUrl(filePath) {
  if (!filePath) {
    return null;
  } else {
    return `${BASE_URL}${filePath.replace(UPLOADS_DIR, "/uploads")}`;
  }
}

exports.allNews = async (req, res) => {
  try {
    const news = await prisma.news.findMany({
      include: {
        reports: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const allNews = news.map((news) => ({
      id: news.id,
      title: news.title,
      content: news.content,
      coverImage: convertToUrl(news.coverImage),
      publisherUserName: news.publisherUserName,
      status: news.status,
      createdAt: news.createdAt,
      updatedAt: news.updatedAt,
      reports: news.reports,
      publisher: news.publisher,
    }));
    res.status(200).json({
      message: "News retrieved successfully",
      status: "success",
      data: allNews,
    });
  } catch {
    res.status(500).json({
      message: "Internal server error",
      status: "failed",
      data: null,
    });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    if (!req.body.id) {
      return res.status(400).json({
        message: "News id is required",
        status: "failed",
        data: null,
      });
    }
    const news = await prisma.news.findUnique({
      where: { id: req.body.id },
      include: {
        reports: true,
      },
    });
    if (!news) {
      return res.status(404).json({
        message: "News not found",
        status: "failed",
        data: null,
      });
    }
    res.status(200).json({
      message: "News retrieved successfully",
      status: "success",
      data: {
        id: news.id,
        title: news.title,
        content: news.content,
        coverImage: convertToUrl(news.coverImage),
        publisherUserName: news.publisherUserName,
        status: news.status,
        createdAt: news.createdAt,
        updatedAt: news.updatedAt,
        reports: news.reports,
        publisher: news.publisher,
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

//get news by publisher userName
exports.getNewsByPublisherUserName = async (req, res) => {
  try {
    if (!req.body.userName) {
      return res.status(400).json({
        message: "publisher UserName is required",
        status: "failed",
        data: null,
      });
    }
    const news = await prisma.news.findMany({
      where: { publisherUserName: req.body.userName },
      include: {
        reports: true,
      },
    });
    if (!news) {
      return res.status(404).json({
        message: "News not found",
        status: "failed",
        data: null,
      });
    }
    const allNews = news.map((news) => ({
      id: news.id,
      title: news.title,
      content: news.content,
      coverImage: convertToUrl(news.coverImage),
      publisherUserName: news.publisherUserName,
      status: news.status,
      createdAt: news.createdAt,
      updatedAt: news.updatedAt,
      reports: news.reports,
    }));
    res.status(200).json({
      message: "News retrieved successfully",
      status: "success",
      data: allNews,
    });
  } catch {
    res.status(500).json({
      message: "Internal server error",
      status: "failed",
      data: null,
    });
  }
};

exports.createNews = async (req, res) => {
  try {
    const publisherUserName = JSON.parse(req.headers.authorization).userName;
    if (!publisherUserName) {
      cleanupFiles(req.files);
      return res.status(400).json({
        message: "Publisher UserName not found, sign in again",
        status: "failed",
        data: null,
      });
    }

    //chack if the publisher is approved
    const publisher = await prisma.publisher.findUnique({
      where: { userName: publisherUserName },
      include: {
        news: true,
      },
    });
    if (!publisher) {
      cleanupFiles(req.files);
      return res.status(404).json({
        message: "Publisher not found",
        status: "failed",
        data: null,
      });
    }
    if (publisher.status === "SUSPENDED") {
      cleanupFiles(req.files);
      return res.status(401).json({
        message: "Publisher is suspended",
        status: "failed",
        data: null,
      });
    }
    if (publisher.status === "PENDING") {
      cleanupFiles(req.files);
      return res.status(401).json({
        message: "Publisher is pending",
        status: "failed",
        data: null,
      });
    }

    const errors = validateNewsData(req.body);
    if (errors.length > 0) {
      cleanupFiles(req.files);
      return res.status(400).json({
        message: "Invalid news data: " + errors.join(", "),
        status: "failed",
        data: errors,
      });
    }

    const coverImageFile = req.files.coverImage
      ? req.files.coverImage[0]
      : null;
    const coverImagePath = coverImageFile
      ? `/uploads/${publisherUserName}/${path.basename(coverImageFile.path)}`
      : null;
    const news = await prisma.news.create({
      data: {
        title: req.body.title,
        content: req.body.content,
        coverImage: coverImagePath,
        publisherUserName: publisherUserName,
      },
    });

    res.status(201).json({
      message: "News created successfully",
      status: "success",
      data: {
        id: news.id,
        title: news.title,
        content: news.content,
        coverImage: convertToUrl(news.coverImage),
        publisherUserName: news.publisherUserName,
        status: news.status,
        createdAt: news.createdAt,
        updatedAt: news.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error creating news:", error);
    cleanupFiles(req.files);
    res.status(500).json({
      message: "Internal server error",
      status: "failed",
      data: null,
    });
  }
};

exports.editNews = async (req, res) => {
  try {
    const publisherUserName = JSON.parse(req.headers.authorization).userName;
    if (!publisherUserName) {
      cleanupFiles(req.files);
      return res.status(400).json({
        message: "Publisher UserName not found, sign in again",
        status: "failed",
        data: null,
      });
    }

    const publisher = await prisma.publisher.findUnique({
      where: { userName: publisherUserName },
      include: {
        news: true,
      },
    });
    if (!publisher) {
      cleanupFiles(req.files);
      return res.status(404).json({
        message: "Publisher not found",
        status: "failed",
        data: null,
      });
    }
    if (publisher.status === "SUSPENDED") {
      cleanupFiles(req.files);
      return res.status(401).json({
        message: "Publisher is suspended",
        status: "failed",
        data: null,
      });
    }
    if (publisher.status === "PENDING") {
      cleanupFiles(req.files);
      return res.status(401).json({
        message: "Publisher is pending",
        status: "failed",
        data: null,
      });
    }

    const newsId = parseInt(req.body.id, 10);

    if (!newsId) {
      cleanupFiles(req.files);
      return res.status(400).json({
        message: "News id is required",
        status: "failed",
        data: null,
      });
    }
    const errors = validateNewsData(req.body);
    if (errors.length > 0) {
      cleanupFiles(req.files);
      return res.status(400).json({
        message: "Invalid news data: " + errors.join(", "),
        status: "failed",
        data: errors,
      });
    }

    const existingNews = await prisma.news.findUnique({
      where: { id: newsId },
    });
    if (!existingNews) {
      cleanupFiles(req.files);
      return res.status(404).json({
        message: "News item not found",
        status: "failed",
        data: null,
      });
    }

    const coverImageFile = req.files?.coverImage
      ? req.files.coverImage[0]
      : null;
    const coverImagePath = coverImageFile
      ? `/uploads/${publisherUserName}/${path.basename(coverImageFile.path)}`
      : existingNews.coverImage;

    const updatedNews = await prisma.news.update({
      where: { id: newsId },
      data: {
        title: req.body.title || existingNews.title,
        content: req.body.content || existingNews.content,
        coverImage: coverImagePath,
        publisherUserName: publisherUserName,
      },
    });

    res.status(200).json({
      message: "News updated successfully",
      status: "success",
      data: {
        id: updatedNews.id,
        title: updatedNews.title,
        content: updatedNews.content,
        coverImage: convertToUrl(updatedNews.coverImage),
        publisherUserName: updatedNews.publisherUserName,
        status: updatedNews.status,
        createdAt: updatedNews.createdAt,
        updatedAt: updatedNews.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating news:", error);
    cleanupFiles(req.files);
    res.status(500).json({
      message: "Internal server error",
      status: "failed",
      data: null,
    });
  }
};

//approve a news
exports.approveNews = async (req, res) => {
  try {
    if (!req.body.id) {
      return res.status(400).json({
        message: "id is required",
        status: "failed",
        data: null,
      });
    }
    const news = await prisma.news.findUnique({
      where: { id: req.body.id },
      include: {
        reports: true,
      },
    });
    if (!news) {
      return res.status(404).json({
        message: "News not found",
        status: "failed",
        data: null,
      });
    }
    if (news.status === "APPROVED") {
      return res.status(409).json({
        message: "News already approved",
        status: "failed",
        data: null,
      });
    }
    await prisma.news.update({
      where: { id: req.body.id },
      data: { status: "APPROVED" },
    });
    res.status(200).json({
      message: "News approved successfully",
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

//suspend a news
exports.suspendNews = async (req, res) => {
  try {
    if (!req.body.id) {
      return res.status(400).json({
        message: "id is required",
        status: "failed",
        data: null,
      });
    }
    const news = await prisma.news.findUnique({
      where: { id: req.body.id },
      include: {
        reports: true,
      },
    });
    if (!news) {
      return res.status(404).json({
        message: "News not found",
        status: "failed",
        data: null,
      });
    }
    if (news.status === "SUSPENDED") {
      return res.status(409).json({
        message: "News already suspended",
        status: "failed",
        data: null,
      });
    }
    await prisma.news.update({
      where: { id: req.body.id },
      data: { status: "SUSPENDED" },
    });
    res.status(200).json({
      message: "News suspended successfully",
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

//report a news
exports.reportNews = async (req, res) => {
  try {
    if (!req.body.newsId) {
      return res.status(400).json({
        message: "id is required",
        status: "failed",
        data: null,
      });
    }
    if (!req.body.reason) {
      return res.status(400).json({
        message: "reason is required",
        status: "failed",
        data: null,
      });
    }
    const news = await prisma.news.findUnique({
      where: { id: req.body.newsId },
    });
    if (!news) {
      return res.status(404).json({
        message: "News not found",
        status: "failed",
        data: null,
      });
    }

    const report = await prisma.report.create({
      data: {
        newsId: req.body.newsId,
        reason: req.body.reason,
        description: req.body.description || "",
      },
    });

    res.status(201).json({
      message: "Report created successfully",
      status: "success",
      data: {
        id: report.id,
        newsId: report.newsId,
        reason: report.reason,
        description: report.description,
        news: news,
      },
    });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({
      message: "Internal server error",
      status: "failed",
      data: null,
    });
  }
};

//validate news data
function validateNewsData(news) {
  const errors = [];

  if (
    !news.title ||
    typeof news.title !== "string" ||
    news.title.trim().length === 0
  ) {
    errors.push("Title must be a non-empty string");
  }

  if (
    !news.content ||
    typeof news.content !== "string" ||
    news.content.trim().length === 0
  ) {
    errors.push("Content must be a non-empty string");
  }

  return errors;
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
