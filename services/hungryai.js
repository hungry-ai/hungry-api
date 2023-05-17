const instagram = require("./instagram");
const recommender = require("./recommender");

const { User } = require("../models/User");
const { Review } = require("../models/Review");

const storyMentionSingle = async (webhook) => {
  console.log(`storyMentionSingle(${webhook})`);

  return Promise.allSettled([
    recommender.getOrAddUser(webhook.instagramId),
    recommender.getOrAddImage(webhook.url),
  ])
    .then(([user, image]) =>
      new Review({
        user: user.value,
        image: image.value,
        rating: webhook.rating,
        instagramTimestamp: webhook.instagramTimestamp,
      }).save()
    )
    .then(recommender.addReview)
    .catch((error) => {
      console.log(`storyMentionSingle(${webhook}) failed:\n${error}`);
      throw error;
    });
};

const storyMention = async (instagramWebhook) => {
  console.log(`storyMention(${instagramWebhook})`);

  return instagramWebhook
    .save()
    .then(instagram.parseWebhook)
    .then((webhooks) => Promise.allSettled(webhooks.map(storyMentionSingle)))
    .catch((error) => {
      console.log(`storyMention(${instagramWebhook}) failed:\n${error}`);
    });
};

const getStories = async (instagramUsername) => {
  console.log(`getStories(${instagramUsername})`);

  return instagram
    .getInstagramId(instagramUsername)
    .then((instagramId) => instagram.getStories(instagramId))
    .catch((error) => {
      console.log(`getStories(${instagramUsername}) failed:\n${error}`);
      throw error;
    });
};

const getReviews = async (instagramUsername) => {
  console.log(`getReviews(${instagramUsername})`);

  return instagram
    .getInstagramId(instagramUsername)
    .then((instagramId) => User.findOne({ instagramId: instagramId }))
    .then((user) => (user ? Review.find({ user: user }) : []))
    .catch((error) => {
      console.log(`getReviews(${instagramUsername}) failed:\n${error}`);
      return [];
    });
};

const getRestaurants = async (instagramUsername, zip) => {
  console.log(`getRestaurants(${instagramUsername}, ${zip})`);

  return instagram
    .getInstagramId(instagramUsername)
    .then((instagramId) => User.findOne({ instagramId: instagramId }))
    .then((user) => recommender.getRecommendations(user, zip))
    .catch((error) => {
      console.log(
        `getRestaurants(${instagramUsername}, ${zip}) failed:\n${error}`
      );
      return [];
    });
};

module.exports = {
  storyMention: storyMention,
  getStories: getStories,
  getReviews: getReviews,
  getRestaurants: getRestaurants,
};
