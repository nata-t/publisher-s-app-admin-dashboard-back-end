const express = require("express"),
  router = express.Router(),
  publisherManagement = require("./publisherManagment"),
  newsManagement = require("./newsManagement"),
  upload = require("../newsMulterMiddleware");

const uploadFields = upload.fields([{ name: "coverImage", maxCount: 1 }]);

router.get("/all-publishers", publisherManagement.allPublishers);
router.get(
  "/get-publisher-by-userName",
  publisherManagement.getPublisherByUserName
);
router.post("/approve-publisher", publisherManagement.approvePublisher);
router.post("/suspend-publisher", publisherManagement.suspendPublisher);
router.post("/create-news", uploadFields, newsManagement.createNews);
router.get("/all-news", newsManagement.allNews);
router.get("/get-news-by-id", newsManagement.getNewsById);
router.get(
  "/get-news-by-publisher-userName",
  newsManagement.getNewsByPublisherUserName
);
router.post("/approve-news", newsManagement.approveNews);
router.post("/suspend-news", newsManagement.suspendNews);

module.exports = router;
