const asyncWrapper = require("../middleware/asyncWrapper");
const Doctor = require('../models/doctor.model'); // Assurez-vous d'importer correctement le modèle Doctor
const User = require('../models/user.model');
const Rendezvous = require('../models/rendezvous.model');
const httpStatusText = require('../utils/httpStatusText');
const appError = require('../utils/appError');
const bcrypt = require('bcryptjs');

const getAllDoctors = asyncWrapper(async (req, res) => {
    // Récupérer tous les docteurs depuis la base de données en utilisant le modèle Doctor
    const doctors = await Doctor.find({}, { password: 0, __v: 0 }); // Exclure les champs password et __v

    res.json({ status: httpStatusText.SUCCESS, data: { doctors } });
});


const getAllUsers = asyncWrapper(async (req, res) => {
    // Get all users from DB using User Model
    const users = await User.find({}, { password: 0, __v: 0 }); // Exclude password and __v fields

    res.json({ status: httpStatusText.SUCCESS, data: { users } });
});


const getAllRDV = asyncWrapper(async (req, res) => {
  // Get all users from DB using User Model
  const RDV = await Rendezvous.find({}); // Exclude password and __v fields

  res.json({ status: httpStatusText.SUCCESS, data: { RDV } });
});

const deleteDoctor = asyncWrapper(async (req, res, next) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      const error = appError.create('Email and password are required', 400, httpStatusText.FAIL);
      return next(error);
    }
  
    try {
      const doctor = await Doctor.findOne({ email: email });
  
      if (!doctor) {
        const error = appError.create('Doctor not found', 404, httpStatusText.FAIL);
        return next(error);
      }
  
      const matchedPassword = await bcrypt.compare(password, doctor.password);
  
      if (!matchedPassword) {
        const error = appError.create('Incorrect password', 401, httpStatusText.FAIL);
        return next(error);
      }
  
      // Ensure that doctor.toObject() returns a Mongoose document
      const doctorDocument = doctor.toObject();
  
      await Doctor.deleteOne({ _id: doctorDocument._id });
      res.json({ status: httpStatusText.SUCCESS, message: 'Doctor deleted successfully', data: {} });
    } catch (error) {
      console.error('Error during doctor deletion:', error);
      const errorMessage = 'Error deleting doctor';
      const status = error.name === 'CastError' ? 400 : 500; // Handle invalid ID as Bad Request
      const appErrorInstance = appError.create(errorMessage, status, httpStatusText.FAIL);
      return next(appErrorInstance);
    }
  });
  

  const deleteUser = asyncWrapper(async (req, res, next) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      const error = appError.create('Email and password are required', 400, httpStatusText.FAIL);
      return next(error);
    }
  
    try {
      const user = await User.findOne({ email: email });
  
      if (!user) {
        const error = appError.create('User not found', 404, httpStatusText.FAIL);
        return next(error);
      }
  
      const matchedPassword = await bcrypt.compare(password, user.password);
  
      if (!matchedPassword) {
        const error = appError.create('Incorrect password', 401, httpStatusText.FAIL);
        return next(error);
      }
  
      // Ensure that user.toObject() returns a Mongoose document
      const userDocument = user.toObject();
      await User.deleteOne({ _id: userDocument._id });
      res.json({ status: httpStatusText.SUCCESS, message: 'User deleted successfully', data: {} });
    } catch (error) {
      console.error('Error during user deletion:', error);
      const errorMessage = 'Error deleting user';
      const status = error.name === 'CastError' ? 400 : 500; // Handle invalid ID as Bad Request
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
                    createdAt,
                    updatedAt
                }
            }
        });
    }
});


  
  
module.exports ={
    getAllDoctors,
    getAllUsers,
    getAllRDV,
    deleteDoctor,
    deleteUser,
    infoparID
}