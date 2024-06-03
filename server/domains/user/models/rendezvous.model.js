const mongoose = require("mongoose");

const rendezvousSchema = new mongoose.Schema(
  {
    doctorAttended: {
      type: Boolean,
      default: false, 
    },
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    doctorId: {
      type: String,
      required: true,
    },
    userInfo: {
      diagnoses: {
        type: String,
        default: "", // Valeur par défaut pour les diagnostics
      },
      prescription: {
        type: String,
        default: "", // Valeur par défaut pour la prescription
      },
      examinationResult: {
        type: String,
        default: "", // Valeur par défaut pour le résultat de l'examen
      },
    },
    medicalReport: {
      type: String,
      default: "../uploads/medicalreport.jpg", // Valeur par défaut pour le rapport médical
    },
    IRMReport: {
      type: String,
      default: "../uploads/irmreport.jpg", // Valeur par défaut pour le rapport IRM
    },
    ECGReport: {
      type: String,
      default: "../uploads/ecgreport.jpg", // Valeur par défaut pour le rapport ECG
    },
    Bloodtest: {
      type: String,
      default: "../uploads/bloodtestreport.jpg", // Valeur par défaut pour le rapport d'analyse sanguine
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "pending",
    },
    avatar: {
      type: String,
    },
    timeRemaining: {
      type: String, // Type approprié pour représenter le temps restant
    },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Rendezvous", rendezvousSchema);

