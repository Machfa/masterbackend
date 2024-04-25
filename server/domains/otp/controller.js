const OTP = require("./model.js");
const generateOTP = require("../../util/generateOTP.js");
const sendEmail = require("../../util/sendEmail.js");
const { hashData, compareHashedData } = require("../../util/hashing.js");

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new Error("Provide values for email and otp");
    }

    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      throw new Error("OTP record not found");
    }

    const { createdAt, otp: hashedOTP } = otpRecord;

    // Checking expired OTP code
    if (Date.now() > createdAt) {
      await OTP.deleteOne({ email });
      throw new Error("OTP expired");
    }

    const isMatch = await compareHashedData(otp, hashedOTP);

    res.status(200).json({ validateOTP: isMatch });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new Error("Email is required");
    }

    // Delete previous OTP messages sent
    await OTP.deleteOne({ email });

    // Generate OTP
    const generatedOTP = await generateOTP();

    // Send OTP via email
    const mailOptions = {
      from: "mashfamashfa3@gmail.com",
      to: email,
      subject: "OTP from Callback Coding",
      text: `Your OTP is: ${generatedOTP}`,
    };
    await sendEmail(mailOptions);

    // Save OTP to the database
    const hashedOTP = await hashData(generatedOTP);
    const duration = 30; // Set the desired duration in minutes
    const createdOTPRecord = await OTP.create({
      email,
      otp: hashedOTP,
      createdAt: Date.now() + duration * 60000,
    });

    res.status(200).json({ createOTPRecord: createdOTPRecord });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

module.exports = { sendOTP, verifyOTP };
