const express = require("express"),
  router = express.Router(),
  publisherManagement = require("./publisherManagment"),
  newsManagement = require("./newsManagement"),
  jwtMiddleware = require("../jwtMiddleware"),
  upload = require("../newsMulterMiddleware");

const uploadFields = upload.fields([{ name: "coverImage", maxCount: 1 }]);

router.get("/all-publishers", publisherManagement.allPublishers);
router.get(
  "/get-publisher-by-userName",
  publisherManagement.getPublisherByUserName
);
router.post(
  "/approve-publisher",
  jwtMiddleware,
  publisherManagement.approvePublisher
);
router.post(
  "/suspend-publisher",
  jwtMiddleware,
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
router.get("/get-news-by-id", newsManagement.getNewsById);
router.get(
  "/get-news-by-publisher-userName",
  newsManagement.getNewsByPublisherUserName
);
router.post("/approve-news", jwtMiddleware, newsManagement.approveNews);
router.post("/suspend-news", jwtMiddleware, newsManagement.suspendNews);
router.post("/report-news", newsManagement.reportNews);

module.exports = router;
