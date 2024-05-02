const asyncWrapper = require("../middleware/asyncWrapper");
const Doctor = require('../models/doctor.model');
const User = require("../models/user.model");
const Rendezvous = require('../models/rendezvous.model');
const httpStatusText = require('../utils/httpStatusText');
const appError = require('../utils/appError');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateJWT = require("../utils/generateJWT");
const moment = require('moment');


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
        const token = await generateJWT({ email: doctor.email, id: doctor._id, role: doctor.role });
        doctor.token = token;

        await doctor.save();

        // Set token in a cookie
        res.cookie('token', token, { httpOnly: true });

        // Extract doctor properties
        const {
            _id,
            firstName,
            lastName,
            phoneNumber,
            email,
            role,
            address,
            specialization,
            experience,
            timings,
            avatar,
            star,
            numberOfEvaluations,
            totalStars,
            createdAt,
            updatedAt
        } = doctor;

        return res.json({
            status: httpStatusText.SUCCESS,
            data: {
                doctor: {
                    _id,
                    firstName,
                    lastName,
                    phoneNumber,
                    email,
                    role,
                    address,
                    specialization,
                    experience,
                    timings,
                    avatar,
                    star,
                    numberOfEvaluations,
                    totalStars,
                    createdAt,
                    updatedAt,
                    token
                }
            }
        });
    } else {
        const error = appError.create('Incorrect password', 401, httpStatusText.FAIL);
        return next(error);
    }
});



const registerDoctor = asyncWrapper(async (req, res, next) => {
    try {
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

        // generate JWT token 
        const token = await generateJWT({ email, role });

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
            avatar,
            token // Include token directly in the new doctor object
        });

        // Save the new doctor to the database
        await newDoctor.save();

        // Omit password from the doctor object
        const { password: _, ...doctorData } = newDoctor.toObject();

        // Respond with success status and the new doctor data
        return res.json({
            status: httpStatusText.SUCCESS,
            data: {
                doctor: {
                    ...doctorData,
                    token // Include token in the response
                }
            }
        });
    } catch (error) {
        // Handle any errors that might occur during the registration process
        console.error("Error registering doctor:", error);
        const errorMessage = "Error registering doctor";
        const errorResponse = {
            status: httpStatusText.ERROR,
            message: errorMessage
        };
        return res.status(500).json(errorResponse);
    }
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
      MyRendezvouspatient.forEach((rendezvous) => {
        rendezvous.date = moment(rendezvous.date).format("DD-MM-YYYY");
        rendezvous.time = moment(rendezvous.time).format("HH:mm");
    });
      MyRendezvouspatient.sort((a, b) => new Date(a.time) - new Date(b.time));
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

        // Convertir la date en objet Moment.js
        const requestedDate = moment(date, "DD-MM-YYYY");

        // Requête pour rechercher les rendez-vous pour la date spécifiée
        const RDV = await Rendezvous.find({ doctorId, date: requestedDate.toDate() });

        // Vérifier si des rendez-vous ont été trouvés
        if (!RDV || RDV.length === 0) {
            const error = appError.create('La liste pour ce jour-là n\'existe pas', 404, httpStatusText.FAIL);
            return next(error);
        }

        // Formatter les dates dans le tableau RDV en utilisant Moment.js
        RDV.forEach((rendezvous) => {
            rendezvous.date = moment(rendezvous.date).format("DD-MM-YYYY");
            rendezvous.time = moment(rendezvous.time).format("HH:mm");
        });

        // Trier les rendez-vous par heure
        RDV.sort((a, b) => moment(a.time, "HH:mm").diff(moment(b.time, "HH:mm")));

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
const getAllPastAppointmentsWithPatient = asyncWrapper(async (req, res, next) => {
    try {
        const doctorId = req.body.doctorId;
        const userId = req.body.userId;

        // Get the current date
        const currentDate = moment().startOf('day');

        // Find all past appointments for the specified doctor and user
        const pastAppointments = await Rendezvous.find({
            doctorId,
            userId,
            date: { $lt: currentDate.toDate() }
        });

        if (!pastAppointments || pastAppointments.length === 0) {
            return res.json({
                status: httpStatusText.SUCCESS,
                message: 'No past appointments found for this user and doctor.'
            });
        }

        // Sort past appointments chronologically by date and time
        pastAppointments.sort((a, b) => {
            const dateComparison = moment(a.date, 'DD-MM-YYYY').diff(moment(b.date, 'DD-MM-YYYY'));
            if (dateComparison !== 0) {
                return dateComparison;
            }
            return moment(a.time, 'HH:mm').diff(moment(b.time, 'HH:mm'));
        });

        // Format the date and time for each appointment
        pastAppointments.forEach((appointment) => {
            appointment.date = moment(appointment.date, 'DD-MM-YYYY').format("YYYY-MM-DD");
            appointment.time = moment(appointment.time, 'HH:mm').format("HH:mm");
        });

        res.json({ status: httpStatusText.SUCCESS, data: { pastAppointments } });
    } catch (error) {
        console.error('Error while fetching past appointments:', error);

        const errorMessage = 'Error fetching past appointments';
        const status = 500; // Internal Server Error
        const appErrorInstance = appError.create(errorMessage, status, httpStatusText.FAIL);
        return next(appErrorInstance);
    }
});


const infoparID = asyncWrapper(async (req, res, next) => {
    const id = req.body._id;

    if (!id) {
        const error = appError.create('ID is required', 400, httpStatusText.FAIL);
        return next(error);
    }

    const doctor = await Doctor.findOne({ _id: id });
    const user = await User.findOne({ _id: id });

    if (!doctor && !user) {
        const error = appError.create('ID not found', 404, httpStatusText.FAIL);
        return next(error);
    }

    if (doctor) {
        const {
            _id,
            firstName,
            lastName,
            phoneNumber,
            email,
            role,
            address,
            specialization,
            experience,
            timings,
            avatar,
            star,
            numberOfEvaluations,
            totalStars,
            createdAt,
            updatedAt
        } = doctor;

        return res.json({
            status: httpStatusText.SUCCESS,
            data: {
                doctor: {
                    _id,
                    firstName,
                    lastName,
                    phoneNumber,
                    email,
                    role,
                    address,
                    specialization,
                    experience,
                    timings,
                    avatar,
                    star,
                    numberOfEvaluations,
                    totalStars,
                    createdAt,
                    updatedAt
                }
            }
        });
    }

    if (user) {
        // Extract user properties
        const {
            _id,
            firstName,
            lastName,
            email,
            role,
            avatar,
            createdAt,
            updatedAt
        } = user;

        return res.json({
            status: httpStatusText.SUCCESS,
            data: {
                user: {
                    _id,
                    firstName,
                    lastName,
                    email,
                    role,
                    avatar,
                    createdAt,
                    updatedAt
                }
            }
        });
    }
});


module.exports = {
    registerDoctor,
    forgotpassword,
    loginDoctor,
    getAllRendezvousWithMypatient,
    StatusRDV,
    SearchRDVdujour,
    userInfoaboutAppoinment,
    getAllPastAppointmentsWithPatient,
    infoparID
};
