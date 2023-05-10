const GoogleImageTags = require("../models/GoogleImageTags");
const vision = require("@google-cloud/vision");
const { GoogleAuth } = require("google-auth-library");

const getImageTags = async (image) => {
  console.log(`google.getImageTags(${image})`);
  // return GoogleImageTags.findOne({image : image})
  //   .then((googleImageTags) =>
  //     googleImageTags
  //       ? googleImageTags
  //       : getGoogleTags(image.url).then((googleTags) =>
  //           addGoogleTags(image, googleTags)
  //         )
  //   )
  //   .catch((error) => {
  //     console.log(`google.getImageTags(${image}) failed:\n${error}`);
  //     throw error;
  //   });
    return getGoogleTags(image);
};

// const addGoogleTags = async (image, googleTags) => {

// }

const getGoogleTags = async (url) => {
  console.log(`google.getGoogleTags(${url})`);

  const auth = new GoogleAuth({
    keyFilename: "services/service-account-key.json",
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const client = new vision.ImageAnnotatorClient({ auth });

  try {
    const [result] = await client.labelDetection(url);
    const labels = result.labelAnnotations;
    const tags = labels.map((label) => label.description);
    console.log(tags);
    return tags;
  } catch (error) {
    console.log(`google.getGoogleTags(${url}) failed:\n${error}`);
    throw error;
  }
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
  getGoogleTags: getGoogleTags,
};
