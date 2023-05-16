const mongoose = require("mongoose");
const { Schema } = mongoose;

const instagramWebhookSchema = new Schema(
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

const InstagramWebhook = mongoose.model(
  "InstagramWebhook",
  instagramWebhookSchema
);

module.exports = { InstagramWebhook };
