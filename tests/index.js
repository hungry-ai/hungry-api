const hungryai = require("../services/hungryai");
const google = require("../services/google");
const instagram = require("../services/instagram");
const mongo = require("../services/mongo");
const recommender = require("../services/recommender");

const testCody = async () => {
  webhook = {
    object: "instagram",
    entry: [
      {
        id: "<IGID>",
        time: 1569262486134,
        messaging: [
          {
            sender: {
              id: "balconycarspotting",
            },
            recipient: {
              id: "i.rate.1",
            },
            timestamp: 1569262485349,
            message: {
              mid: "<MESSAGE_ID>",
              attachments: [
                {
                  type: "story_mention",
                  payload: {
                    url: "https://i5.walmartimages.com/asr/9f8b7456-81d0-4dc2-b422-97cf63077762.0ddba51bbf14a5029ce82f5fce878dee.jpeg?odnHeight=612&odnWidth=612&odnBg=FFFFFF",
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  };

  await hungryai.storyMention(webhook).then(console.log);
  await hungryai.getStories(undefined).then(console.log);
  await hungryai.getStories("balconycarspotting").then(console.log);
  await hungryai.getReviews(undefined).then(console.log);
  await hungryai.getReviews("balconycarspotting").then(console.log);
  await hungryai.getRestaurants(undefined, undefined).then(console.log);
  await hungryai.getRestaurants(undefined, "95113").then(console.log);
  await hungryai
    .getRestaurants("balconycarspotting", undefined)
    .then(console.log);
  await hungryai
    .getRestaurants("balconycarspotting", "95113")
    .then(console.log);
};

const main = async () => {
  testCody();
};

module.exports = { main: main };
