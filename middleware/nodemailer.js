const nodemailer = require("nodemailer");
const { ACCOUNT_VERIFY } = require("./emailtemplate");
module.exports = {
  async sendMail(to, subject, html) {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "rythmbhatia5028@gmail.com",
        pass: "soqwgkhkacvgnolr", // Your app password
      },
    });

    const mailOptions = {
      from: "rythmbhatia5028@gmail.com",
      to: to,
      subject: subject,
      html: html,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log("Email sent: " + info.response);
    });
  },

  async verifyAccount(email, otp, name) {
    const subjet = "Otp for verify account";
    const html = ACCOUNT_VERIFY(name, otp);
    await this.sendMail(email, subjet, html);
  },

  async ForgotPassword(email, username, otp) {
    const subjet = "Otp for reset password";
    const html = ACCOUNT_VERIFY(username, otp);
    await this.sendMail(email, subjet, html);
  },
};
