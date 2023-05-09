const mongo = require("./mongo");
const google = require("./google");
const instagram = require("./instagram");
const recommender = require("./recommender");

const addUser = async (instagramUsername) => {
  console.log(`addUser(${instagramUsername})`);

  return mongo
    .addUser(instagramUsername)
    .then((user) => recommender.addUser(user).then(() => user))
    .catch((error) => {
      console.log(`addUser(${instagramUsername}) failed:\n${error}`);
      throw error;
    });
};

const getUser = async (instagramUsername) => {
  console.log(`getUser(${instagramUsername})`);

  return mongo
    .getUser(instagramUsername)
    .then((user) => (user ? user : addUser(instagramUsername)))
    .catch((error) => {
      console.log(`getUser(${instagramUsername}) failed:\n${error}`);
      throw error;
    });
};

const addImageTags = async (image) => {
  console.log(`addImageTags(${image})`);

  return google
    .getImageTags(image)
    .then(mongo.addImageTags)
    .catch((error) => {
      console.log(`addImageTags(${image}) failed:\n${error}`);
      throw error;
    });
};

const addImage = async (url) => {
  console.log(`addImage(${url})`);

  return mongo
    .addImage(url)
    .then((image) => addImageTags(image).then(() => image))
    .catch((error) => {
      console.log(`addImage(${url}) failed:\n${error}`);
      throw error;
    });
};

const getImage = async (url) => {
  console.log(`getImage(${url})`);

  return mongo
    .getImage(url)
    .then((image) => (image ? image : addImage(url)))
    .catch((error) => {
      console.log(`getImage(${url}) failed:\n${error}`);
      throw error;
    });
};

const addReview = async (user, image, rating, timestamp) => {
  console.log(`addReview(${user}, ${image}, ${rating}, ${timestamp})`);

  return mongo
    .addReview(user, image, rating, timestamp)
    .then((review) => recommender.addReview(review).then(() => review))
    .catch((error) => {
      console.log(
        `addReview(${user}, ${image}, ${rating}, ${timestamp}) failed:\n${error}`
      );
      throw error;
    });
};

const storyMentionSingle = async (message) => {
  console.log(`storyMentionSingle(${message})`);

  return Promise.allSettled([getUser(message.username), getImage(message.url)])
    .then(([userPromise, imagePromise]) =>
      addReview(
        userPromise.value,
        imagePromise.value,
        message.rating,
        message.timestamp
      )
    )
    .catch((error) => {
      console.log(`storyMentionSingle(${message}) failed:\n${error}`);
    });
};

const storyMention = async (webhook) => {
  console.log(`storyMention(${webhook})`);

  return instagram
    .parseWebhook(webhook)
    .then((messages) => messages.map(storyMentionSingle))
    .catch((error) => {
      console.log(`storyMention(${webhook}) failed:\n${error}`);
    });
};

const getStories = async (instagramUsername) => {
  console.log(`getStories(${instagramUsername})`);

  return instagram.getStories(instagramUsername).catch((error) => {
    console.log(`getStories(${instagramUsername}) failed:\n${error}`);
    return [];
  });
};

const getReviews = async (instagramUsername) => {
  console.log(`getReviews(${instagramUsername})`);

  return mongo
    .getUser(instagramUsername)
    .then((user) => (user ? mongo.getReviews(user) : []))
    .catch((error) => {
      console.log(`getReviews(${instagramUsername}) failed:\n${error}`);
      return [];
    });
};

const getRestaurantImages = async (restaurant) => {};

const getRestaurants = async (instagramUsername, zip) => {
  console.log(`getRestaurants(${instagramUsername}, ${zip})`);

  return mongo
    .getUser(instagramUsername)
    .then((user) => recommender.getRecommendations(user, zip))
    .then((restaurants) => restaurants.map(getRestaurantImages))
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
