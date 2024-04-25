const mongoose = require('mongoose');
const validator = require('validator');
const userRoles = require('../utils/userRoles');

const doctorSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: [validator.isEmail, 'field must be a valid email address']
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: [userRoles.USER, userRoles.ADMIN, userRoles.DOCTOR],
        default: userRoles.DOCTOR,
    },
    address: {
        type: String,
        required: true
    },
    specialization: {
        type: String,
        required: true
    },
    experience: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default:"../uploads/profile.png"
    },
    star: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    numberOfEvaluations: {
        type: Number,
        default: 0,
        min: 0
    },
    totalStars:{
        type: Number,
        default: 0,
        min: 0
    },
    timings: [
        {
            day: {
                type: String,
                required: true,
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            },
            hours: [
                {
                    start: {
                        type: String,
                        required: true,
                        default: '08:00'
                    },
                    end: {
                        type: String,
                        required: true,
                        default: '12:00'
                    }
                },
                {
                    start: {
                        type: String,
                        required: true,
                        default: '14:00'
                    },
                    end: {
                        type: String,
                        required: true,
                        default: '17:00'
                    }
                }
            ]
        }
    ],
},
    { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
