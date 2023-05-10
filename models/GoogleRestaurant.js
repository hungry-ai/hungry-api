const mongoose = require("mongoose");
const { Schema } = mongoose;

const googleRestaurantSchema = new Schema(
  {
    zip: String,
  },
  { timestamps: true }
);

const GoogleRestaurant = mongoose.model(
  "GoogleRestaurant",
  googleRestaurantSchema
);

module.exports = GoogleRestaurant;
