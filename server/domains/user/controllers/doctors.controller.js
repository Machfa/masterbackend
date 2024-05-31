const asyncWrapper = require("../middleware/asyncWrapper");
const Doctor = require('../models/doctor.model');
const User = require("../models/user.model");
const Rendezvous = require('../models/rendezvous.model');
const Comment = require('../models/comment.model');
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
        const { firstName, lastName, phoneNumber, email, password, role, address, specialization, experience, timings,gender,price } = req.body;
        
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
            gender,
            price,
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

            // Calculer et mettre à jour le temps restant
            const currentTime = Date.now();
            const creationTime = rendezvous.createdAt.getTime();
            const elapsedTime = currentTime - creationTime;
            const remainingTime = Math.max(0, 24 * 60 * 60 * 1000 - elapsedTime); // Temps restant de 24 heures à partir de la création
            rendezvous.timeRemaining = formatTime(remainingTime);
        });

        // Trier les rendez-vous par heure
        RDV.sort((a, b) => moment(a.time, "HH:mm").diff(moment(b.time, "HH:mm")));

        res.json({ status: httpStatusText.SUCCESS, data: { RDV } });
    } catch (error) {
        console.error('Error searching rendezvous:', error);

        const errorMessage = 'Error searching rendezvous';
        const status = 500; 
        const appErrorInstance = appError.create(errorMessage, status, httpStatusText.FAIL);
        return next(appErrorInstance);
    }
};
const formatTime = (remainingTime) => {
    const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
  
    let timeRemainingString = '';
    if (days > 0) {
      timeRemainingString += `${days} jour(s) `;
    }
    if (hours > 0) {
      timeRemainingString += `${hours} heure(s) `;
    }
    if (minutes > 0) {
      timeRemainingString += `${minutes} minute(s) `;
    }
    if (seconds > 0) {
      timeRemainingString += `${seconds} seconde(s) `;
    }
  
    return timeRemainingString.trim();
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
        rendezvous.doctorAttended=true;

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

        // Format the date and time for each appointment
        pastAppointments.forEach((rendezvous) => {
            rendezvous.date = moment(rendezvous.date).format("DD-MM-YYYY");
            rendezvous.time = moment(rendezvous.time).format("HH:mm");
        });

        // Sort past appointments chronologically by date and time
        pastAppointments.sort((a, b) => {
            const dateComparison = moment(a.date, 'DD-MM-YYYY').diff(moment(b.date, 'DD-MM-YYYY'));
            if (dateComparison !== 0) {
                return dateComparison;
            }
            return moment(a.time, 'HH:mm').diff(moment(b.time, 'HH:mm'));
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
      await commentToDelete.deleteOne();
  
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
  const getDoctorStats = asyncWrapper(async (req, res, next) => {
    try {
        const { doctorId, year, month } = req.body;
        let confirmedAppointments = 0;
        let cancelledAppointments = 0;
        let genderStats = { child: 0, man: 0, woman: 0 };

        const monthIndex = month - 2;

        // Récupérer le premier et le dernier jour du mois en fonction de l'année et du mois
        const firstDayOfMonth = moment({ year, month: monthIndex }).startOf('month').toDate();
        const lastDayOfMonth = moment({ year, month: monthIndex }).endOf('month').toDate();

        const allRDV = await Rendezvous.find({
            doctorId,
            date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
        });

        // Filtrer les rendez-vous confirmés et annulés pour le mois donné
        const confirmedRDV = allRDV.filter(rdv => rdv.status === "confirmed");
        const cancelledRDV = allRDV.filter(rdv => rdv.status === "cancelled");

        confirmedAppointments = confirmedRDV.length;
        cancelledAppointments = cancelledRDV.length;

        // Total des rendez-vous pour le mois donné
        const totalAppointmentsPerMonth = allRDV.length;
        const pendingAppointments = totalAppointmentsPerMonth - (confirmedAppointments + cancelledAppointments);

        // Total des rendez-vous pour toute l'année
        let totalAppointmentsYear = 0;
        let EarningStatictic = {};

        // Calculer le nombre total de rendez-vous pour chaque mois de l'année
        for (let m = 1; m <= 12; m++) {
            const firstDay = moment({ year, month: m - 2 }).startOf('month').toDate();
            const lastDay = moment({ year, month: m - 2 }).endOf('month').toDate();

            const RDV = await Rendezvous.find({
                doctorId,
                date: { $gte: firstDay, $lte: lastDay },
            });

            const appointmentsCount = RDV.length;
            totalAppointmentsYear += appointmentsCount;
            EarningStatictic[m] = appointmentsCount;

            // Calculer les statistiques basées sur le genre
            RDV.forEach(rdv => {
                if (rdv.gender === 'child') {
                    genderStats.child++;
                } else if (rdv.gender === 'man') {
                    genderStats.man++;
                } else if (rdv.gender === 'woman') {
                    genderStats.woman++;
                }
            });
        }
        for (let m = 1; m <= 12; m++) {
            // Calculer le pourcentage de rendez-vous par rapport au total annuel
            EarningStatictic[m] = totalAppointmentsYear > 0 ? ((EarningStatictic[m] / totalAppointmentsYear) * 100).toFixed(2) : '0.0';
        }
        // Calculer les pourcentages des rendez-vous confirmés et annulés pour le mois donné
        const percentageConfirmedAppointments = ((confirmedAppointments / totalAppointmentsPerMonth) * 100).toFixed(2);
        const percentageCancelledAppointments = ((cancelledAppointments / totalAppointmentsPerMonth) * 100).toFixed(2);
        const percentagePendingAppointments = ((pendingAppointments / totalAppointmentsPerMonth) * 100).toFixed(2);

        // Calculer les pourcentages des rendez-vous en fonction du genre
        const totalGenderRDV = genderStats.child + genderStats.man + genderStats.woman;
        const percentageChild = ((genderStats.child / totalGenderRDV) * 100).toFixed(2);
        const percentageMan = ((genderStats.man / totalGenderRDV) * 100).toFixed(2);
        const percentageWoman = ((genderStats.woman / totalGenderRDV) * 100).toFixed(2);

        // Retourner les statistiques
        res.json({
            status: httpStatusText.SUCCESS,
            data: {
                confirmedAppointments,
                cancelledAppointments,
                pendingAppointments,
                totalAppointmentsPerMonth,
                totalAppointmentsYear
            },
            stats: {
                percentageConfirmedAppointments,
                percentageCancelledAppointments,
                percentagePendingAppointments,
                EarningStatictic,
                genderStats: {
                    child: {
                        count: genderStats.child,
                        percentage: percentageChild
                    },
                    man: {
                        count: genderStats.man,
                        percentage: percentageMan
                    },
                    woman: {
                        count: genderStats.woman,
                        percentage: percentageWoman
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error fetching doctor statistics:', error);
        const errorMessage = 'Error fetching doctor statistics';
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
    userInfoaboutAppoinment,
    getAllPastAppointmentsWithPatient,
    infoparID, 
    addComment,
    getAllCommentsForDoctor,
    deleteComment,
    getDoctorStats
};
