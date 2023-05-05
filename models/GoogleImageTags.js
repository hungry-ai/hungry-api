const mongoose = require("mongoose");
const { Schema } = mongoose;

const googleImageTagsSchema = new Schema(
  {
    image: { type: Schema.Types.ObjectId, ref: "Image" },
    tags: [{ type: Schema.Types.ObjectId, ref: "GoogleTag" }],
  },
  { timestamps: true }
);

const GoogleImageTags = mongoose.model(
  "GoogleImageTags",
  googleImageTagsSchema
);

module.exports = GoogleImageTags;
