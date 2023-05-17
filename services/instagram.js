const axios = require("axios");
const { User } = require("../models/User");

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
                            instagramId: message.sender.id,
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
              message.from.id &&
              message.created_time
                ? [
                    {
                      id: message.from.id,
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

const getStories = async (instagramId) => {
  console.log(`getStories(${instagramId})`);

  return getAllStories()
    .then((allStories) =>
      instagramId
        ? allStories.filter((story) => story.id === instagramId)
        : allStories
    )
    .then((stories) => {
      if (instagramId && stories.length) {
        User.findOneAndUpdate(
          { instagramId: stories[0].id },
          { instagramId: instagramId }
        );
      }
      return stories;
    })
    .catch((error) => {
      console.log(`getStories(${instagramId}) failed:\n${error}`);
      throw error;
    });
};

// TODO
const getInstagramIdByRating = async (instagramUsername, rating) => {
  console.log(`getInstagramIdByRating(${instagramUsername}, ${rating})`);

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
                  participant.username === instagramUsername &&
                  participant.id
                    ? [participant.id]
                    : []
                )
              : []
          )
        : []
    )
    .then((ids) => ids[0]);
};

const getInstagramId = async (instagramUsername) => {
  console.log(`getInstagramId(${instagramUsername})`);

  return User.findOne({ instagramUsername: instagramUsername })
    .then((user) =>
      user
        ? user.instagramId
        : Promise.any(
            Array.from({ length: 5 }, (_, i) =>
              getInstagramIdByRating(instagramUsername, i + 1)
            )
          ).then((instagramId) => {
            User.findOneAndUpdate(
              { instagramId: instagramId },
              { instagramUsername: instagramUsername }
            );
            return instagramId;
          })
    )
    .catch((error) => {
      console.log(`getInstagramId(${instagramUsername}) failed:\n${error}`);
      throw error;
    });
};

module.exports = {
  parseWebhook: parseWebhook,
  getStories: getStories,
  getInstagramId: getInstagramId,
};
