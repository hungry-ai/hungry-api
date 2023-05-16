const mongoose = require("mongoose");
const { Schema } = mongoose;

const tagSchema = new Schema({
  name: String,
  weights: [Schema.Types.Decimal128],
});

const Tag = mongoose.model("Tag", tagSchema);

const googleTagSchema = new Schema({
  mid: String,
  description: String,
  score: Schema.Types.Decimal128,
  topicality: Schema.Types.Decimal128,
  confidence: Schema.Types.Decimal128,
});

const googleImageTagsSchema = new Schema(
  {
    url: String,
    tags: [googleTagSchema],
  },
  { timestamps: true }
);

const GoogleImageTags = mongoose.model(
  "GoogleImageTags",
  googleImageTagsSchema
);

module.exports = { Tag, GoogleImageTags };
