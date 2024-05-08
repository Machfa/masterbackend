const express = require("express");
const router = express.Router();
const doctorsController = require("../controllers/doctors.controller");
const { DOCTOR } = require("../utils/userRoles"); // Assuming you have user roles defined
const multer = require('multer');
const appError = require('../utils/appError');

// Multer configuration for avatar
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads');
    },
    filename: function (req, file, cb) {
        const ext = file.mimetype.split('/')[1];
        const fileName = `../uploads/user-${Date.now()}.${ext}`;
        cb(null, fileName);
    }
});
const avatarFileFilter = (req, file, cb) => {
    const fileType = file.mimetype.split('/')[0];

    if (fileType === 'image') {
        // Allow only images
        cb(null, true);
    } else {
        cb(new appError.create('Avatar must be an image', 400), false);
    }
}
const avatarUploader = multer({
    storage: avatarStorage,
    fileFilter: avatarFileFilter
}).single('avatar');
// Multer configuration for medical report
const reportStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads');
    },
    filename: function (req, file, cb) {
        const ext = file.mimetype.split('/')[1];
        const fileName = `../uploads/report-${Date.now()}.${ext}`;
        cb(null, fileName);
    }
});
const reportFileFilter = (req, file, cb) => {
    const fileType = file.mimetype.split('/')[0];

    if (fileType === 'image' || fileType === 'application') {
        // Allow both images and pdf files
        cb(null, true);
    } else {
        cb(new appError.create('Medical report must be an image or a PDF', 400), false);
    }
}
// Configuration for the upload of medical reports
const reportUploader = multer({
    storage: reportStorage,
    fileFilter: reportFileFilter
});
const verifyToken = require('../middleware/verfiyToken');
router.route("/register").post(avatarUploader, doctorsController.registerDoctor);
router.route("/login").post(doctorsController.loginDoctor);
router.route("/forgotpassword").patch(verifyToken,doctorsController.forgotpassword);
router.route("/myrendezvouspatient").post(verifyToken,doctorsController.getAllRendezvousWithMypatient);
router.route("/statusRDV").patch(verifyToken,doctorsController.StatusRDV);
router.route("/RDVdujour").post(verifyToken,doctorsController.SearchRDVdujour);
router.route("/pastRDV").post(verifyToken,doctorsController.getAllPastAppointmentsWithPatient);
router.route("/infoparID").post(verifyToken,doctorsController.infoparID);
router.route("/infoappoinment").post(verifyToken,
    reportUploader.fields([
        { name: 'medicalReport', maxCount: 1 },
        { name: 'ECGReport', maxCount: 1 },
        { name: 'IRMReport', maxCount: 1 },
        { name: 'Bloodtest', maxCount: 1 }
    ]), 
    doctorsController.userInfoaboutAppoinment
);
router.route("/addComment").post(verifyToken,doctorsController.addComment);
router.route("/AffComment").post(verifyToken,doctorsController.getAllCommentsForDoctor);
router.route("/deleteComment").delete(verifyToken,doctorsController.deleteComment);
router.route("/stats").post(verifyToken,doctorsController.getDoctorStats);

module.exports = router;
