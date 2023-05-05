const mongoose = require("mongoose");
const { Schema } = mongoose;

const googleTagSchema = new Schema(
  {
    mid: String,
    description: String,
    score: Schema.Types.Decimal128,
    topicality: Schema.Types.Decimal128,
  },
  { timestamps: true }
);

const GoogleTag = mongoose.model("GoogleTag", googleTagSchema);

module.exports = GoogleTag;
