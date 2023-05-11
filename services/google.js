const axios = require("axios");
const vision = require("@google-cloud/vision");
const { GoogleAuth } = require("google-auth-library");
const usZips = require("us-zips");

const Image = require("../models/Image");
const GoogleImageTags = require("../models/GoogleImageTags");
const ImageTags = require("../models/ImageTags");
const GoogleRestaurant = require("../models/GoogleRestaurant");
const Restaurant = require("../models/Restaurant");

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const addGoogleImageTags = async (image, tags) => {
  console.log(`addGoogleImageTags(${image}, ${tags})`);

  return new GoogleImageTags({ image: image, tags: tags })
    .save()
    .catch((error) => {
      console.log(`addGoogleImageTags(${image}, ${tags}) failed:\n${error}`);
      throw error;
    });
};

const getGoogleImageTags = async (image) => {
  console.log(`getGoogleImageTags(${image})`);

  const auth = new GoogleAuth({
    keyFilename: "service-account-key.json",
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const client = new vision.ImageAnnotatorClient({ auth });

  return client
    .labelDetection(image.url)
    .then(([result]) => addGoogleImageTags(image, result.labelAnnotations))
    .catch((error) => {
      console.log(`getGoogleImageTags(${image}) failed:\n${error}`);
      throw error;
    });
};

const parseGoogleImageTags = async (image, googleImageTags) => {
  console.log(`parseGoogleImageTags(${googleImageTags})`);

  return new ImageTags({
    image: image,
    tags: googleImageTags.tags.map((googleTag) => ({
      name: googleTag.description.toLowerCase(),
    })),
    weights: googleImageTags.tags.map((googleTag) => googleTag.score),
  })
    .save()
    .catch((error) => {
      console.log(`parseGoogleImageTags(${googleImageTags})`);
      throw error;
    });
};

const getImageTags = async (image) => {
  console.log(`getImageTags(${image})`);

  return GoogleImageTags.findOne({ image: image })
    .then((googleImageTags) =>
      googleImageTags ? googleImageTags : getGoogleImageTags(image)
    )
    .then((googleImageTags) => parseGoogleImageTags(image, googleImageTags))
    .catch((error) => {
      console.log(`getImageTags(${image}) failed:\n${error}`);
      throw error;
    });
};

const addGoogleRestaurant = async (restaurant, zip) => {
  console.log(`addGoogleRestaurant(${restaurant}, ${zip})`);

  return new GoogleRestaurant({ ...restaurant, zip: zip })
    .save()
    .catch((error) => {
      console.log(
        `addGoogleRestaurant(${restaurant}, ${zip}) failed:\n${error}`
      );
      throw error;
    });
};

const getGoogleRestaurants = async (zip) => {
  console.log(`getGoogleRestaurants(${zip})`);

  const { latitude, longitude } = usZips[zip];
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude}%2C${longitude}&radius=1500&type=restaurant&key=${API_KEY}`;

  return axios
    .get(url)
    .then((res) => {
      const { results } = res.data;
      console.log(res.data);
      console.log(results);
      return Promise.allSettled(
        results.map((restaurant) => addGoogleRestaurant(restaurant, zip))
      );
    })
    .catch((error) => {
      console.log(`getGoogleRestaurants(${zip}) failed:\n${error}`);
      throw error;
    });
};

const getGooglePlacePhoto = async (photoRef) => {
  console.log(`getGooglePlacePhoto(${photoRef})`);

  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${API_KEY}`;

  return new Image({ url: url }).save().catch((error) => {
    console.log(`getGooglePlacePhoto(${photoRef}) failed:\n${error}`);
    throw error;
  });
};

const parseGoogleRestaurant = async (googleRestaurant) => {
  console.log(`parseGoogleRestaurants(${googleRestaurant})`);

  return Promise.all(
    googleRestaurant.photos.map((photo) =>
      getGooglePlacePhoto(photo.photo_reference)
    )
  )
    .then((images) =>
      new Restaurant({ name: googleRestaurant.name, images: images }).save()
    )
    .catch((error) => {
      console.log(
        `parseGoogleRestaurants(${googleRestaurant}) failed:\n${error}`
      );
      throw error;
    });
};

const getRestaurants = async (zip) => {
  console.log(`getRestaurants(${zip})`);

  return GoogleRestaurant.find({ zip: zip })
    .then((googleRestaurants) =>
      googleRestaurants.length ? googleRestaurants : getGoogleRestaurants(zip)
    )
    .then((googleRestaurants) =>
      Promise.all(googleRestaurants.map(parseGoogleRestaurant))
    )
    .catch((error) => {
      console.log(`getRestaurants(${zip}) failed:\n${error}`);
      throw error;
    });
};

module.exports = {
  getImageTags: getImageTags,
  getRestaurants: getRestaurants,
};
