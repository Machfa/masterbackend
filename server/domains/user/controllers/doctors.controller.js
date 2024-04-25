const asyncWrapper = require("../middleware/asyncWrapper");
const Doctor = require('../models/doctor.model');
const Rendezvous = require('../models/rendezvous.model');
const httpStatusText = require('../utils/httpStatusText');
const appError = require('../utils/appError');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateJWT = require("../utils/generateJWT");

const loginDoctor = asyncWrapper(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        const error = appError.create('Email and password are required', 400, httpStatusText.FAIL);
        return next(error);
    }

    const doctor = await Doctor.findOne({ email: email });

    if (!doctor) {
        const error = appError.create('Doctor not found', 404, httpStatusText.FAIL);
        return next(error);
    }

    const matchedPassword = await bcrypt.compare(password, doctor.password);

    if (matchedPassword) {
        const token = await generateJWT({email: doctor.email, id: doctor._id, role: doctor.role});
        doctor.token = token;

        await doctor.save();
    
        return res.json({ status: httpStatusText.SUCCESS, data: {doctor} });
    } else {
        const error = appError.create('Incorrect password', 401, httpStatusText.FAIL);
        return next(error);
    }
});

const registerDoctor = asyncWrapper(async (req, res, next) => {
    const { firstName, lastName, phoneNumber, email, password, role, address, specialization, experience, timings } = req.body;

    const oldDoctor = await Doctor.findOne({ email: email });

    if (oldDoctor) {
        const error = appError.create('Doctor already exists', 400, httpStatusText.FAIL);
        return next(error);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let avatar;
  if (req.file) {
    avatar = req.file.filename;
  } else {
    avatar = "../uploads/profile1.png"; // Default avatar if not provided
  }
    const newDoctor = new Doctor({
        firstName,
        lastName,
        phoneNumber,
        email,
        password: hashedPassword,
        role,
        address,
        specialization,
        experience,
        timings,
        avatar:avatar
    });
    // generate JWT token 
    const token = await generateJWT({email: newDoctor.email, id: newDoctor._id, role: newDoctor.role});
    newDoctor.token = token;

    await newDoctor.save();

    res.status(201).json({ status: httpStatusText.SUCCESS, data: { doctor: newDoctor } });
});

const forgotpassword = asyncWrapper(async (req, res, next) => {
    const { email, newpassword } = req.body;

    if (!email) {
        const error = appError.create('Email is required', 400, httpStatusText.FAIL);
        return next(error);
    }

    const doctor = await Doctor.findOne({ email: email });

    if (!doctor) {
        const error = appError.create('Doctor not found', 404, httpStatusText.FAIL);
        return next(error);
    }

    const hashedPassword = await bcrypt.hash(newpassword, 10);
    doctor.password = hashedPassword;

    await doctor.save();

    res.json({ status: httpStatusText.SUCCESS, data: {} });
});


const getAllRendezvousWithMypatient = asyncWrapper(async (req, res, next) => {
    try {
      const doctorId = req.body.doctorId;
  
      // Fetch all doctors with their rendezvous for a specific doctorId
      const MyRendezvouspatient = await Rendezvous.find({ doctorId: doctorId });
      //.select('userId date status time'); ;
  
      res.json({ status: httpStatusText.SUCCESS, data: {MyRendezvouspatient} });
    } catch (error) {
      console.error('Error while fetching doctors with rendezvous:', error);
  
      const errorMessage = 'Error fetching doctors with rendezvous';
      const status = 500; // Internal Server Error
      const appErrorInstance = appError.create(errorMessage, status, httpStatusText.FAIL);
      return next(appErrorInstance);
    }
  });

  const StatusRDV = async (req, res, next) => {
    try {
        const { _id, status } = req.body; // Corrected the variable name from _Id to _id
        const RDV = await Rendezvous.findByIdAndUpdate(
            _id,
            { status },
            { new: true } // Added this option to return the updated document
        );

        if (!RDV) {
            const error = appError.create('Rendezvous not found', 404, httpStatusText.FAIL);
            return next(error);
        }

        res.json({ status: httpStatusText.SUCCESS, data: {} });
    } catch (error) {
        console.error('Error updating status:', error);

        const errorMessage = 'Error updating status';
        const status = 500; // Internal Server Error
        const appErrorInstance = appError.create(errorMessage, status, httpStatusText.FAIL);
        return next(appErrorInstance);
    }
};

const SearchRDVdujour = async (req, res, next) => {
    try {
        const { doctorId, date } = req.body;
        
        // Utilisez find à la place de findOne pour obtenir un tableau de résultats
        const RDV = await Rendezvous.find({ doctorId:doctorId
            , date:date });

        // Vérifiez si la longueur du tableau RDV est zéro
        if (RDV.length === 0) {
            const error = appError.create('La liste pour ce jour-là n\'existe pas', 404, httpStatusText.FAIL);
            return next(error);
        }

        res.json({ status: httpStatusText.SUCCESS, data: { RDV } });
    } catch (error) {
        console.error('Error searching rendezvous:', error);

        const errorMessage = 'Error searching rendezvous';
        const status = 500; // Internal Server Error
        const appErrorInstance = appError.create(errorMessage, status, httpStatusText.FAIL);
        return next(appErrorInstance);
    }
};

const userInfoaboutAppoinment = asyncWrapper(async (req, res, next) => {
    try {
        const _id = req.body._id;

        // Fetch the rendezvous document for the given _id
        const rendezvous = await Rendezvous.findOne({ _id });

        if (!rendezvous) {
            const error = appError.create('Rendezvous not found', 404, httpStatusText.FAIL);
            return next(error);
        }

        // Update userInfo properties if they exist in the request body
        if (req.body.userInfo) {
            if (req.body.userInfo.diagnoses) {
                rendezvous.userInfo.diagnoses = req.body.userInfo.diagnoses;
            }
            if (req.body.userInfo.prescription) {
                rendezvous.userInfo.prescription = req.body.userInfo.prescription;
            }
            if (req.body.userInfo.examinationResult) {
                rendezvous.userInfo.examinationResult = req.body.userInfo.examinationResult;
            }
        }

        // Update medical reports if they exist in the request files
        if (req.files) {
            if (req.files['medicalReport']) {
                rendezvous.medicalReport = req.files['medicalReport'][0].filename;
            }
            if (req.files['ECGReport']) {
                rendezvous.ECGReport = req.files['ECGReport'][0].filename;
            }
            if (req.files['IRMReport']) {
                rendezvous.IRMReport = req.files['IRMReport'][0].filename;
            }
            if (req.files['Bloodtest']) {
                rendezvous.Bloodtest = req.files['Bloodtest'][0].filename;
            }
        }

        // Save the updated rendezvous document
        await rendezvous.save();

        res.json({ status: httpStatusText.SUCCESS, data: { rendezvous } });
    } catch (error) {
        console.error('Error while adding information to rendezvous:', error);

        const errorMessage = 'Error adding information to rendezvous';
        const status = 500; // Internal Server Error
        const appErrorInstance = appError.create(errorMessage, status, httpStatusText.FAIL);
        return next(appErrorInstance);
    }
});




module.exports = {
    registerDoctor,
    forgotpassword,
    loginDoctor,
    getAllRendezvousWithMypatient,
    StatusRDV,
    SearchRDVdujour,
    userInfoaboutAppoinment
};
