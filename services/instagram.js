const axios = require("axios");

const InstagramStoryMention = require("../models/InstagramStoryMention");

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

const PAGE_IDS = [
  process.env.PAGE_ID_1,
  process.env.PAGE_ID_2,
  process.env.PAGE_ID_3,
  process.env.PAGE_ID_4,
  process.env.PAGE_ID_5,
];

const parseWebhookAttachment = async (attachment) => {
  if (
    attachment &&
    attachment.type &&
    attachment.type === "story_mention" &&
    attachment.payload &&
    attachment.payload.url
  )
    return [{ url: attachment.payload.url }];
  else {
    console.log(`poorly formatted webhook attachment:\n${attachment}`);
    return [];
  }
};

const parseWebhookMessage = async (message) => {
  if (
    message &&
    message.sender &&
    message.sender.id &&
    message.recipient &&
    message.recipient.id &&
    HUNGRY_AI_ACCOUNTS.includes(message.recipient.id) &&
    message.timestamp &&
    message.message &&
    message.message.attachments &&
    Array.isArray(message.message.attachments)
  ) {
    const username = message.sender.id;
    const rating = HUNGRY_AI_ACCOUNTS.indexOf(message.recipient.id) + 1;
    const timestamp = message.timestamp;

    return Promise.all(message.message.attachments.map(parseWebhookAttachment))
      .then((attachments) =>
        attachments.flat().map((attachment) => ({
          ...attachment,
          username: username,
          rating: rating,
          timestamp: timestamp,
        }))
      )
      .catch((error) => {
        console.log(
          `instagram.parseWebhookMessage(${message}) failed:\n${error}`
        );
        throw error;
      });
  } else {
    console.log(`poorly formatted webhook message:\n${message}`);
    return [];
  }
};

const parseWebhookEntry = async (entry) => {
  if (entry && entry.messaging && Array.isArray(entry.messaging))
    return Promise.all(entry.messaging.map(parseWebhookMessage))
      .then((messages) => messages.flat())
      .catch((error) => {
        console.log(`instagram.parseWebhookEntry(${entry}) failed:\n${error}`);
        throw error;
      });
  else {
    console.log(`poorly formatted webhook entry:\n${entry}`);
    return [];
  }
};

// TODO: test with actual instagram hooks
const parseWebhook = async (webhook) => {
  if (webhook.entry && Array.isArray(webhook.entry))
    return Promise.all(webhook.entry.map(parseWebhookEntry))
      .then((messages) => messages.flat())
      .catch((error) => {
        console.log(`instagram.parseWebhook(${webhook}) failed:\n${error}`);
        throw error;
      });
  else {
    console.log(`poorly formatted webhook:\n${webhook}`);
    return [];
  }
};

const addStoryMention = (webhook) => {
  console.log(`addStoryMention(${webhook})`);

  return new InstagramStoryMention(webhook).save().catch((error) => {
    console.log(`addStoryMention(${webhook}) failed:\n${error}`);
    throw error;
  });
};

const getStoryMention = async (webhook) => {
  console.log(`getStoryMention(${webhook})`);

  return webhook
    .save()
    .then(parseWebhook)
    .catch((error) => {
      console.log(`getStoryMention(${webhook}) failed:\n${webhook}`);
      throw error;
    });
};

const parseStoryMessage = async (message) => {
  //console.log(`instagram.parseStoryMessage(${message})`);

  if (
    message &&
    message.story &&
    message.story.mention &&
    message.story.mention.link &&
    message.from &&
    message.from.username &&
    message.created_time
  )
    return [
      {
        timestamp: message.created_time,
        url: message.story.mention.link,
        username: message.from.username,
      },
    ];
  else {
    //console.log(`poorly formatted story message:\n${message}`);
    return [];
  }
};

const parseStoryData = async (data) => {
  //console.log(`instagram.parseStoryData(${data})`);

  if (
    data &&
    data.messages &&
    data.messages.data &&
    Array.isArray(data.messages.data)
  )
    return Promise.all(data.messages.data.map(parseStoryMessage))
      .then((stories) => stories.flat())
      .catch((error) => {
        console.log(`instagram.parseStoryData(${data}) failed:\n${error}`);
        throw error;
      });
  else {
    console.log(`poorly formatted story data:\n${data}`);
    return [];
  }
};

const parseStoryResponse = async (res) => {
  console.log(`instagram.parseStoryResponse(${res})`);

  if (res && res.data && res.data.data && Array.isArray(res.data.data))
    return Promise.all(res.data.data.map(parseStoryData))
      .then((stories) => stories.flat())
      .catch((error) => {
        console.log(`instagram.parseStoryResponse(${res}) failed:\n${error}`);
        return [];
      });
  else {
    console.log(`poorly formatted story response:\n${res}`);
    return [];
  }
};

const getAllStoriesByRating = async (rating) => {
  console.log(`instagram.getAllStoriesByRating(${rating})`);

  return axios
    .get(
      "https://graph.facebook.com/v16.0/me/conversations?platform=instagram&fields=messages{story,created_time,from}&access_token=" +
        ACCESS_TOKENS[rating - 1]
    )
    .then(parseStoryResponse)
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
    .then((allStories) =>
      allStories.flatMap((stories, i) =>
        stories.map((story) => ({
          ...story,
          rating: i + 1,
        }))
      )
    )
    .catch((error) => {
      console.log(`instagram.getAllStories() failed:\n${error}`);
      throw error;
    });
};

const getStories = async (instagramUsername) => {
  console.log(`instagram.getStories(${instagramUsername})`);

  return getAllStories()
    .then((allStories) =>
      instagramUsername
        ? allStories.filter((story) => story.username === instagramUsername)
        : allStories
    )
    .catch((error) => {
      console.log(
        `instagram.getStories(${instagramUsername}) failed:\n${error}`
      );
      throw error;
    });
};

module.exports = {
  getStoryMention: getStoryMention,
  getStories: getStories,
};
