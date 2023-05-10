const mongoose = require("mongoose");
const { Schema } = mongoose;

const restaurantSchema = new Schema(
  {
    name: String,
  },
  { timestamps: true }
);

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

module.exports = Restaurant;
