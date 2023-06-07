const { InstagramWebhook } = require("../models/Webhook");
const instagram = require("../services/instagram");

const testJSON = {
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

const testWebhook = new InstagramWebhook(testJSON);
const expectedJSON = [
  {
    instagramId: "balconycarspotting",
    instagramTimestamp: 1569262485349,
    rating: 0,
    url: "https://i5.walmartimages.com/asr/9f8b7456-81d0-4dc2-b422-97cf63077762.0ddba51bbf14a5029ce82f5fce878dee.jpeg?odnHeight=612&odnWidth=612&odnBg=FFFFFF",
  },
];
test("testing instagramWebhook", () => {
  return instagram.parseWebhook(testWebhook).then((parsed) => {
    expect(parsed).toStrictEqual(expectedJSON);
  });
});
