const mongoose = require("mongoose");
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    image: { type: Schema.Types.ObjectId, ref: "Image" },
    rating: { type: Number, min: 1, max: 5 },
    instagramTimestamp: Number,
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
