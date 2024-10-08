const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    age: {
      type: Number,
    },
    otp: {
      type: Number,
    },
    verifyOtp: {
      type: Boolean,
      default: false,
    },
    img: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports.USER = mongoose.model("user", userSchema);
