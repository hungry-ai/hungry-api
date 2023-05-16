const axios = require("axios");

const HUNGRY_AI_ACCOUNTS = [
  process.env.HUNGRY_AI_ACCOUNT_1,
  process.env.HUNGRY_AI_ACCOUNT_2,
  process.env.HUNGRY_AI_ACCOUNT_3,
  process.env.HUNGRY_AI_ACCOUNT_4,
  process.env.HUNGRY_AI_ACCOUNT_5,
];

const ACCESS_TOKENS = [
  process.env.ACCESS_TOKEN_1,
  process.env.ACCESS_TOKEN_2,
  process.env.ACCESS_TOKEN_3,
  process.env.ACCESS_TOKEN_4,
  process.env.ACCESS_TOKEN_5,
];

const parseWebhook = async (instagramWebhook) => {
  console.log(`parseWebhook(${instagramWebhook})`);

  return instagramWebhook &&
    instagramWebhook.entry &&
    Array.isArray(instagramWebhook.entry)
    ? instagramWebhook.entry.flatMap((entry) =>
        entry && entry.messaging && Array.isArray(entry.messaging)
          ? entry.messaging.flatMap((message) =>
              message &&
              message.sender &&
              message.sender.id &&
              message.recipient &&
              message.recipient.id &&
              message.timestamp &&
              message.message &&
              message.message.attachments &&
              Array.isArray(message.message.attachments)
                ? message.message.attachments.flatMap((attachment) =>
                    attachment &&
                    attachment.type === "story_mention" &&
                    attachment.payload &&
                    attachment.payload.url
                      ? [
                          {
                            instagramUsername: message.sender.id,
                            url: attachment.payload.url,
                            rating:
                              HUNGRY_AI_ACCOUNTS.indexOf(message.recipient.id) +
                              1,
                            instagramTimestamp: message.timestamp,
                          },
                        ]
                      : []
                  )
                : []
            )
          : []
      )
    : [];
};

const parseStories = async (instagramStories) => {
  console.log(`parseStory(${instagramStories})`);

  return instagramStories &&
    instagramStories.data &&
    instagramStories.data.data &&
    Array.isArray(instagramStories.data.data)
    ? instagramStories.data.data.flatMap((data) =>
        data &&
        data.messages &&
        data.messages.data &&
        Array.isArray(data.messages.data)
          ? data.messages.data.flatMap((message) =>
              message &&
              message.story &&
              message.story.mention &&
              message.story.mention.link &&
              message.from &&
              message.from.username &&
              message.created_time
                ? [
                    {
                      username: message.from.username,
                      url: message.story.mention.link,
                      created_time: message.created_time,
                    },
                  ]
                : []
            )
          : []
      )
    : [];
};

const getAllStoriesByRating = async (rating) => {
  console.log(`getAllStoriesByRating(${rating})`);

  return axios
    .get(
      "https://graph.facebook.com/v16.0/me/conversations?platform=instagram&fields=messages{story,created_time,from}&access_token=" +
        ACCESS_TOKENS[rating - 1]
    )
    .then(parseStories)
    .catch((error) => {
      console.log(`getAllStoriesByRating(${rating}) failed:\n${error}`);
      throw error;
    });
};

const getAllStories = async () => {
  console.log(`getAllStories()`);

  return Promise.all(
    Array.from({ length: 5 }, (_, i) => getAllStoriesByRating(i + 1))
  )
    .then((stories) => stories.flat())
    .catch((error) => {
      console.log(`getAllStories() failed:\n${error}`);
      throw error;
    });
};

const getStories = async (instagramUsername) => {
  console.log(`getStories(${instagramUsername})`);

  return getAllStories()
    .then((allStories) =>
      instagramUsername
        ? allStories.filter((story) => story.username === instagramUsername)
        : allStories
    )
    .catch((error) => {
      console.log(`getStories(${instagramUsername}) failed:\n${error}`);
      throw error;
    });
};

module.exports = {
  parseWebhook: parseWebhook,
  getStories: getStories,
};
