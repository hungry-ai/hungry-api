const mongoose = require("mongoose");
const { Schema } = mongoose;

const googleTagSchema = new Schema({
  mid: String,
  description: String,
  score: Schema.Types.Decimal128,
  topicality: Schema.Types.Decimal128,
  confidence: Schema.Types.Decimal128,
});

const googleImageTagsSchema = new Schema(
  {
    image: { type: Schema.Types.ObjectId, ref: "Image" },
    tags: [googleTagSchema],
  },
  { timestamps: true }
);

const GoogleImageTags = mongoose.model(
  "GoogleImageTags",
  googleImageTagsSchema
);

module.exports = GoogleImageTags;
