const GoogleImageTags = require("../models/GoogleImageTags");
const GoogleTag = require("../models/GoogleTag");
const Image = require("../models/Image");
const ImageTags = require("../models/ImageTags");
const ImageWeights = require("../models/ImageWeights");
const Review = require("../models/Review");
const Tag = require("../models/Tag");
const TagWeights = require("../models/TagWeights");
const User = require("../models/User");
const UserWeights = require("../models/UserWeights");

const addUser = async (instagramUsername) => {
  //console.log(`mongo.addUser(${instagramUsername})`);

  const user = new User({ instagramUsername: instagramUsername });

  return user
    .save()
    .then(() => user)
    .catch((error) => {
      console.log(`mongo.addUser(${instagramUsername}) failed:\n${error}`);
      throw error;
    });
};

const getUser = async (instagramUsername) => {
  //console.log(`mongo.getUser(${instagramUsername})`);

  return instagramUsername
    ? User.findOne({ instagramUsername: instagramUsername }).catch((error) => {
        console.log(`mongo.getUser(${instagramUsername}) failed:\n${error}`);
        throw error;
      })
    : null;
};

const addImage = async (url) => {
  //console.log(`mongo.addImage(${url})`);

  const image = new Image({ url: url });

  return image
    .save()
    .then(() => image)
    .catch((error) => {
      console.log(`mongo.addImage(${url}) failed:\n${error}`);
      throw error;
    });
};

const getImage = async (url) => {
  //console.log(`mongo.getImage(${url})`);

  return Image.findOne({ url: url }).catch((error) => {
    console.log(`mongo.addImage(${url}) failed:\n${error}`);
    throw error;
  });
};

const addReview = async (user, image, rating, timestamp) => {
  //console.log(`mongo.addReview(${user}, ${image}, ${rating}, ${timestamp})`);

  const review = new Review({
    user: user._id,
    image: image._id,
    rating: rating,
    instagramTimestamp: timestamp,
  });

  return review
    .save()
    .then(() => review)
    .catch((error) => {
      console.log(
        `mongo.addReview(${user}, ${image}, ${rating}, ${timestamp}) failed:\n${error}`
      );
      throw error;
    });
};

const getReviews = async (user) => {
  //console.log(`mongo.getReviews(${user})`);

  return Review.find({ user: user }).catch((error) => {
    console.log(`mongo.getReviews(${user}) failed:\n${error}`);
    throw error;
  });
};

const getTag = async (name) => {
  //console.log(`mongo.getTag(${name})`);

  return Tag.findOne(name).catch((error) => {
    console.log(`mongo.getTag(${name}) failed:\n${error}`);
    throw error;
  });
};

const addImageTags = async (googleImageTags) => {
  //console.log(`mongo.addImageTags(${googleImageTags})`);

  return Promise.all(
    googleImageTags.tags.map((googleTag) => getTag(googleTag.description))
  )
    .then(async (tags) => {
      const imageTags = new ImageTags({
        image: googleImageTags.image,
        tags: tags.filter(Boolean),
        prMatch: googleImageTags.flatMap((googleTag, i) =>
          tags[i] ? [googleTag.score] : []
        ),
      });

      return imageTags.save().then(() => imageTags);
    })
    .catch((error) => {
      console.log(`mongo.addImageTags(${googleImageTags}) failed:\n${error}`);
      throw error;
    });
};

const addGoogleTag = async (mid, description, score, topicality) => {
  //console.log(`mongo.addGoogleTag(${mid}, ${description}, ${score}, ${topicality})`);

  const googleTag = new GoogleTag({
    mid: mid,
    description: description,
    score: score,
    topicality: topicality,
  });

  return googleTag
    .save()
    .then(() => googleTag)
    .catch((error) => {
      console.log(
        `mongo.addGoogleTag(${mid}, ${description}, ${score}, ${topicality}) failed:\n${error}`
      );
      throw error;
    });
};

const addGoogleImageTags = async (image, googleTags) => {
  //console.log(`mongo.addGoogleImageTags(${googleTags})`);

  return Promise.all(
    googleTags.labels.map((tag) =>
      addGoogleTag(tag.mid, tag.description, tag.score, tag.topicality)
    )
  )
    .then(async (tags) => {
      const googleImageTags = new GoogleImageTags({
        image: image,
        tags: tags,
      });

      return googleImageTags.save().then(() => googleImageTags);
    })
    .catch((error) => {
      console.log(
        `mongo.addGoogleImageTags(${image}, ${googleTags}) failed:\n${error}`
      );
      throw error;
    });
};

const getGoogleImageTags = async (image) => {
  //console.log(`mongo.getGoogleImageTags(${image})`);

  return GoogleImageTags.findOne({ image: image }).catch((error) => {
    console.log(`mongo.getGoogleImageTags(${image}) failed:\n${error}`);
    throw error;
  });
};

// TODO
const addUserWeights = async () => {};

// TODO
const getUserWeights = async (user) => {};

// TODO
const updateUserWeights = async () => {};

// TODO
const addImageWeights = async (image) => {};

// TODO
const getImageWeights = async (image) => {};

module.exports = {
  addUser: addUser,
  getUser: getUser,
  addImage: addImage,
  getImage: getImage,
  addReview: addReview,
  getReviews: getReviews,
  addImageTags: addImageTags,
  addGoogleImageTags: addGoogleImageTags,
  getGoogleImageTags: getGoogleImageTags,
  addUserWeights: addUserWeights,
  getUserWeights: getUserWeights,
  addImageWeights: addImageWeights,
  getImageWeights: getImageWeights,
};
