const axios = require("axios");
const mongo = require("./mongo");

// TODO
const getGoogleTags = async (url) => {
  console.log(`google.getGoogleTags(${url})`);

  return axios.get().catch((error) => {
    console.log(`google.getGoogleTags(${url}) failed:\n${error}`);
    throw error;
  });
};

const getImageTags = async (image) => {
  console.log(`google.getImageTags(${image})`);

  return mongo
    .getGoogleImageTags(image)
    .then((googleImageTags) =>
      googleImageTags
        ? googleImageTags
        : getGoogleTags(image.url).then((googleTags) =>
            mongo.addGoogleImageTags(image, googleTags)
          )
    )
    .catch((error) => {
      console.log(`google.getImageTags(${image}) failed:\n${error}`);
      throw error;
    });
};

// TODO
const getRestaurants = (zip) => {
  console.log(`google.getRestaurants(${zip})`);

  if (!zip) {
    console.log(`invalid arguments: please specify zip`);
    return [];
  }
};

// TODO
const getRestaurantImages = (restaurant) => {
  console.log(`google.getRestaurantImages(${restaurant})`);
};

module.exports = {
  getImageTags: getImageTags,
  getRestaurants: getRestaurants,
  getRestaurantImages: getRestaurantImages,
};
