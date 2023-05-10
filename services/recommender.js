const google = require("./google");

const ImageWeights = require("../models/ImageWeights");
const TagWeights = require("../models/TagWeights");
const UserWeights = require("../models/UserWeights");

// TODO
const addReview = async (review) => {
  console.log(`addReview(${review})`);

  // TODO: update user weights
};

// TODO
const getDefaultUserWeights = async () => {
  console.log(`getDefaultUserWeights()`);

  // TODO: compute average of all user weights
};

const getUserWeights = async (user) => {
  console.log(`getUserWeights(${user})`);

  return UserWeights.findOne({ user: user })
    .then((userWeights) =>
      userWeights ? userWeights : getDefaultUserWeights()
    )
    .catch((error) => {
      console.log(`getUserWeights(${user}) failed:\n${error}`);
      throw error;
    });
};

const getTagWeights = async (tag) => {
  console.log(`getTagWeights(${tag})`);

  return TagWeights.findOne({ tag: tag }).catch((error) => {
    console.log(`getTagWeights(${tag}) failed:\n${error}`);
    throw error;
  });
};

const weightedVectorSum = async (vectors, weights) => {
  console.log(`weightedVectorSum(${vectors}, ${weights})`);

  const weightSum = weights.reduce((x, y) => x + y);

  return vectors
    .map((vector, i) => vector.map((v) => (v * weights[i]) / weightSum))
    .reduce((x, y) =>
      Array.from({ length: x.length }).map((_, i) => x[i] + y[i])
    );
};

const addImageWeights = async (image) => {
  console.log(`getImageWeights(${image})`);

  return google
    .getImageTags(image)
    .then((imageTags) =>
      Promise.all(imageTags.tags.map(getTagWeights)).then((tagWeights) =>
        weightedVectorSum(tagWeights, imageTags.weights)
      )
    )
    .then((weights) =>
      new ImageWeights({ image: image, weights: weights }).save()
    )
    .catch((error) => {
      console.log(`getImageWeights(${image})`);
      throw error;
    });
};

const getImageWeights = async (image) => {
  console.log(`getImageWeights(${image})`);

  return ImageWeights.find({ image: image })
    .then((imageWeights) =>
      imageWeights ? imageWeights : addImageWeights(image)
    )
    .catch((error) => {
      console.log(`getImageWeights(${image})`);
      throw error;
    });
};

const getImagePrediction = async (userWeights, image) => {
  console.log(`getImagePrediction(${userWeights}, ${image})`);

  return getImageWeights(image)
    .then((imageWeights) =>
      userWeights.map((u, i) => u * imageWeights[i]).reduce((x, y) => x + y)
    )
    .catch((error) => {
      console.log(
        `getImagePrediction(${userWeights}, ${image}) failed:\n${error}`
      );
      throw error;
    });
};

const addRestaurantImages = async (restaurant) => {
  console.log(`addRestaurantImages(${restaurant})`);

  return google
    .getRestaurantImages(restaurant)
    .then((images) => ({ restaurant: restaurant, images: images }))
    .catch((error) => {
      console.log(`addRestaurantImages(${restaurant}) failed:\n${error}`);
      throw error;
    });
};

const getRestaurants = async (zip) => {
  console.log(`getRestaurants(${zip})`);

  return google
    .getRestaurants(zip)
    .then((restaurants) => Promise.all(restaurants.map(addRestaurantImages)))
    .catch((error) => {
      console.log(`getRestaurants(${zip})`);
      throw error;
    });
};

const addRestaurantPrediction = async (userWeights, restaurant) => {
  console.log(`addRestaurantPrediction(${userWeights}, ${restaurant})`);

  return Promise.all(
    restaurant.images.map((image) => getImagePrediction(userWeights, image))
  )
    .then((imagePredictions) => Math.max(imagePredictions)) // TODO: restaurant rating = max restaurant image ratings?
    .then((rating) => ({ restaurant: restaurant, rating: rating }))
    .catch((error) => {
      console.log(
        `addRestaurantPrediction(${userWeights}, ${restaurant}) failed:\n${error}`
      );
    });
};

const getRecommendations = async (user, zip) => {
  console.log(`getRecommendations(${user}, ${zip})`);

  return getUserWeights(user)
    .then((userWeights) =>
      getRestaurants(zip).then((restaurants) =>
        Promise.all(
          restaurants.map((restaurant) =>
            addRestaurantPrediction(userWeights, restaurant)
          )
        )
      )
    )
    .then((restaurantPredictions) => {
      restaurantPredictions.sort();
      restaurantPredictions.reverse();
      return restaurantPredictions.map(([rating, restaurant]) => restaurant);
    })
    .catch((error) => {
      console.log(`getRecommendations(${user}, ${zip}) failed:\n${error}`);
      throw error;
    });
};

module.exports = {
  addReview: addReview,
  getRecommendations: getRecommendations,
};
