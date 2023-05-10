const google = require("./google");

const ImageWeights = require("../models/ImageWeights");
const TagWeights = require("../models/TagWeights");
const { UserWeights, DefaultUserWeights } = require("../models/UserWeights");

const { Matrix, solve } = require("ml-matrix");

const computeUserWeights = async (userWeights, imageWeights, rating) => {
  console.log(`computeUserWeights(${userWeights}, ${imageWeights}, ${rating})`);

  const d = userWeights.XTy_flat.length;

  userWeights.XTX_flat = userWeights.XTX_flat.map(
    (x, i) => x + imageWeights[Math.floor(i / d)] * imageWeights[i % d]
  );
  userWeights.XTy_flat = userWeights.XTy_flat.map(
    (y, i) => y + rating * imageWeights[i]
  );
  userWeights.stale = true;

  return userWeights.save().catch((error) => {
    console.log(
      `computeUserWeights(${userWeights}, ${imageWeights}, ${rating}) failed:\n${error}`
    );
    throw error;
  });
};

const addReview = async (review) => {
  console.log(`addReview(${review})`);

  return Promise.all([
    getUserWeights(review.user),
    getImageWeights(review.image),
  ])
    .then(([userWeights, imageWeights]) =>
      computeUserWeights(userWeights, imageWeights, review.rating)
    )
    .then(() => review)
    .catch((error) => {
      console.log(`addReview(${review}) failed:\n${error}`);
      throw error;
    });
};

const getDefaultUserWeights = async () => {
  // TODO: load this on mongo connect rather than pulling from db each time?
  console.log(`getDefaultUserWeights()`);

  return DefaultUserWeights.findOne().catch((error) => {
    console.log(`getDefaultUserWeights() failed:\n${error}`);
    throw error;
  });
};

const evaluateUserWeights = async (userWeights) => {
  console.log(`evaluateUserWeights(${userWeights})`);

  try {
    const d = userWeights.XTy_flat.length;

    const A = new Matrix(
      Array.from({ length: d }, (_, i) =>
        userWeights.XTX_flat.slice(i * d, (i + 1) * d)
      )
    );
    const b = Matrix.columnVector(userWeights.XTy_flat);

    const x = solve(A, b).to1DArray();

    userWeights.weights = x;
    userWeights.stale = false;
  } catch (error) {
    console.log(`evaluateUserWeights(${userWeights}) failed:\n${error}`);
    throw error;
  }

  return userWeights.save().catch((error) => {
    console.log(`evaluateUserWeights(${userWeights}) failed:\n${error}`);
    throw error;
  });
};

const getUserWeights = async (user, evaluate = false) => {
  console.log(`getUserWeights(${user}, ${evaluate})`);

  return UserWeights.findOne({ user: user })
    .then((userWeights) =>
      userWeights ? userWeights : getDefaultUserWeights()
    )
    .then((userWeights) =>
      evaluate && userWeights.stale
        ? evaluateUserWeights(userWeights)
        : userWeights
    )
    .catch((error) => {
      console.log(`getUserWeights(${user}) failed:\n${error}`);
      throw error;
    });
};

const getTagWeights = async (tag) => {
  // TODO: load this on mongo connect rather than pulling from db each time?
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
    .reduce((x, y) => Array.from({ length: x.length }, (_, i) => x[i] + y[i]));
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

  return getUserWeights(user, true)
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
