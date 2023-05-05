const mongoose = require("mongoose");
const { Schema } = mongoose;

const tagWeightsSchema = new Schema(
  {
    tag: { type: Schema.Types.ObjectId, ref: "Tag" },
    weights: [Schema.Types.Decimal128],
  },
  { timestamps: true }
);

const TagWeights = mongoose.model("TagWeights", tagWeightsSchema);

module.exports = TagWeights;
