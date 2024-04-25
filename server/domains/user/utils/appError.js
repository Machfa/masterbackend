// appError.js

class AppError extends Error {
    constructor(message, statusCode, statusText) {
        super(message);
        this.statusCode = statusCode;
        this.statusText = statusText;
    }
}

function create(message, statusCode, statusText) {
    return new AppError(message, statusCode, statusText);
}

module.exports = { AppError, create };
