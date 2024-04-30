const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { ADMIN } = require("../utils/userRoles"); // Assuming you have user roles defined

// Routes for Doctor model
router.route("/users").get(adminController.getAllUsers);
router.route("/doctors").get(adminController.getAllDoctors);
router.route("/allrendezvous").get(adminController.getAllRDV);
router.route("/deleteuser").delete(adminController.deleteUser);
router.route("/deletedoctor").delete(adminController.deleteDoctor);
router.route("/infoparID").post(adminController.infoparID);
module.exports = router;

