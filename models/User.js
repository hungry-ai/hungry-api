const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    instagramUsername: String,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
