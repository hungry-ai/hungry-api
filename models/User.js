const mongoose = require("mongoose");
const { Schema } = mongoose;

const userWeightsSchema = new Schema(
  {
    weights: [Schema.Types.Decimal128],
    XTX_flat: [Schema.Types.Decimal128],
    XTy: [Schema.Types.Decimal128],
    stale: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const DefaultUserWeights = mongoose.model(
  "DefaultUserWeights",
  userWeightsSchema
);

const userSchema = new Schema(
  {
    instagramUsername: String,
    instagramId: String,
    weights: userWeightsSchema,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = { User, DefaultUserWeights };
