const mongoose = require("mongoose");
const { Schema } = mongoose;

const restaurantSchema = new Schema(
  {
    name: String,
    images: [{ type: Schema.Types.ObjectId, ref: "Image" }],
  },
  { timestamps: true }
);

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

module.exports = Restaurant;
