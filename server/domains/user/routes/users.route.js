const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const appError = require('../utils/appError');
const { USER } = require('../utils/userRoles');
const multer  = require('multer');

const diskStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads');
        },
        filename: function(req, file, cb) {
            const ext = file.mimetype.split('/')[1];
            const fileName = `../uploads/user-${Date.now()}.${ext}`;
            cb(null, fileName);
        }
    })
    
    const fileFilter = (req, file, cb) => {
        const imageType = file.mimetype.split('/')[0];
        
        if(imageType === 'image') {
            return cb(null, true)
        } else {
            return cb(appError.create('file must be an image', 400), false)
        }
    }
    
    const upload = multer({ 
        storage: diskStorage,
        fileFilter
    });
    const verifyToken = require('../middleware/verfiyToken');
router.route('/register')
            .post(upload.single('avatar'),usersController.register);
router.route('/login')
            .post(usersController.login);
 router.route('/forgotpassword')
            .patch(verifyToken,usersController.forgotpassword);
router.route('/rendezvous')
            .post(verifyToken,usersController.rendezvous);
router.route('/mydoctorrendezvous')
            .post(verifyToken,usersController.getAllDoctorsRendezvous);
router.route('/deleterendezvous')
            .delete(verifyToken,usersController.deleteRDV);
router.route('/STSrendezvousUser')
            .patch(verifyToken,usersController.StatusRDVuser);
router.route("/searchdoctor")
            .post(verifyToken,usersController.searchDoctors);
router.route("/rendezvoushoursdisponible")
        .post(verifyToken,usersController.getAvailableTime);
router.route(verifyToken,"/evaluatedoctor")
        .patch(usersController.StarEvaluation);

module.exports = router;

