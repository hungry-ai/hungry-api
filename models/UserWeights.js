const mongoose = require("mongoose");
const { Schema } = mongoose;

const userWeightsSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    weights: [Schema.Types.Decimal128],
    XTX_flat: [Schema.Types.Decimal128],
    XTy_flat: [Schema.Types.Decimal128],
    stale: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const UserWeights = mongoose.model("UserWeights", userWeightsSchema);
const DefaultUserWeights = mongoose.model(
  "DefaultUserWeights",
  userWeightsSchema
);

module.exports = {
  UserWeights: UserWeights,
  DefaultUserWeights: DefaultUserWeights,
};
