const generateOTP = async () => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    return otp;
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = generateOTP;
