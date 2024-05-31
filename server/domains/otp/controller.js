const OTP = require("./model.js");
const generateOTP = require("../../util/generateOTP.js");
const sendEmail = require("../../util/sendEmail.js");
const { hashData, compareHashedData } = require("../../util/hashing.js");

const fs = require("fs");
const path = require("path");

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

    // Load email template
    const emailTemplatePath = path.join(
      __dirname,
      "../../domains/otp/html.html"
    );

    // Replace placeholder with OTP
    const emailTemplate = fs.readFileSync(emailTemplatePath, "utf8");

    // Replace placeholder with OTP
    const emailWithOTP = emailTemplate.replace("{{otp}}", `<h2 class="otp-animation">${generatedOTP}</h2>`);
    // Send OTP via email
    const mailOptions = {
      from: "mashfamashfa3@gmail.com",
      to: email,
      subject: "OTP from Callback Coding",
      html: emailWithOTP,
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

const verifyOTP = async (email, otp) => {
  try {
    if (!email || !otp) {
      throw new Error("Provide values for email and otp");
    }

    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      throw new Error("OTP record not found");
    }

    const { otp: hashedOTP } = otpRecord;

    const isMatch = await compareHashedData(otp, hashedOTP);

    return isMatch;
  } catch (error) {
    throw new Error(error.message);
  }
};
const verifyOTPss = async (req, res) => {
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
console.log(isMatch);
    res.status(200).json({ validateOTP: isMatch });
  } catch (error) {
    res.status(400).send(error.message);
  }
};


const sendBierPayementss = async (req, res) => {
  try {
    const { email,RDVid } = req.body;

    if (!email) {
      throw new Error("Email is required");
    }


    // Load email template
    const emailTemplatePath = path.join(
      __dirname,
      "../../domains/otp/html.html"
    );

    // Replace placeholder with OTP
    const emailTemplate = fs.readFileSync(emailTemplatePath, "utf8");

    // Replace placeholder with OTP
    const emailWithToken = emailTemplate.replace("{{token}}", `<h2 class="otp-animation">${RDVid}</h2>`);
    // Send OTP via email
    const mailOptions = {
      from: "mashfamashfa3@gmail.com",
      to: email,
      subject: "OTP from Callback Coding",
      html: emailWithToken,
    };
    await sendEmail(mailOptions);

    res.status(200).json({status:"Bier de payement sent succesfuly"});
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const sendBierPayement = async (email,RDVid) => {
  try {

    if (!email) {
      throw new Error("Email is required");
    }

    // Load email template
    const emailTemplatePath = path.join(
      __dirname,
      "../../domains/otp/html.html"
    );

    // Replace placeholder with OTP
    const emailTemplate = fs.readFileSync(emailTemplatePath, "utf8");

    // Replace placeholder with OTP
    const emailWithToken = emailTemplate.replace("{{otp}}", `<h2 class="otp-animation">${RDVid}</h2>`);
    // Send OTP via email
    const mailOptions = {
      from: "mashfamashfa3@gmail.com",
      to: email,
      subject: "OTP from Callback Coding",
      html: emailWithToken,
    };
    await sendEmail(mailOptions);

    return true;
  } catch (error) {
    res.status(400).send(error.message);
  }
};

module.exports = { sendOTP, verifyOTP,sendBierPayement,verifyOTPss,sendBierPayementss };
