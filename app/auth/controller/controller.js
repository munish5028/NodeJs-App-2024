const { USER } = require("../model/model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("../../../middleware/nodemailer");

const multer = require("multer");
const path = require("path");
// Configure storage engine and filename
const storage = multer.diskStorage({
  destination: "./uploads/img",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
  
});
const upload = multer({ storage: storage }).fields([{ name: "img" }]);

const auth = {};

auth.signup = async (req, res) => {
  try {
    const data = req.body;
    if (!data.name || !data.email || !data.password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }
    const existingUser = await USER.findOne({ email: data.email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    data.password = hashedPassword;

    const otp = Math.floor(100000 + Math.random() * 900000);

    // Store the OTP in the user's document
    data.otp = otp;

    const user = await USER.create(data);
    if (user) {
      await nodemailer.verifyAccount(user.email, user.otp, user.name);
      res.status(200).json({
        message: "User created successfully, please verify your email",
        data: user,
      });
    } else {
      res.status(400).json({ message: "User not created" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

auth.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }
    const user = await USER.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.verifyOtp) {
      return res
        .status(401)
        .json({ message: "Please verify your email first" });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      "vbfg%$%$",
      {
        expiresIn: "1h",
      }
    );

    res 
      .status(200)
      .json({ message: "Logged in successfully", data: user, token: token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

auth.editProfile = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: err });
      }

      const data = req.body;

      // Check if a new image was uploaded
      if (req.files && req.files.img && req.files.img.length > 0) {
        data.img = req.files.img.map((image) => image.path);
      }

      const user = await USER.findByIdAndUpdate({ _id: req.userId }, data, {
        new: true,
      });

      res.status(200).json({ message: "User   updated successfully", data: user });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

auth.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Please fill all fields" });
    }
    const user = await USER.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    await USER.findOneAndUpdate({ email }, { otp }, { new: true });
    await nodemailer.ForgotPassword(user.email, otp, user.name);
    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

auth.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log(email, otp);

    if (!email || !otp) {
      return res.status(400).json({ message: "Please fill all fields" });
    }
    const user = await USER.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }
    if (user.otp != otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await USER.findOneAndUpdate(
      { email: email },
      { verifyOtp: true },
      { new: true }
    );

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    console.log("error", error);

    res.status(500).json({ message: "Internal Server Error" });
  }
};

auth.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Please fill all fields" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await USER.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

auth.updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const user = await USER.findById(req.userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid user" });
    }

    const isValidOldPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidOldPassword) {
      return res.status(401).json({ message: "Old password not match" });
    }

    const comNewPassword = await bcrypt.compare(newPassword, user.password);
    if (comNewPassword) {
      return res
        .status(401)
        .json({ message: "Password can't same as old password" });
    } 

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await USER.findByIdAndUpdate(
      req.userId,
      { password: hashedNewPassword },
      { new: true }
    );
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = auth;

// HTTP Status Codes

//     200 OK: Request was successful
//     400 Bad Request: Invalid request or malformed data
//     401 Unauthorized: Authentication or authorization failed
//     403 Forbidden: Access denied or permission issue
//     404 Not Found: Resource not found
//     500 Internal Server Error: Server-side error or unexpected condition
//     502 Bad Gateway: Server received an invalid response from an upstream server
//     503 Service Unavailable: Server is currently unavailable or overloaded



