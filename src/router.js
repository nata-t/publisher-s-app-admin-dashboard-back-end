const express = require("express"),
  router = express.Router(),
  publisherManagement = require("./publisherManagment"),
  newsManagement = require("./newsManagement"),
  dashboard = require("./dashboard"),
  jwtMiddleware = require("../jwtMiddleware"),
  upload = require("../newsMulterMiddleware"),
  adminMiddleware = require("../adminMiddleware");

const uploadFields = upload.fields([{ name: "coverImage", maxCount: 1 }]);

router.get("/all-publishers", publisherManagement.allPublishers);
router.post(
  "/get-publisher-by-userName",
  publisherManagement.getPublisherByUserName
);
router.post(
  "/approve-publisher",
  adminMiddleware,
  publisherManagement.approvePublisher
);
router.post(
  "/suspend-publisher",
  adminMiddleware,
  publisherManagement.suspendPublisher
);
router.post(
  "/create-news",
  jwtMiddleware,
  uploadFields,
  newsManagement.createNews
);
router.post("/edit-news", jwtMiddleware, uploadFields, newsManagement.editNews);
router.get("/all-news", newsManagement.allNews);
router.post("/get-news-by-id", newsManagement.getNewsById);
router.get(
  "/get-news-by-publisher-userName",
  newsManagement.getNewsByPublisherUserName
);
router.post("/approve-news", adminMiddleware, newsManagement.approveNews);
router.post("/suspend-news", adminMiddleware, newsManagement.suspendNews);
router.post("/report-news", newsManagement.reportNews);
router.get("/dashboard-stats", adminMiddleware, dashboard.getDashboardStats);
router.post(
  "/get-publishers-table",
  adminMiddleware,
  dashboard.getPublishersTable
);

module.exports = router;
