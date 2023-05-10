const mongoose = require("mongoose");
const { Schema } = mongoose;

const imageTagsSchema = new Schema(
  {
    image: { type: Schema.Types.ObjectId, ref: "Image" },
    tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
    weights: [Schema.Types.Decimal128],
  },
  { timestamps: true }
);

const ImageTags = mongoose.model("ImageTags", imageTagsSchema);

module.exports = ImageTags;
