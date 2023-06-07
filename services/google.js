const axios = require("axios");
const vision = require("@google-cloud/vision");
const { GoogleAuth } = require("google-auth-library");
const usZips = require("us-zips");

const { GoogleImageTags } = require("../models/Tag");
const { GoogleRestaurant } = require("../models/Restaurant");

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const getImageTags = async (url) => {
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
      console.log(`google.getGoogleTags(${url}) failed:\n${error}`);
      throw error;
    });
};

const getRestaurantImages = async (googleRestaurant) => {
  return googleRestaurant.photos.map(
    (googlePhoto) =>
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${googlePhoto.photo_reference}&key=${API_KEY}`
  );
};

const getRestaurants = async (zip) => {
  const { latitude, longitude } = usZips[zip];
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude}%2C${longitude}&radius=1500&type=restaurant&key=${API_KEY}`;

  return axios
    .get(url)
    .then(async (res) => {
      const { results } = res.data;

      return Promise.allSettled(
        results.map((restaurant) => {
          const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${restaurant.place_id}&fields=photo&key=${API_KEY}`;
          
          return axios.get(placeDetailsUrl)
            .then((res) => {
              const { result } = res.data;
              const photos = result.photos || [];
              // Limit to 10 photos. To remove limit, change to restaurant.photos = photos;
              restaurant.photos = photos.slice(0, 10);

              return new GoogleRestaurant({ ...restaurant, zip: zip }).save();
            });
        })
      );
    })
    .then((restaurantsSettled) =>
      restaurantsSettled.flatMap((restaurantSettled) =>
        restaurantSettled.status === "fulfilled"
          ? [restaurantSettled.value]
          : []
      )
    )
    .catch((error) => {
      console.log(`google.getRestaurants(${zip}) failed:\n${error}`);
      throw error;
    });
};



module.exports = {
  getImageTags,
  getRestaurantImages,
  getRestaurants,
};
