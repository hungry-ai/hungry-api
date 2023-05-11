const mongoose = require("mongoose");
const { Schema } = mongoose;

const instagramStoryMentionSchema = new Schema(
  {
    object: String,
    entry: [
      new Schema({
        id: String,
        time: Number,
        messaging: [
          new Schema({
            sender: new Schema({ id: String }),
            recipient: new Schema({ id: String }),
            timestamp: Number,
            message: new Schema({
              mid: String,
              attachments: [
                new Schema({
                  type: String,
                  payload: new Schema({ url: String }),
                }),
              ],
            }),
          }),
        ],
      }),
    ],
  },
  { timestamps: true }
);

const InstagramStoryMention = mongoose.model(
  "InstagramStoryMention",
  instagramStoryMentionSchema
);

module.exports = InstagramStoryMention;
