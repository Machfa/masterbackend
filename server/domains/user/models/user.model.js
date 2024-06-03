const mongoose = require("mongoose");
const validator = require("validator");
const userRoles = require("../utils/userRoles");

// Définition du schéma utilisateur
const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'user'
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: '../uploads/profile1.png',
  },
  gender: {
    type: String,
    required: true
  },
  favourites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  token: {
    type: String,
  }
});

// Middleware pour mettre à jour le champ updatedAt avant de sauvegarder
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Création et exportation du modèle User
const User = mongoose.model('User', UserSchema);
module.exports = User;

