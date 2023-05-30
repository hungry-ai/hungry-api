const { Matrix } = require("ml-matrix");

const { DefaultUserWeights } = require("../models/User");
const { Tag } = require("../models/Tag");

const google = require("./google");

const DEFAULT_USER_WEIGHTS = DefaultUserWeights.findOne()
  .then((weights) =>
    weights
      ? weights
      : new DefaultUserWeights({
          weights: Array.from({ length: 10 }, () => 69),
          XTX_flat: Array.from({ length: 10 * 10 }, () => 69),
          XTy: Array.from({ length: 10 }, () => 69),
          stale: false,
        })
  )
  .catch((error) => {
    console.log(`could not load DEFAULT_USER_WEIGHTS:\n${error}`);
    throw error;
  });

const D = DEFAULT_USER_WEIGHTS.then((weights) => weights.weights.length).catch(
  (error) => {
    console.log(`could not load D:\n${error}`);
    throw error;
  }
);

const getDefaultUserWeights = async () => {
  console.log(`getDefaultUserWeights()`);

  const weights = await DEFAULT_USER_WEIGHTS;

  return {
    weights: weights.weights.map(parseFloat),
    XTX_flat: weights.XTX_flat.map(parseFloat),
    XTy: weights.XTy.map(parseFloat),
    stale: weights.stale,
  };
};

const getTagWeights = async (googleTag) => {
  console.log(`getTagWeights(${googleTag})`);

  // TODO: delete
  return D.then((d) => Array.from({ length: d }, () => 69));

  return Tag.findOne({ name: googleTag.description })
    .then((tag) => (tag ? tag.weights : []))
    .catch((error) => {
      console.log(`getTagWeights(${googleTag}) failed:\n${error}`);
      throw error;
    });
};

const getImageWeights = async (url) => {
  console.log(`getImageWeights(${url})`);

  const d = await D;

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
            { length: d },
            (_, i) =>
              tagWeights
                .map(([tag, weight]) => tag[i] * weight)
                .reduce((x, y) => x + y, 0) / totalWeight
          )
        : Array.from({ length: d }, () => 0);
    })
    .catch((error) => {
      console.log(`getImageWeights(${url}) failed:\n${error}`);
      throw error;
    });
};

const addReview = async (review) => {
  console.log(`addReview(${review})`);

  const d = await D;

  review.user.weights.XTX_flat = review.user.weights.XTX_flat.map(
    (x, i) =>
      x +
      review.rating *
        review.image.weights[Math.floor(i / d)] *
        review.image.weights[i % d]
  );
  review.user.weights.XTy = review.user.weights.XTy.map(
    (y, i) => y + review.rating * review.image.weights[i]
  );
  review.user.weights.stale = true;

  return review.save().catch((error) => {
    console.log(`addReview(${review}) failed:\n${error}`);
    throw error;
  });
};

const getImagePrediction = async (imageWeights, userWeights) => {
  console.log(`getImagePrediction(${imageWeights}, ${userWeights})`);

  return imageWeights
    .map((x, i) => parseFloat(x) * userWeights[i])
    .reduce((x, y) => x + y, 0);
};

const getRestaurantPrediction = async (userWeights, restaurant) => {
  console.log(`getRestaurantPrediction(${userWeights}, ${restaurant})`);

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
      console.log(`getRestaurantPrediction(${userWeights}, ${restaurant})`);
      throw error;
    });
};

const getUserWeights = async (user) => {
  console.log(`getUserWeights(${user})`);

  if (!user.weights.stale) return user.weights.weights.map(parseFloat);

  try {
    const d = await D;

    const A = new Matrix(
      Array.from({ length: d }, (_, i) =>
        user.weights.XTX_flat.slice(i * d, (i + 1) * d).map(parseFloat)
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
        console.log(`getUserWeights(${user}) failed:\n${error}`);
        throw error;
      });
  } catch (error) {
    console.log(`getUserWeights(${user}) failed:\n${error}`);
    throw error;
  }
};

const getRecommendations = async (user, restaurants) => {
  console.log(`getRecommendations(${user}, ${restaurants})`);

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
        `getRecommendations(${user}, ${restaurants}) failed:\n${error}`
      );
      throw error;
    });
};

module.exports = {
  getDefaultUserWeights,
  getImageWeights,
  addReview,
  getRecommendations,
};
