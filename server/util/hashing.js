const bcrypt = require('bcrypt');

const hashData = async (data) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedData = await bcrypt.hash(data, salt);
    return hashedData;
  } catch (error) {
    throw new Error(error);
  }
}
const compareHashedData = async (data, hashedData) => {
  try {
    const isMatch = await bcrypt.compare(data, hashedData);
    return isMatch;
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = {hashData, compareHashedData};