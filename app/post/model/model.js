const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    desc: {
      type: String,
    },
    title: {
      type: String,
    },
    images: [
      {
        type: String,
      },
    ],
    createBy: {
      type: mongoose.Types.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("POST", PostSchema);