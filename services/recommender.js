const mongo = require("./mongo");
const google = require("./google");

/*
// TODO
const addImageWeights = async (image) => {
  console.log(`recommender.addImageWeights(${image})`);
};

const getImageWeights = async (image) => {
  console.log(`recommender.getImageWeights(${image})`);

  return mongo
    .getImageWeights(image)
    .then((imageWeights) =>
      imageWeights ? imageWeights : addImageWeights(image)
    )
    .catch((error) => {
      console.log(`recommender.getImageWeights(${image}) failed:\n${error}`);
      throw error;
    });
};

// TODO
const addUserWeights = async (user) => {
  console.log(`recommender.addUserWeights(${user})`);
};

const getUserWeights = async (user) => {
  console.log(`recommender.getUserWeights(${user})`);

  return mongo
    .getUserWeights(user)
    .then((userWeights) => (userWeights ? userWeights : addUserWeights(user)))
    .catch((error) => {
      console.log(`recommender.getUserWeights(${user}) failed:\n${error}`);
      throw error;
    });
};

// TODO
const updateUserWeights = async (userWeights, imageWeights) => {
  console.log(`recommender.updateUserWeights(${userWeights}, ${imageWeights})`);
};

const addReview = async (review) => {
  console.log(`recommender.addReview(${review})`);

  return Promise.all([
    getUserWeights(user),
    getImageTags(image).then(getImageWeights),
  ])
    .then(([userWeightsPromise, imageWeightsPromise]) =>
      updateUserWeights(userWeightsPromise.value, imageWeightsPromise.value)
    )
    .catch((error) => {
      console.log(`addReview(${reivew}) failed:\n${error}`);
      return error;
    });
};

const predictRating = async (user, image) => {
  console.log(`recommender.predictRating(${user}, ${image})`);

  return Promise.all([mongo.getUserWeights(user), mongo.getImageWeights(image)])
    .then(([userWeightsPromise, imageWeightsPromise]) => {
      const userWeights = userWeightsPromise.value;
      const imageWeights = imageWeightsPromise.value;
      const rating = userWeights
        .map((u, i) => u * imageWeights[i])
        .reduce((x, y) => x + y);
      return Math.max(0, rating); // TODO: remove the max and add -infinity ratings
    })
    .catch((error) => {
      console.log(
        `recommender.predictRating(${user}, ${image}) failed:\n${error}`
      );
      throw error;
    });
};

const predictRestaurantRating = async (user, restaurant) => {
  console.log(`recommender.predictRestaurantRating(${user}, ${restaurant})`);

  return google
    .getRestaurantImages(restaurant)
    .then(async (images) =>
      Promise.all(images.map((image) => predictRating(user, image)))
        .then((ratings) => {
          return ratings.length > 0
            ? ratings.reduce((x, y) => x + y) / ratings.length
            : 0;
        })
        .then((rating) => ({ images: images, rating: rating }))
    )
    .catch((error) => {
      console.log(
        `recommender.predictRestaurantRating(${user}, ${restaurant}) failed:\n${error}`
      );

      return { images: [], rating: 0 };
    });
};

const getRecommendations = async (user, zip) => {
  console.log(`recommender.getRecommendations(${user}, ${zip})`);

  return google
    .getRestaurants(zip)
    .then((restaurants) =>
      Promise.all(
        restaurants.map((restaurant) =>
          predictRestaurantRating(user, restaurant)
        )
      ).then((ratings) =>
        restaurants.map((restaurant, i) => [ratings[i], restaurant])
      )
    )
    .then((restaurantRatings) => {
      restaurantRatings.sort();
      restaurantRatings.reverse();
      return restaurantRatings.map(([rating, restaurant]) => restaurant);
    })
    .catch((error) => {
      console.log(
        `recommender.getRecommendations(${user}, ${zip}) failed:\n${error}`
      );
      throw error;
    });
};

module.exports = {
  addReview: addReview,
  getRecommendations: getRecommendations,
};
*/

const addReview = () => {};

const getRecommendations = () => {};

module.exports = {
  addReview: addReview,
  getRecommendations: getRecommendations,
};
