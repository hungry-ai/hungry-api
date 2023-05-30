const axios = require("axios");
const vision = require("@google-cloud/vision");
const { GoogleAuth } = require("google-auth-library");
const usZips = require("us-zips");

const { GoogleImageTags } = require("../models/Tag");
const { GoogleRestaurant } = require("../models/Restaurant");

const getImageTags = async (url) => {
  console.log(`getImageTags(${url})`);

  const client_email = process.env.GOOGLE_CLIENT_EMAIL;
  const private_key = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

  const auth = new GoogleAuth({
    credentials: {
      client_email,
      private_key,
    },
    scopes: "https://www.googleapis.com/auth/cloud-platform",
  });

  const client = new vision.ImageAnnotatorClient({ auth });

  return client
    .labelDetection(url)
    .then(([result]) => result.labelAnnotations)
    .then((tags) => new GoogleImageTags({ url: url, tags: tags }).save())
    .catch((error) => {
      console.log(`getGoogleTags(${url}) failed:\n${error}`);
      throw error;
    });
};

const getRestaurantImages = async (googleRestaurant) => {
  console.log(`getRestaurantImages(${googleRestaurant})`);

  return googleRestaurant.photos.map(
    (googlePhoto) =>
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${googlePhoto.photo_reference}&key=${API_KEY}`
  );
};

const getRestaurants = async (zip) => {
  console.log(`getRestaurants(${zip})`);

  const { latitude, longitude } = usZips[zip];
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude}%2C${longitude}&radius=1500&type=restaurant&key=${API_KEY}`;

  return axios
    .get(url)
    .then((res) => {
      const { results } = res.data;
      return Promise.allSettled(
        results.map((restaurant) =>
          new GoogleRestaurant({ ...restaurant, zip: zip }).save()
        )
      );
    })
    .catch((error) => {
      console.log(`getRestaurants(${zip}) failed:\n${error}`);
      throw error;
    });
};

module.exports = {
  getImageTags,
  getRestaurantImages,
  getRestaurants,
};
