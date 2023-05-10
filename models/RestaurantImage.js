const mongoose = require("mongoose");
const { Schema } = mongoose;

const restaurantImageSchema = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant" },
    image: { type: Schema.Types.ObjectId, ref: "Image" },
  },
  { timestamps: true }
);

const RestaurantImage = mongoose.model(
  "RestaurantImage",
  restaurantImageSchema
);

module.exports = RestaurantImage;
