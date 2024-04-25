const mongoose = require("mongoose");

const rendezvousSchema = new mongoose.Schema(
  {
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
        default: "", // Default value for diagnoses
      },
      prescription: {
        type: String,
        default: "", // Default value for prescription
      },
      examinationResult: {
        type: String,
        default: "", // Default value for examinationResult
      },
    },
      medicalReport: {
        type: String,
        default: "../uploads/medicalreport.jpg", // Default value for medicalReport
      },
      IRMReport: {
        type: String,
        default: "../uploads/irmreport.jpg", // Default value for medicalReport
      },
      ECGReport: {
        type: String,
        default: "../uploads/ecgreport.jpg", // Default value for medicalReport
      },
      Bloodtest: {
        type: String,
        default: "../uploads/bloodtestreport.jpg", // Default value for medicalReport
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
  },
  { timestamps: true }
);

const Rendezvous = mongoose.model("Rendezvous", rendezvousSchema);

module.exports = Rendezvous;
