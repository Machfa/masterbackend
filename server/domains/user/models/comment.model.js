const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  doctorId: {
    type: String, // Type de chaîne de caractères pour l'identifiant du médecin
    required: true
  },
  userId: {
    type: String, // Type de chaîne de caractères pour l'identifiant de l'utilisateur
    required: true
  }
});

module.exports=mongoose.model('Comment', commentSchema);

