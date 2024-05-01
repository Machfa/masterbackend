const jwt = require('jsonwebtoken');

module.exports = async (payload) => {

    const token = await jwt.sign(
        payload,
        "50964792fda08df9c91afa9435d5981d4cb49b3fc1fbc403d8964ec72c1165bd", 
       // {expiresIn: '5m'}
    );

    return token;
}