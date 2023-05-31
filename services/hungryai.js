const { User } = require("../models/User");
const { Image } = require("../models/Image");
const { Review } = require("../models/Review");
const { Restaurant } = require("../models/Restaurant");

const recommender = require("./recommender");
const instagram = require("./instagram");
const google = require("./google");

const addUser = async (instagramId) => {
  console.log(`addUser(${instagramId})`);

  const weights = await recommender.getDefaultUserWeights();

  return instagram
    .getInstagramUsername(instagramId)
    .then(
      (instagramUsername) =>
        instagramUsername &&
        new User({
          instagramUsername: instagramUsername,
          instagramId: instagramId,
          weights: weights,
        }).save()
    )
    .catch((error) => {
      console.log(`addUser(${instagramId}) failed:\n${error}`);
      throw error;
    });
};

const addImage = async (url) => {
  console.log(`addImage(${url})`);

  return recommender
    .getImageWeights(url)
    .then((weights) =>
      new Image({
        url: url,
        weights: weights,
      }).save()
    )
    .catch((error) => {
      console.log(`addImage(${url}) failed:\n${error}`);
      throw error;
    });
};

const storyMentionSingle = async (story) => {
  console.log(`storyMentionSingle(${story})`);

  return Promise.all([
    User.findOne({ instagramId: story.instagramId }).then((user) =>
      user ? user : addUser(story.instagramId)
    ),
    Image.findOne({ url: story.url }).then((image) =>
      image ? image : addImage(story.url)
    ),
  ])
    .then(([user, image]) =>
      new Review({
        user: user,
        image: image,
        rating: story.rating,
        instagramTimestamp: story.instagramTimestamp,
      }).save()
    )
    .then(recommender.addReview)
    .catch((error) => {
      console.log(`storyMentionSingle(${story}) failed:\n${error}`);
      throw error;
    });
};

const storyMention = async (webhook) => {
  console.log(`storyMention(${webhook})`);

  return webhook
    .save()
    .then(instagram.parseWebhook)
    .then((stories) => Promise.allSettled(stories.map(storyMentionSingle)))
    .catch((error) => {
      console.log(`storyMention(${webhook}) failed:\n${error}`);
      throw error;
    });
};

const getStories = async (username) => {
  console.log(`getStories(${username})`);

  return instagram.getStories(username).catch((error) => {
    console.log(`getStories(${username}) failed:\n${error}`);
    throw error;
  });
};

const getReviews = async (username) => {
  console.log(`getReviews(${username})`);

  return User.findOne({ instagramUsername: username })
    .then((user) => (user ? Review.find({ user: user }) : []))
    .catch((error) => {
      console.log(`getReviews(${username}) failed:\n${error}`);
      throw error;
    });
};

const addGoogleImages = async (googleImages) => {
  console.log(`addGoogleImages([${googleImages.length} googleImages])`);

  return Promise.allSettled(
    googleImages.map((url) =>
      Image.findOne({ url: url }).then((image) =>
        image ? image : addImage(url)
      )
    )
  )
    .then((imagesSettled) =>
      imagesSettled.flatMap((imageSettled) =>
        imageSettled.status === "fulfilled" ? [imageSettled.value] : []
      )
    )
    .catch((error) => {
      console.log(`addGoogleImages(${googleImages}) failed:\n${error}`);
      throw error;
    });
};

const addGoogleRestaurant = async (googleRestaurant, zip) => {
  console.log(
    `addGoogleRestaurant({name: ${googleRestaurant.name}, place_id: ${googleRestaurant.place_id}})`
  );

  return google
    .getRestaurantImages(googleRestaurant)
    .then(addGoogleImages)
    .then((images) =>
      new Restaurant({
        name: googleRestaurant.name,
        images: images,
        zip: zip,
        googlePlaceId: googleRestaurant.place_id,
      }).save()
    )
    .catch((error) => {
      console.log(
        `addGoogleRestaurant({name: ${googleRestaurant.name}, place_id: ${googleRestaurant.place_id}}) failed:\n${error}`
      );
      throw error;
    });
};

const addGoogleRestaurants = async (googleRestaurants, zip) => {
  console.log(
    `addGoogleRestaurants([${googleRestaurants.length} googleRestaurants])`
  );

  return Promise.allSettled(
    googleRestaurants.map((googleRestaurant) =>
      addGoogleRestaurant(googleRestaurant, zip)
    )
  )
    .then((restaurantsSettled) =>
      restaurantsSettled.flatMap((restaurantSettled) =>
        restaurantSettled.status === "fulfilled"
          ? [restaurantSettled.value]
          : []
      )
    )
    .catch((error) => {
      console.log(
        `addGoogleRestaurants([${googleRestaurants.length} googleRestaurants]) failed:\n${error}`
      );
      throw error;
    });
};

const getRestaurants = async (zip) => {
  console.log(`getRestaurants(${zip})`);

  return Restaurant.find({ zip: zip })
    .then((restaurants) =>
      restaurants && Array.isArray(restaurants) && restaurants.length > 0
        ? restaurants
        : google
            .getRestaurants(zip)
            .then((googleRestaurants) =>
              addGoogleRestaurants(googleRestaurants, zip)
            )
    )
    .catch((error) => {
      console.log(`getRestaurants(${zip}) failed:\n${error}`);
      throw error;
    });
};

const getRecommendations = async (username, zip) => {
  console.log(`getRecommendations(${username}, ${zip})`);

  return getRestaurants(zip)
    .then((restaurants) =>
      User.findOne({ instagramUsername: username }).then((user) =>
        recommender.getRecommendations(user, restaurants)
      )
    )
    .catch((error) => {
      console.log(`getRecommendations(${username}, ${zip}) failed:\n${error}`);
      throw error;
    });
};

module.exports = {
  storyMention,
  getStories,
  getReviews,
  getRecommendations,
};
