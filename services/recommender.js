const google = require("./google");

const { Restaurant } = require("../models/Restaurant");
const { User, DefaultUserWeights } = require("../models/User");
const { Image } = require("../models/Image");

const getDefaultUserWeights = async () => {
  console.log(`getDefaultUserWeights()`);

  // TODO: remove, this was for testing
  return new DefaultUserWeights({
    weights: Array.from({ length: 20 }, (_, i) => i),
    XTX_flat: Array.from({ length: 400 }, (_, i) => i),
    XTy_flat: Array.from({ length: 20 }, (_, i) => i),
    stale: false,
  })
    .save()
    .then((weights) => ({
      weights: weights.weights,
      XTX_flat: weights.XTX_flat,
      XTy_flat: weights.XTy_flat,
      stale: weights.stale,
    }))
    .catch((error) => {
      console.log(`getDefaultUserWeights() failed:\n${error}`);
      throw error;
    });

  return DefaultUserWeights.findOne()
    .then((weights) => ({
      weights: weights.weights,
      XTX_flat: weights.XTX_flat,
      XTy_flat: weights.XTy_flat,
      stale: weights.stale,
    }))
    .catch((error) => {
      console.log(`getDefaultUserWeights() failed:\n${error}`);
      throw error;
    });
};

const getOrAddUser = async (instagramId) => {
  console.log(`getOrAddUser(${instagramId})`);

  return User.findOne({ instagramId: instagramId })
    .then((user) =>
      user
        ? user
        : getDefaultUserWeights().then((weights) =>
            new User({
              instagramId: instagramId,
              weights: weights,
            }).save()
          )
    )
    .catch((error) => {
      console.log(`getOrAddUser(${instagramId}) failed:\n${error}`);
      throw error;
    });
};

const getImageWeights = async (url) => {
  console.log(`getImageWeights(${url})`);

  return google
    .getTags(url)
    .then(([tags, weights]) =>
      Array.from({ length: 20 }, (_, i) =>
        tags
          .map((tag, j) => tag.weights[i] * weights[j])
          .reduce((x, y) => x + y, 0)
      )
    )
    .catch((error) => {
      console.log(`getImageWeights(${url}) failed:\n${error}`);
      throw error;
    });
};

const getOrAddImage = async (url) => {
  console.log(`getOrAddImage(${url})`);

  if (!url) {
    console.log(`getOrAddImage(${url}) failed:\ninvalid argument`);
    return;
  }

  return Image.findOne({ url: url })
    .then((image) =>
      image
        ? image
        : getImageWeights(url).then((weights) =>
            new Image({ url: url, weights: weights }).save()
          )
    )
    .catch((error) => {
      console.log(`getOrAddImage(${url}) failed:\n${error}`);
      throw error;
    });
};

const addReview = async (review) => {
  console.log(`addReview(${review})`);

  const userWeights = review.user.weights;
  const imageWeights = review.image.weights.map(parseFloat);
  const rating = review.rating;

  userWeights.XTX_flat = userWeights.XTX_flat.map(
    (x, i) =>
      parseFloat(x) +
      rating * imageWeights[Math.floor(i / 20)] * imageWeights[i % 20]
  );
  userWeights.XTy_flat = userWeights.XTy_flat.map(
    (y, i) => parseFloat(y) + rating * imageWeights[i]
  );
  userWeights.stale = true;

  return review.user
    .save()
    .then(() => review)
    .catch((error) => {
      console.log(`addReview(${review}) failed:\n${error}`);
      throw error;
    });
};

const getUserWeights = async (user) => {
  console.log(`getUserWeights(${user})`);

  if (!user)
    return getDefaultUserWeights()
      .then((user) => user.weights)
      .catch((error) => {
        console.log(`getUserWeights(${user}) failed:\n${error}`);
        throw error;
      });

  if (!user.stale) return user.weights.weights;

  try {
    const d = user.weights.XTy_flat.length;

    const A = new Matrix(
      Array.from({ length: d }, (_, i) =>
        user.weights.XTX_flat.slice(i * d, (i + 1) * d)
      )
    );
    const b = Matrix.columnVector(user.weights.XTy_flat);

    const x = solve(A, b).to1DArray();

    user.weights.weights = x;
    user.weights.stale = false;

    return user.weights.save().catch((error) => {
      console.log(`getUserWeights(${user}) failed:\n${error}`);
      throw error;
    });
  } catch (error) {
    console.log(`getUserWeights(${user}) failed:\n${error}`);
    throw error;
  }
};

const getPrediction = async (userWeights, image) => {
  console.log(`getPrediction(${userWeights}, ${image})`);

  return userWeights
    .map((u, i) => parseFloat(u) * parseFloat(image.weights[i]))
    .reduce((x, y) => x + y, 0);
};

const addRestaurantPrediction = async (user, restaurant) => {
  console.log(`addRestaurantPrediction(${user}, ${restaurant})`);

  return getUserWeights(user)
    .then((userWeights) =>
      Promise.all(
        restaurant.images.map((image) => getPrediction(userWeights, image))
      )
    )
    .then((predictions) =>
      predictions && predictions.length
        ? predictions.reduce((x, y) => x + y, 0) / predictions.length
        : 0
    )
    .then((rating) => [rating, restaurant])
    .catch((error) => {
      console.log(
        `addRestaurantPrediction(${user}, ${restaurant}) failed:\n${error}`
      );
      throw error;
    });
};

const getRestaurant = async (googleRestaurant) => {
  console.log(`getRestaurant(${googleRestaurant})`);

  return Promise.all(
    googleRestaurant.photos.map((photo) =>
      getOrAddImage(google.getPhotoUrl(photo.photo_reference))
    )
  )
    .then((images) =>
      new Restaurant({
        name: googleRestaurant.name,
        images: images,
      }).save()
    )
    .catch((error) => {
      console.log(`getRestaurant(${googleRestaurant}) failed:\n${error}`);
      throw error;
    });
};

const getRestaurants = async (zip) => {
  console.log(`getRestaurants(${zip})`);

  return google
    .getRestaurants(zip)
    .then((googleRestaurants) =>
      Promise.all(googleRestaurants.map(getRestaurant))
    )
    .catch((error) => {
      console.log(`getRestaurants(${zip})`);
      throw error;
    });
};

const getRecommendations = async (user, zip) => {
  console.log(`getRecommendations(${user}, ${zip})`);

  return getRestaurants(zip)
    .then((restaurants) =>
      Promise.all(
        restaurants.map((restaurant) =>
          addRestaurantPrediction(user, restaurant)
        )
      )
    )
    .then((restaurantPredictions) => {
      restaurantPredictions.sort();
      restaurantPredictions.reverse();
      return restaurantPredictions.map(([_, restaurant]) => restaurant);
    })
    .catch((error) => {
      console.log(`getRecommendations(${user}, ${zip}) failed:\n${error}`);
      throw error;
    });
};

module.exports = {
  getDefaultUserWeights: getDefaultUserWeights,
  getOrAddUser: getOrAddUser,
  getImageWeights: getImageWeights,
  getOrAddImage: getOrAddImage,
  addReview: addReview,
  getRecommendations: getRecommendations,
};
