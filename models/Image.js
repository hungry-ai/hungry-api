const mongoose = require("mongoose");
const { Schema } = mongoose;

const imageSchema = new Schema(
  {
    url: String,
    weights: [Schema.Types.Decimal128],
  },
  { timestamps: true }
);

const Image = mongoose.model("Image", imageSchema);

module.exports = { Image };
