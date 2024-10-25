const express = require("express"),
  router = express.Router(),
  auth = require("./auth");

router.post("/signUp", auth.signUp);
router.post("/signIn", auth.signIn);

module.exports = router;
