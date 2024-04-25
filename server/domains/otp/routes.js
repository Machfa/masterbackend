const express = require("express");
const router = express.Router();
const otpController = require("./controller.js");

router.post("/", otpController.sendOTP);
router.post("/verify", otpController.verifyOTP);

module.exports = router;
