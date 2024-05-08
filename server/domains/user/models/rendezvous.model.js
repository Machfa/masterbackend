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

// Utilisation d'un hook pre-save pour mettre à jour le champ timeRemaining avant chaque sauvegarde du document
/*rendezvousSchema.pre('find', async function() {
  try {
    // Récupérer les documents trouvés par la recherche
    const RDV = await this.model.find(this.getFilter());

    // Mettre à jour le champ timeRemaining pour chaque document trouvé
    RDV.forEach(rendezvous => {
      const currentTime = Date.now();
      const creationTime = rendezvous.createdAt.getTime();
      const elapsedTime = currentTime - creationTime;
      const remainingTime = Math.max(0, 24 * 60 * 60 * 1000 - elapsedTime); // Temps restant de 24 heures à partir de la création
      rendezvous.timeRemaining = formatTime(remainingTime);
    });
  } catch (error) {
    console.error("Error while updating timeRemaining:", error);
  }
});*/



// Formatage du temps restant en une représentation lisible par l'homme
/*const formatTime = (remainingTime) => {
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
};*/


module.exports = mongoose.model("Rendezvous", rendezvousSchema);

