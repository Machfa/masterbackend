const asyncWrapper = require("../middleware/asyncWrapper");
const User = require("../models/user.model");
const Doctor = require('../models/doctor.model');
const Rendezvous = require("../models/rendezvous.model");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const generateJWT = require("../utils/generateJWT");
const moment = require("moment");
const { verifyOTP } = require("../../otp/controller.js");
const { sendBierPayement } = require("../../otp/controller.js");

const addfavouriteDoctor = asyncWrapper(async (req, res, next) => {
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
    // Find the user by id
    const user = await User.findById(userId);

    if (!user) {
      const error = appError.create(
        "User not found",
        404,
        httpStatusText.FAIL
      );
      return next(error);
    }

    // Find the doctor by id
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      const error = appError.create(
        "Doctor not found",
        404,
        httpStatusText.FAIL
      );
      return next(error);
    }

    // Check if the doctor is already in the user's favorite list
    const isFavourite = user.favourites.includes(doctorId);

    if (isFavourite) {
      return res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: "Doctor is already in the favorite list",
        data: {},
      });
    }

    // Add the doctor to the user's favorite list
    user.favourites.push(doctorId);

    // Save the updated user
    await user.save();

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Doctor added to favorite list successfully",
      data: { favourites: user.favourites },
    });
  } catch (error) {
    console.error("Error adding favorite doctor:", error);
    const errorMessage = "Error adding favorite doctor";
    const status = 500; // Internal Server Error
    const appErrorInstance = appError.create(
      errorMessage,
      status,
      httpStatusText.FAIL
    );
    return next(appErrorInstance);
  }
});
const deleteFavouriteDoctor = asyncWrapper(async (req, res, next) => {
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
    const user = await User.findById(userId);

    if (!user) {
      const error = appError.create("User not found", 404, httpStatusText.FAIL);
      return next(error);
    }

    const index = user.favourites.indexOf(doctorId);

    if (index === -1) {
      // Doctor not found in favourites
      return res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: "Doctor is not in the favourite list",
        data: {},
      });
    }

    // Remove the doctor from favourites array
    user.favourites.splice(index, 1);
    await user.save();

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Doctor removed from favourite list successfully",
      data: { favourites: user.favourites },
    });
  } catch (error) {
    console.error("Error deleting favourite doctor:", error);
    return next(appError.create("Error deleting favourite doctor", 500, httpStatusText.FAIL));
  }
});
const getFavouriteDoctors = asyncWrapper(async (req, res, next) => {
  const userId = req.body.userId;

  if (!userId) {
    const error = appError.create(
      "User ID is required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  try {
    const user = await User.findById(userId).populate('favourites');

    if (!user) {
      const error = appError.create("User not found", 404, httpStatusText.FAIL);
      return next(error);
    }

    res.json({
      status: httpStatusText.SUCCESS,
      data: {
        favourites: user.favourites
      }
    });
  } catch (error) {
    console.error("Error while fetching favourite doctors:", error);
    return next(appError.create("Error fetching favourite doctors", 500, httpStatusText.FAIL));
  }
});
const register = asyncWrapper(async (req, res, next) => {
  const { firstName, lastName, email, role, password, phoneNumber, gender,otp } = req.body;

  await verifyOTP(email,otp);

  const oldUser = await User.findOne({ email: email });

  if (oldUser) {
    const error = appError.create(
      "User already exists",
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

  // Create a new user
  const newUser = new User({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role,
    phoneNumber,
    avatar: avatar,
    gender
  });

  // Save the new user to the database
  await newUser.save();

  // Generate JWT token
  const token = await generateJWT({ email: newUser.email, id: newUser._id, role: newUser.role });

  // Respond with success status and the new user data, excluding the password
  res.status(201).json({ status: httpStatusText.SUCCESS, data: { user: { ...newUser.toObject(), password: undefined } } });
});

const sendParEmail = asyncWrapper(async (req, res, next) => {
  try {
    // Extract the parameters from the request body
    const {
      email,
      RDVid,
      customerName,
      customerType,
      address,
      meterNumber,
      amount,
      tax,
      operator
    } = req.body;

    // Ensure all required fields are provided
    if (!email || !RDVid || !customerName || !customerType || !address || !meterNumber || !amount || !tax || !operator) {
      const error = new Error("All fields are required");
      error.status = 400;
      throw error;
    }

    // Call the sendBierPayement function
    await sendBierPayement(email, RDVid, customerName, customerType, address, meterNumber, amount, tax, operator);

    // Respond with success status
    res.status(200).json({ status: "success", message: "Email sent successfully" });
  } catch (error) {
    // Handle errors
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
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
      gender,
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
          gender,
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
const searchDoctorss = asyncWrapper(async (req, res, next) => {
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
const searchDoctors = asyncWrapper(async (req, res, next) => {
  const { searchQuery, gender, specializations, rating, price } = req.body;

  // Construction dynamique du filtre de recherche
  let filter = {};

  // Ajout du filtre de recherche textuelle
  if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, 'i');
      filter.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { specialization: searchRegex }
      ];
  }

  // Ajout du filtre de genre
  if (gender) {
      filter.gender = gender;
  }

  // Ajout du filtre de spécialités
  if (specializations && specializations.length > 0) {
      filter.specialization = { $in: specializations };
  }

  // Ajout du filtre de note
  if (rating) {
      filter.rating = { $gte: rating };
  }

  // Ajout du filtre de prix
  if (price) {
      filter.price = { $lte: price }; // Par exemple, pour chercher des docteurs avec un prix inférieur ou égal à la valeur donnée
  }

  try {
      const doctors = await Doctor.find(filter);

      if (doctors.length === 0) {
          return res.json({ status: httpStatusText.SUCCESS, message: 'No doctors found with the provided search query' });
      } else {
          res.json({ status: httpStatusText.SUCCESS, data: { doctors } });
      }
  } catch (error) {
      return next(appError.create('Error while searching for doctors', 500, httpStatusText.FAIL));
  }
});
const rendezvous= async (req, res, next) => {
  try {
    const requestedDate = moment(req.body.date, "DD-MM-YYYY");
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
    const fromTime = requestedTime.clone().subtract(14, "minutes").toDate();
    const toTime = requestedTime.clone().add(14, "minutes").toDate();

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
    rendezvousModel.date = moment(rendezvousModel.date).format("DD-MM-YYYY");
    rendezvousModel.time = moment(rendezvousModel.time).format("HH:mm");

    // await getAvailableTime(req, res, next);
     schedulePaymentCheck(rendezvousModel._id);
    return res.status(200).json({
      status: "success",
      message: "Rendezvous successfully registered",
      rendezvous: rendezvousModel
    });
  } catch (error) {
    console.error("Error while processing rendezvous:", error);

    return res.status(500).json({
      status: "fail",
      message: "Error processing rendezvous",
    });
  }
}; 


const schedulePaymentCheck = async (rendezvousId) => {
  try {
    await delay( 2 * 24 * 60 * 60 * 1000);

    // Vérifier le statut du rendez-vous
    const rendezvous = await Rendezvous.findById(rendezvousId);
    if (rendezvous.status === "pending") {
       //await rendezvous.deleteOne(id)
       await Rendezvous.deleteOne({ _id: rendezvousId });
      //rendezvous.status = "cancelled";
      await rendezvous.save();
    }

  } catch (error) {
    console.error("Error while checking payment status:", error);
    return 0; // En cas d'erreur, retourner 0 pour le temps restant
  }
};
const sendBierdepay = async (req,res,next) => {
  try {
 // Obtenez le prix du rendez-vous à partir de la requête
 const { email,rendezvousId, cardName, price } = req.body;

 // Mettez à jour le statut du rendez-vous en "done"
 const rendezvous = await Rendezvous.findById(rendezvousId);
 if (!rendezvous) {
   return res.status(404).json({ error: "Rendezvous not found" });
 }
// Envoyez le bon de paiement par e-mail
await sendBierPayement(email, rendezvousId);

res.status(200).json("bier is sent successfuly");
  } catch (error) {
    console.error("Error sending bier de payement:", error);
    return 0; // En cas d'erreur, retourner 0 pour le temps restant
  }
};

const makePayment = async (req, res, next) => {
  try {
    // Obtenez le prix du rendez-vous à partir de la requête
    const { rendezvousId, cardName, price } = req.body;

    // Mettez à jour le statut du rendez-vous en "done"
    const rendezvous = await Rendezvous.findById(rendezvousId);
    if (!rendezvous) {
      return res.status(404).json({ error: "Rendezvous not found" });
    }
    rendezvous.status = "done";
    await rendezvous.save();

    // Renvoyez la réponse avec les détails du paiement
    res.status(200).json({
      token: rendezvousId,
      price: price,
      rendezvousId: rendezvousId,
      cardName: cardName
    });
  } catch (error) {
    res.status(500).json({ error: "Payment failed" });
  }
};
const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
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
  try {
    const requestedDate = moment(req.body.date, "DD-MM-YYYY");
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

    // Récupérer tous les rendez-vous existants pour ce médecin à cette date
    const existingAppointments = await Rendezvous.find({
      doctorId,
      date: requestedDate.toDate()
    });

    // Créer une liste de tous les créneaux horaires pour cette journée
    const allTimeSlots = [];
    matchingDay.hours.forEach(hour => {
      const start = moment(hour.start, "HH:mm");
      const end = moment(hour.end, "HH:mm");
      while (start.isBefore(end)) {
        allTimeSlots.push(start.clone().format("HH:mm"));
        start.add(15, 'minutes'); // Ajustez l'intervalle de temps selon vos besoins
      }
    });

    // Marquer les créneaux horaires comme disponibles ou non disponibles
    const availableTimes = allTimeSlots.map(time => {
      const isAvailable = !existingAppointments.some(appointment => {
        const appointmentTime = moment(appointment.time).format("HH:mm");
        return appointmentTime === time;
      });
      return { time, isAvailable };
    });

    return res.status(200).json({
      status: "success",
      availableTimes
    });
  } catch (error) {
    console.error("Error while processing available times:", error);

    return res.status(500).json({
      status: "fail",
      message: "Error processing available times",
    });
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
  makePayment,
  sendBierdepay,
  sendParEmail,
  addfavouriteDoctor,
  getFavouriteDoctors,
  deleteFavouriteDoctor
};
