const { Matrix } = require("ml-matrix");

const { DefaultUserWeights } = require("../models/User");
const { Tag } = require("../models/Tag");

const google = require("./google");

// TODO: delete
let DEFAULT_USER_WEIGHTS = new DefaultUserWeights({
  weights: Array.from({ length: 10 }, () => 69),
  XTX_flat: Array.from({ length: 10 * 10 }, () => 69),
  XTy: Array.from({ length: 10 }, () => 69),
  stale: false,
});

let D = DEFAULT_USER_WEIGHTS.weights.length;

const loadConfig = async () => {
  console.log(`recommender.loadConfig()`);

  DefaultUserWeights.findOne()
    .then((weights) => {
      if (weights) {
        DEFAULT_USER_WEIGHTS = weights;
        D = weights.weights.length;
      }
    })
    .catch((error) => {
      console.log(`recommender.loadConfig() failed:\n${error}`);
      throw error;
    });
};

const getDefaultUserWeights = async () => {
  console.log(`recommender.getDefaultUserWeights()`);

  return {
    weights: DEFAULT_USER_WEIGHTS.weights.map(parseFloat),
    XTX_flat: DEFAULT_USER_WEIGHTS.XTX_flat.map(parseFloat),
    XTy: DEFAULT_USER_WEIGHTS.XTy.map(parseFloat),
    stale: DEFAULT_USER_WEIGHTS.stale,
  };
};

const getTagWeights = async (googleTag) => {
  console.log(`recommender.getTagWeights(${googleTag})`);

  // TODO: delete
  return Array.from({ length: D }, () => 420);

  return Tag.findOne({ name: googleTag.description })
    .then((tag) => (tag ? tag.weights : []))
    .catch((error) => {
      console.log(`recommender.getTagWeights(${googleTag}) failed:\n${error}`);
      throw error;
    });
};

const getImageWeights = async (url) => {
  console.log(`recommender.getImageWeights(${url})`);

  return google
    .getImageTags(url)
    .then((googleImageTags) =>
      Promise.all(
        googleImageTags.tags.map((googleTag) =>
          getTagWeights(googleTag).then((tagWeights) =>
            tagWeights
              ? [[tagWeights.map(parseFloat), parseFloat(googleTag.score)]]
              : []
          )
        )
      )
    )
    .then((tagWeights) => tagWeights.flat())
    .then((tagWeights) => {
      const totalWeight = tagWeights
        .map(([_, weight]) => weight)
        .reduce((x, y) => x + y, 0);

      return totalWeight > 0
        ? Array.from(
            { length: D },
            (_, i) =>
              tagWeights
                .map(([tag, weight]) => tag[i] * weight)
                .reduce((x, y) => x + y, 0) / totalWeight
          )
        : Array.from({ length: D }, () => 0);
    })
    .catch((error) => {
      console.log(`recommender.getImageWeights(${url}) failed:\n${error}`);
      throw error;
    });
};

const addReview = async (review) => {
  console.log(`recommender.addReview(${review})`);

  const imageWeights = review.image.weights.map(parseFloat);

  review.user.weights.XTX_flat = review.user.weights.XTX_flat.map(
    (x, i) =>
      parseFloat(x) +
      review.rating * imageWeights[Math.floor(i / D)] * imageWeights[i % D]
  );
  review.user.weights.XTy = review.user.weights.XTy.map(
    (y, i) => parseFloat(y) + review.rating * imageWeights[i]
  );
  review.user.weights.stale = true;

  return review.save().catch((error) => {
    console.log(`recommender.addReview(${review}) failed:\n${error}`);
    throw error;
  });
};

const getImagePrediction = async (imageWeights, userWeights) => {
  console.log(
    `recommender.getImagePrediction(${imageWeights}, ${userWeights})`
  );

  // TODO: this is a big hack
  let isDefault = userWeights.length === DEFAULT_USER_WEIGHTS.weights.length;
  for (var i = 0; i < userWeights.length; ++i)
    isDefault &= userWeights[i] === DEFAULT_USER_WEIGHTS.weights[i];
  if (isDefault) return 3;

  return imageWeights
    .map((x, i) => parseFloat(x) * userWeights[i])
    .reduce((x, y) => x + y, 0);
};

const getRestaurantPrediction = async (userWeights, restaurant) => {
  console.log(
    `recommender.getRestaurantPrediction(${userWeights}, ${restaurant})`
  );

  return Promise.all(
    restaurant.images.map((image) =>
      getImagePrediction(image.weights, userWeights)
    )
  )
    .then((imagePredictions) =>
      imagePredictions.length > 0
        ? imagePredictions.reduce((x, y) => x + y, 0) / imagePredictions.length
        : 0
    )
    .catch((error) => {
      console.log(
        `recommender.getRestaurantPrediction(${userWeights}, ${restaurant})`
      );
      throw error;
    });
};

const getUserWeights = async (user) => {
  console.log(`recommender.getUserWeights(${user})`);

  if (!user.weights.stale) return user.weights.weights.map(parseFloat);

  try {
    const A = new Matrix(
      Array.from({ length: D }, (_, i) =>
        user.weights.XTX_flat.slice(i * D, (i + 1) * D).map(parseFloat)
      )
    );
    const b = Matrix.columnVector(user.weights.XTy.map(parseFloat));

    const x = solve(A, b).to1DArray();

    user.weights.weights = x;
    user.weights.stale = false;

    return user.weights
      .save()
      .then(() => x)
      .catch((error) => {
        console.log(`recommender.getUserWeights(${user}) failed:\n${error}`);
        throw error;
      });
  } catch (error) {
    console.log(`recommender.getUserWeights(${user}) failed:\n${error}`);
    throw error;
  }
};

const getRecommendations = async (user, restaurants) => {
  console.log(`recommender.getRecommendations(${user}, ${restaurants})`);

  return getUserWeights(user)
    .then((userWeights) =>
      Promise.all(
        restaurants.map((restaurant) =>
          getRestaurantPrediction(userWeights, restaurant).then(
            (prediction) => [prediction, restaurant]
          )
        )
      )
    )
    .then((restaurantPredictions) => {
      restaurantPredictions.sort();
      restaurantPredictions.reverse();
      return restaurantPredictions.map(([_, restaurant]) => restaurant);
    })
    .catch((error) => {
      console.log(
        `recommender.getRecommendations(${user}, ${restaurants}) failed:\n${error}`
      );
      throw error;
    });
};

module.exports = {
  loadConfig,
  getDefaultUserWeights,
  getImageWeights,
  addReview,
  getRecommendations,
};
