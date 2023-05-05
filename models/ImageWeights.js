const mongoose = require("mongoose");
const { Schema } = mongoose;

const imageWeightsSchema = new Schema(
  {
    image: { type: Schema.Types.ObjectId, ref: "Image" },
    weights: [Schema.Types.Decimal128],
  },
  { timestamps: true }
);

const ImageWeights = mongoose.model("ImageWeights", imageWeightsSchema);

module.exports = ImageWeights;
