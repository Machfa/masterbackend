const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const otpSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // 10 minutes expiry
  }
});

const OTP = mongoose.model('Otp', otpSchema);

module.exports = OTP;

