const fetch = require('node-fetch');
const vision = require("@google-cloud/vision");
const GoogleImageTags = require("../models/GoogleImageTags");
const { GoogleAuth } = require("google-auth-library");
const apiKey = '';


const getImageTags = async (image) => {
  // console.log(`google.getImageTags(${image})`);
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


const getRestaurants = async (zip) => {
  console.log(`google.getRestaurants(${zip})`);

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants+in+${zip}&key=${apiKey}`;

  try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.results) {
          console.log(data.results);
          return data.results;
      } else {
          console.log('No restaurants found');
          return [];
      }
  } catch (error) {
      console.error(`Error: ${error}`);
      return [];
  }
};

const getRestaurantImages = async (place_id) => {
  console.log(`getRestaurantImages(${place_id})`);

  const fields = 'photos';
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${fields}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.result.photos) {
      const photoRefs = data.result.photos.map(photo => photo.photo_reference);
      const photoUrls = photoRefs.map(ref => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${ref}&key=${apiKey}`);
      console.log(photoUrls);
      return photoUrls;
    } else {
      console.log('No photos found');
      return [];
    }
  } catch (error) {
    console.error(`Error: ${error}`);
    return [];
  }
};


module.exports = {
  getImageTags: getImageTags,
  getRestaurants: getRestaurants,
  getRestaurantImages: getRestaurantImages,
  getGoogleTags: getGoogleTags,
};
