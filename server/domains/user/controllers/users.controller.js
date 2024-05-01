const asyncWrapper = require("../middleware/asyncWrapper");
const User = require("../models/user.model");
const Doctor = require('../models/doctor.model');
const Comment = require('../models/comment.model');
const Rendezvous = require("../models/rendezvous.model");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const generateJWT = require("../utils/generateJWT");
const moment = require("moment");

const register = asyncWrapper(async (req, res, next) => {
  const { firstName, lastName, email,role, password,phoneNumber } = req.body;

  const oldUser = await User.findOne({ email: email });

  if (oldUser) {
    const error = appError.create(
      "user already exists",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  // Password hashing
  const hashedPassword = await bcrypt.hash(password, 10);
  let avatar;
  if (req.file) {
    avatar = req.file.filename;
  } else {
    avatar = "../uploads/profile1.png"; // Default avatar if not provided
  }
  // generate JWT token 
  const token = await generateJWT({email: newUser.email, id: newUser._id, role: newUser.role});
  const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      phoneNumber,
      avatar: avatar,
      token:token
  });
  res
    .status(201)
    .json({ status: httpStatusText.SUCCESS, data: { user: newUser } });
  
 // newUser.token = token;
  
  await newUser.save();

  
});

const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const error = appError.create(
      "Email and password are required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const user = await User.findOne({ email: email });

  if (!user) {
    const error = appError.create("User not found", 404, httpStatusText.FAIL);
    return next(error);
  }

  const matchedPassword = await bcrypt.compare(password, user.password);

  if (matchedPassword) {
    const token = await generateJWT({ email: user.email, id: user._id, role: user.role });
    user.token = token;

    await user.save();
      // Set token in a cookie
      res.cookie('token', token, { httpOnly: true });

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
          updatedAt,
          token
        }
      }
    });
  } else {
    const error = appError.create(
      "Incorrect password",
      401,
      httpStatusText.FAIL
    );
    return next(error);
  }
});


const forgotpassword = asyncWrapper(async (req, res, next) => {
  const { email, newpassword } = req.body;

  if (!email) {
    const error = appError.create(
      "email is required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const user = await User.findOne({ email: email });

  if (!user) {
    const error = appError.create("user not found", 400, httpStatusText.FAIL);
    return next(error);
  }

  const hashedPassword = await bcrypt.hash(newpassword, 10);
  user.password = hashedPassword;

  // Save the updated user with the new hashed password
  await user.save();

  res.json({ status: httpStatusText.SUCCESS, data: {} });
});

const StarEvaluation = asyncWrapper(async (req, res, next) => {
  const { newstar, _id } = req.body;

  try {
      // Use `findOne` instead of `find` to get a single document
      const doctor = await Doctor.findOne({ _id: _id });

      if (!doctor) {
          const error = appError.create("Doctor not found", 404, httpStatusText.FAIL);
          return next(error);
      }

      // Update the total stars and the number of evaluations
      doctor.totalStars = doctor.totalStars + newstar;
      doctor.numberOfEvaluations = doctor.numberOfEvaluations + 1;

      // Calculate the average star rating
      doctor.star = Math.min(5, doctor.totalStars / doctor.numberOfEvaluations);

      await doctor.save();

      res.json({ status: httpStatusText.SUCCESS, data: {} });
  } catch (error) {
      console.error("Error during star evaluation:", error);

      const errorMessage = "Error during star evaluation";
      const status = 500; // Internal Server Error
      const appErrorInstance = appError.create(errorMessage, status, httpStatusText.FAIL);
      return next(appErrorInstance);
  }
});

const searchDoctors = asyncWrapper(async (req, res, next) => {
    const { searchQuery } = req.body;
console.log(searchQuery);
    if (!searchQuery) {
        const error = appError.create('Search query parameter is required', 400, httpStatusText.FAIL);
        return next(error);
    }

    const searchRegex = new RegExp(searchQuery, 'i');

    const doctors = await Doctor.find({
        $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { specialization: searchRegex }
        ]
    });

    if (doctors.length === 0) {
        return res.json({ status: httpStatusText.SUCCESS, message: 'No doctors found with the provided search query' });
    } else {
        res.json({ status: httpStatusText.SUCCESS, data: { doctors } });
    }
});

// Remplacez la fonction rendezvous par bookAppointment
const rendezvous = async (req, res, next) => {
  try {
    const requestedDate = moment(req.body.date, "YYYY-MM-DD");
    const requestedTime = moment(req.body.time, "HH:mm");

    const doctorId = req.body.doctorId;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        status: "fail",
        message: "Doctor not found",
      });
    }

    const dayOfWeek = requestedDate.format("dddd");
    const matchingDay = doctor.timings.find((timing) => timing.day === dayOfWeek);

    if (!matchingDay) {
      return res.status(200).json({
        status: "fail",
        message: `Doctor is not available on ${dayOfWeek}. Please choose another day.`,
        availableDays: doctor.timings.map((timing) => timing.day),
      });
    }

    const matchingHours = matchingDay.hours.find((hour) => {
      const start = moment(hour.start, "HH:mm");
      const end = moment(hour.end, "HH:mm");
      return requestedTime.isBetween(start, end, null, "[]");
    });

    if (!matchingHours) {
      return res.status(200).json({
        status: "fail",
        message: "Doctor is not available at this time. Please choose another time.",
      });
    }

    const date = requestedDate.toDate();
    const fromTime = requestedTime.clone().subtract(44, "minutes").toDate();
    const toTime = requestedTime.clone().add(44, "minutes").toDate();

    // Vérifier si un rendez-vous existe déjà pour le même médecin et le même créneau horaire
    const existingAppointment = await Rendezvous.findOne({
      doctorId,
      date,
      $or: [
        {
          $and: [
            { time: { $gte: fromTime } },
            { time: { $lte: toTime } }
          ]
        },
        {
          $and: [
            { time: { $lte: fromTime } },
            { time: { $gte: toTime } }
          ]
        }
      ]
    });

    if (existingAppointment) {
      return res.status(200).json({
        status: "fail",
        message: "Rendezvous not available at this time",
      });
    }

    const user = await User.findOne({ _id: req.body.userId });
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Enregistrer le rendez-vous
    const fullName = `${user.firstName} ${user.lastName}`;
    const avatar = user.avatar;
    const status = "pending";

    const rendezvousModel = new Rendezvous({
      userId: req.body.userId,
      doctorId: req.body.doctorId,
      date,
      time: requestedTime.toDate(), // Convertir Moment.js en objet Date
      status,
      avatar,
      userName: fullName
    });

    await rendezvousModel.save();

    // Formater la date et l'heure avant de les envoyer dans la réponse JSON
    rendezvousModel.date = moment(rendezvousModel.date).format("YYYY-MM-DD");
    rendezvousModel.time = moment(rendezvousModel.time).format("HH:mm");

    return res.status(200).json({
      status: "success",
      message: "Rendezvous successfully registered",
      rendezvous: rendezvousModel,
    });
  } catch (error) {
    console.error("Error while processing rendezvous:", error);

    return res.status(500).json({
      status: "fail",
      message: "Error processing rendezvous",
    });
  }
}; 




const StatusRDVuser = async (req, res, next) => {
  try {
    const { _id, status } = req.body; // Corrected the variable name from _Id to _id
    const RDV = await Rendezvous.findByIdAndUpdate(
      _id,
      { status },
      { new: true } // Added this option to return the updated document
    );

    if (!RDV) {
      const error = appError.create(
        "Rendezvous not found",
        404,
        httpStatusText.FAIL
      );
      return next(error);
    }

    res.json({ status: httpStatusText.SUCCESS, data: {} });
  } catch (error) {
    console.error("Error updating status:", error);

    const errorMessage = "Error updating status";
    const status = 500; // Internal Server Error
    const appErrorInstance = appError.create(
      errorMessage,
      status,
      httpStatusText.FAIL
    );
    return next(appErrorInstance);
  }
};

const getAllDoctorsRendezvous = asyncWrapper(async (req, res, next) => {
  try {
    const userId = req.body.userId;

    // Fetch all doctors with their rendezvous for a specific userId
    const doctorsRendezvous = await Rendezvous.find({ userId: userId });
      //.select("doctorId date status time");
    if(!doctorsRendezvous){
      const error = appError.create(
        "Rendezvous not found",
        404,
        httpStatusText.FAIL
      );
      return next(error);
    }
    res.json({ status: httpStatusText.SUCCESS, data: { doctorsRendezvous } });
  } catch (error) {
    console.error("Error while fetching doctors with rendezvous:", error);

    const errorMessage = "Error fetching doctors with rendezvous";
    const status = 500; // Internal Server Error
    const appErrorInstance = appError.create(
      errorMessage,
      status,
      httpStatusText.FAIL
    );
    return next(appErrorInstance);
  }
});

const deleteRDV = asyncWrapper(async (req, res, next) => {
  const { userId, doctorId } = req.body;

  if (!userId || !doctorId) {
    const error = appError.create(
      "userId and doctorId are required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  try {
    // Use findOne instead of find to get a single document
    const RDV = await Rendezvous.findOne({
      userId: userId,
      doctorId: doctorId,
    });

    if (!RDV) {
      const error = appError.create(
        "Rendezvous not found",
        404,
        httpStatusText.FAIL
      );
      return next(error);
    }

    // Ensure that RDV.toObject() returns a Mongoose document
    const rdvDocument = RDV.toObject();
    await RDV.deleteOne({ _id: rdvDocument._id });
    res.json({
      status: httpStatusText.SUCCESS,
      message: "Rendezvous deleted successfully",
      data: {},
    });
  } catch (error) {
    console.error("Error during RDV deletion:", error);
    const errorMessage = "Error deleting RDV";
    const status = error.name === "CastError" ? 400 : 500; // Handle invalid ID as Bad Request
    const appErrorInstance = appError.create(
      errorMessage,
      status,
      httpStatusText.FAIL
    );
    return next(appErrorInstance);
  }
});

const getAvailableTime = async (req, res, next) => {
  const { doctorId, requestedDate } = req.body;
  try {
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    // Formater la date dans un format ISO ou RFC2822 reconnu par Moment.js
    const formattedDate = moment(requestedDate, "DD-MM-YYYY").toISOString();

    const dayOfWeek = moment(formattedDate).format("dddd");

    const matchingDay = doctor.timings.find(
      (timing) => timing.day === dayOfWeek
    );

    if (!matchingDay) {
      throw new Error(`Doctor is not available on ${dayOfWeek}`);
    }

    const workingHours = matchingDay.hours;

    const existingAppointments = await Rendezvous.find({
      doctorId,
      date: formattedDate, // Utilisez la date formatée ici
    });

    const ALLTimeSlots = existingAppointments.map((appointment) =>
      moment(appointment.time).format("HH:mm")
    );

    const availableTimeSlots = [];
    const timeInterval = 15; // in minutes

    for (let i = 0; i < workingHours.length; i++) {
      const start = moment(workingHours[i].start, "HH:mm");
      const end = moment(workingHours[i].end, "HH:mm");

      while (start.isBefore(end)) {
        const timeSlot = start.format("HH:mm");
        const isAvailable = !ALLTimeSlots.includes(timeSlot);

        availableTimeSlots.push({ time: timeSlot, available: isAvailable });

        start.add(timeInterval, "minutes");
      }
    }

    return res.json({
      status: httpStatusText.SUCCESS,
      data: { availableTimeSlots },
    });
  } catch (error) {
    console.error("Error while getting available time slots:", error);
    return res.status(500).json({
      status: "fail",
      message: "Error getting available time slots",
    });
  }
};


const addComment = async (req, res, next) => {
  try {
    const { content, doctorId, userId } = req.body;
    
    // Créer un nouvel objet de commentaire
    const newComment = new Comment({ content, doctorId, userId });
    
    // Enregistrer le nouveau commentaire dans la base de données
    await newComment.save();

    // Formater la date au format "YYYY-MM-DD"
    const formattedDate = moment(newComment.date).format('YYYY-MM-DD');
    
    // Envoyer une réponse avec le nouveau commentaire
    res.status(201).json({
      status: httpStatusText.SUCCESS,
      data: {
        Comment: {
          ...newComment.toObject(),
          date: formattedDate
        }
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    const errorMessage = 'Error adding comment';
    const status = 500; // Internal Server Error
    const appErrorInstance = appError.create(errorMessage, status, httpStatusText.FAIL);
    return next(appErrorInstance);
  }
};


const getAllCommentsForDoctor = async (req, res, next) => {
  try {
    const { doctorId, userId } = req.body;

    // Recherchez tous les commentaires pour le médecin spécifié et l'utilisateur spécifié
    const comments = await Comment.find({ doctorId, userId });

    // Formater les dates des commentaires avant de les envoyer dans la réponse JSON
    const formattedComments = comments.map(comment => ({
      content: comment.content,
      doctorId: comment.doctorId,
      userId: comment.userId,
      _id: comment._id,
      date: moment(comment.date).format('YYYY-MM-DD'), // Formater la date sans l'heure
    }));

    res.json({
      status: httpStatusText.SUCCESS,
      data: {
        comments: formattedComments // Utiliser les commentaires formatés
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    const errorMessage = 'Error fetching comments';
    const status = 500; // Internal Server Error
    const appErrorInstance = appError.create(errorMessage, status, httpStatusText.FAIL);
    return next(appErrorInstance);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { commentId, doctorId, userId } = req.body;

    // Recherchez le commentaire à supprimer
    const commentToDelete = await Comment.findOne({ _id: commentId, doctorId, userId });

    if (!commentToDelete) {
      const error = appError.create('Comment not found', 404, httpStatusText.FAIL);
      return next(error);
    }

    // Supprimez le commentaire
    await commentToDelete.remove();

    res.json({
      status: httpStatusText.SUCCESS,
      message: 'Comment deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    const errorMessage = 'Error deleting comment';
    const status = 500; // Internal Server Error
    const appErrorInstance = appError.create(errorMessage, status, httpStatusText.FAIL);
    return next(appErrorInstance);
  }
};



module.exports = {
  register,
  login,
  forgotpassword,
  rendezvous,
  getAllDoctorsRendezvous,
  deleteRDV,
  StatusRDVuser,
  searchDoctors,
  getAvailableTime,
  StarEvaluation,
  addComment,
  getAllCommentsForDoctor,
  deleteComment
  
};
