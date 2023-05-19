const axios = require("axios");
const vision = require("@google-cloud/vision");
const { GoogleAuth } = require("google-auth-library");
const usZips = require("us-zips");

const { Tag, GoogleImageTags } = require("../models/Tag");
const { GoogleRestaurant } = require("../models/Restaurant");

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const getGoogleTags = async (url) => {
  console.log(`getGoogleTags(${url})`);

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

const getTag = async (googleTag) => {
  console.log(`getTag(${googleTag})`);

  /*// TODO remove
  return new Tag({
    name: googleTag.description.toLowerCase(),
    weights: Array.from({ length: 20 }, (_, i) => i),
  })
    .save()
    .then((tag) => ({ tag: tag, weight: parseFloat(googleTag.score) }))
    .catch((error) => {
      console.log(`getTag(${googleTag}) failed:\n${error}`);
      throw error;
    });*/

  return Tag.findOne({ name: googleTag.description.toLowerCase() })
    .then((tag) => ({ tag: tag, weight: parseFloat(googleTag.score) }))
    .catch((error) => {
      console.log(`getTag(${googleTag}) failed:\n${error}`);
      throw error;
    });
};

const getTags = async (url) => {
  console.log(`getTags(${url})`);

  return getGoogleTags(url)
    .then((googleTags) => Promise.all(googleTags.tags.map(getTag)))
    .then((tags) => tags.filter((tag) => tag.tag))
    .then((tags) => {
      console.log(tags.map((tag) => tag.tag.name));
      console.log(tags.map((tag) => tag.weight));
      return tags;
    })
    .then((tags) => {
      const totalWeight = tags
        .map((tag) => tag.weight)
        .reduce((x, y) => x + y, 0);
      console.log(totalWeight);
      console.log(
        tags.length ? tags.map((tag) => tag.weight / totalWeight) : []
      );

      return [
        tags.map((tag) => tag.tag),
        tags.length ? tags.map((tag) => tag.weight / totalWeight) : [],
      ];
    })
    .catch((error) => {
      console.log(`getTags(${url}) failed:\n${error}`);
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
      return Promise.allSettled(
        results.map((restaurant) =>
          new GoogleRestaurant({ ...restaurant, zip: zip }).save()
        )
      );
    })
    .catch((error) => {
      console.log(`getGoogleRestaurants(${zip}) failed:\n${error}`);
      throw error;
    });
};

const getRestaurants = async (zip) => {
  console.log(`getRestaurants(${zip})`);

  return GoogleRestaurant.find({ zip: zip })
    .then((googleRestaurants) =>
      googleRestaurants.length ? googleRestaurants : getGoogleRestaurants(zip)
    )
    .catch((error) => {
      console.log(`getRestaurants(${zip})`);
      throw error;
    });
};

const getPhotoUrl = (photoRef) => {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${API_KEY}`;
};

module.exports = {
  getTags: getTags,
  getRestaurants: getRestaurants,
  getPhotoUrl: getPhotoUrl,
};
