const axios = require("axios");

const HUNGRY_AI_ACCOUNTS = [
  process.env.HUNGRY_AI_ACCOUNT_1,
  process.env.HUNGRY_AI_ACCOUNT_2,
  process.env.HUNGRY_AI_ACCOUNT_3,
  process.env.HUNGRY_AI_ACCOUNT_4,
  process.env.HUNGRY_AI_ACCOUNT_5,
];

const HUNGRY_AI_IDS = [
  process.env.HUNGRY_AI_ID_1,
  process.env.HUNGRY_AI_ID_2,
  process.env.HUNGRY_AI_ID_3,
  process.env.HUNGRY_AI_ID_4,
  process.env.HUNGRY_AI_ID_5,
];

const ACCESS_TOKENS = [
  process.env.ACCESS_TOKEN_1,
  process.env.ACCESS_TOKEN_2,
  process.env.ACCESS_TOKEN_3,
  process.env.ACCESS_TOKEN_4,
  process.env.ACCESS_TOKEN_5,
];

const parseWebhook = async (webhook) => {
  console.log(`instagram.parseWebhook(${webhook})`);

  return webhook && webhook.entry && Array.isArray(webhook.entry)
    ? webhook.entry.flatMap((entry) =>
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
                            instagramId: message.sender.id,
                            url: attachment.payload.url,
                            rating:
                              HUNGRY_AI_IDS.indexOf(message.recipient.id) + 1,
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

const getInstagramUsernameByRating = async (id, rating) => {
  console.log(`instagram.getInstagramUsernameByRating(${id}, ${rating})`);

  return axios
    .get(
      "https://graph.facebook.com/v16.0/me/conversations?platform=instagram&fields=participants&access_token=" +
        ACCESS_TOKENS[rating - 1]
    )
    .then((conversations) =>
      conversations &&
      conversations.data &&
      conversations.data.data &&
      Array.isArray(conversations.data.data)
        ? conversations.data.data.flatMap((conversation) =>
            conversation &&
            conversation.participants &&
            conversation.participants.data &&
            Array.isArray(conversation.participants.data)
              ? conversation.participants.data.flatMap((participant) =>
                  participant &&
                  participant.username &&
                  participant.id &&
                  participant.id === id
                    ? [participant.username]
                    : []
                )
              : []
          )
        : []
    )
    .then((usernames) => usernames[0]);
};

const getInstagramUsername = async (id) => {
  console.log(`instagram.getInstagramUsername(${id})`);

  return Promise.any(
    Array.from({ length: 5 }, (_, i) => getInstagramUsernameByRating(id, i + 1))
  ).catch((error) => {
    console.log(`instagram.getInstagramUsername(${id}) failed:\n${error}`);
    throw error;
  });
};

const parseStories = async (instagramStories) => {
  console.log(`instagram.parseStory(${instagramStories})`);

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
                      instagramUsername: message.from.username,
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
  console.log(`instagram.getAllStoriesByRating(${rating})`);

  return axios
    .get(
      "https://graph.facebook.com/v16.0/me/conversations?platform=instagram&fields=messages{story,created_time,from}&access_token=" +
        ACCESS_TOKENS[rating - 1]
    )
    .then(parseStories)
    .then((stories) => stories.map((story) => ({ ...story, rating: rating })))
    .catch((error) => {
      console.log(
        `instagram.getAllStoriesByRating(${rating}) failed:\n${error}`
      );
      throw error;
    });
};

const getAllStories = async () => {
  console.log(`instagram.getAllStories()`);

  return Promise.all(
    Array.from({ length: 5 }, (_, i) => getAllStoriesByRating(i + 1))
  )
    .then((stories) => stories.flat())
    .catch((error) => {
      console.log(`instagram.getAllStories() failed:\n${error}`);
      throw error;
    });
};

const getStories = async (username) => {
  console.log(`instagram.getStories(${username})`);

  return getAllStories()
    .then((allStories) =>
      username
        ? allStories.filter((story) => story.instagramUsername === username)
        : allStories
    )
    .catch((error) => {
      console.log(`instagram.getStories(${username}) failed:\n${error}`);
      throw error;
    });
};

module.exports = {
  parseWebhook,
  getInstagramUsername,
  getStories,
};
