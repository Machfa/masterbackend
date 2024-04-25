const jwt = require('jsonwebtoken');
const httpStatusText = require('../utils/httpStatusText');
const appError = require('../utils/appError');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['Authorization'] || req.headers['authorization'];
    if(!authHeader) {
        const error = appError.create('token is required', 401, httpStatusText.ERROR)
        return next(error);
    }

    const token = authHeader.split(' ')[1];
    try {

        const currentUser = jwt.verify(token, "50964792fda08df9c91afa9435d5981d4cb49b3fc1fbc403d8964ec72c1165bd");
        req.currentUser = currentUser;
        next();

    } catch (err) {
        const error = appError.create('invalid token', 401, httpStatusText.ERROR)
        return next(error);
    }   
    
}

module.exports = verifyToken;