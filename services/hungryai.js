const recommender = require("./recommender");
const instagram = require("./instagram");
const google = require("./google");

const User = require("../models/User");
const Image = require("../models/Image");
const Review = require("../models/Review");

const addUser = async (instagramUsername) => {
  console.log(`addUser(${instagramUsername})`);

  return new User({ instagramUsername: instagramUsername })
    .save()
    .catch((error) => {
      console.log(`addUser(${instagramUsername}) failed:\n${error}`);
      throw error;
    });
};

const getUser = async (instagramUsername) => {
  console.log(`getUser(${instagramUsername})`);

  return User.findOne({ instagramUsername: instagramUsername }).catch(
    (error) => {
      console.log(`getUser(${instagramUsername}) failed:\n${error}`);
      throw error;
    }
  );
};

const getOrAddUser = async (instagramUsername) => {
  console.log(`getOrAddUser(${instagramUsername})`);

  return getUser(instagramUsername)
    .then((user) => (user ? user : addUser(instagramUsername)))
    .catch((error) => {
      console.log(`getOrAddUser(${instagramUsername}) failed:\n${error}`);
    });
};

const addImage = async (url) => {
  console.log(`addImage(${url})`);

  return new Image({ url: url })
    .save()
    .then((image) => google.getImageTags(image).then(() => image))
    .catch((error) => {
      console.log(`addImage(${url}) failed:\n${error}`);
      throw error;
    });
};

const getImage = async (url) => {
  console.log(`getImage(${url})`);

  return Image.findOne({ url: url }).catch((error) => {
    console.log(`getImage(${url}) failed:\n${error}`);
    throw error;
  });
};

const getOrAddImage = async (url) => {
  console.log(`getOrAddImage(${url})`);

  return getImage(url)
    .then((image) => (image ? image : addImage(url)))
    .catch((error) => {
      console.log(`getOrAddImage(${url}) failed:\n${error}`);
      throw error;
    });
};

const addReview = async (user, image, rating, timestamp) => {
  console.log(`addReview(${user}, ${image}, ${rating}, ${timestamp})`);

  return new Review({
    user: user,
    image: image,
    rating: rating,
    timestamp: timestamp,
  })
    .save()
    .then(recommender.addReview)
    .catch((error) => {
      console.log(
        `addReview(${user}, ${image}, ${rating}, ${timestamp}) failed:\n${error}`
      );
      throw error;
    });
};

const storyMentionSingle = async (message) => {
  console.log(`storyMentionSingle(${message})`);

  return Promise.all([
    getOrAddUser(message.username),
    getOrAddImage(message.url),
  ])
    .then(([user, image]) =>
      addReview(user, image, message.rating, message.timestamp)
    )
    .catch((error) => {
      console.log(`storyMentionSingle(${message}) failed:\n${error}`);
      throw error;
    });
};

const storyMention = async (webhook) => {
  console.log(`storyMention(${webhook})`);

  return instagram
    .parseWebhook(webhook)
    .then((messages) => Promise.allSettled(messages.map(storyMentionSingle)))
    .catch((error) => {
      console.log(`storyMention(${webhook}) failed:\n${error}`);
      throw error;
    });
};

const getStories = async (instagramUsername) => {
  console.log(`getStories(${instagramUsername})`);

  return instagram.getStories(instagramUsername).catch((error) => {
    console.log(`getStories(${instagramUsername}) failed:\n${error}`);
    throw error;
  });
};

const getReviews = async (instagramUsername) => {
  console.log(`getReviews(${instagramUsername})`);

  return getUser(instagramUsername)
    .then((user) => Review.find({ user: user }))
    .catch((error) => {
      console.log(`getReviews(${instagramUsername}) failed:\n${error}`);
      throw error;
    });
};

const getRestaurants = async (instagramUsername, zip) => {
  console.log(`getRestaurants(${instagramUsername}, ${zip})`);

  return getUser(instagramUsername)
    .then((user) => recommender.getRecommendations(user, zip))
    .then((restaurants) => Promise.all(restaurants.map(addRestaurantImages)))
    .catch((error) => {
      console.log(
        `getRestaurants(${instagramUsername}, ${zip}) failed:\n${error}`
      );
      throw error;
    });
};

module.exports = {
  storyMention: storyMention,
  getStories: getStories,
  getReviews: getReviews,
  getRestaurants: getRestaurants,
};
