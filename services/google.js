// TODO
const getImageTags = async (image) => {
  console.log(`addImageTags(${image})`);

  // call google cloud vision api
};

// TODO
const getRestaurants = async (zip) => {
  console.log(`getRestaurants(${zip})`);

  // call google places
};

// TODO
const getRestaurantImages = async (restaurant) => {
  console.log(`getRestaurantImages(${restaurant})`);

  // call google places
};

module.exports = {
  getImageTags: getImageTags,
  getRestaurants: getRestaurants,
  getRestaurantImages: getRestaurantImages,
};
