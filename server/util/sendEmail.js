const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth:{
    user: "mashfamashfa3@gmail.com",
    pass: "ilepxgkkecwqwdfm"
  },
  send: true
});

transporter.verify((error,success) => {
 if (error){
  console.log(error)
 }
 else {
  console.log('Server is ready to take messages')
  console.log(success)
 }
})


const sendEmail = async (mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
    return;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = sendEmail;

