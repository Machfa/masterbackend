const express = require("express");
const router = express.Router();
const otpController = require("./controller.js");

router.post("/", otpController.sendOTP);
router.post("/verify", otpController.verifyOTP);
router.post("/BierdePayement", otpController.sendBierPayement);

module.exports = router;
