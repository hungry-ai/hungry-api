const mongoose = require("mongoose");
const { Schema } = mongoose;

const tagSchema = new Schema(
  {
    name: String,
  },
  { timestamps: true }
);

const Tag = mongoose.model("Tag", tagSchema);

module.exports = Tag;
