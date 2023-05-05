const express = require("express");
const {
  storyMention,
  getStories,
  getReviews,
  getRestaurants,
} = require("../services/hungryai");

const instagramRoutes = express.Router();

instagramRoutes.route("/instagram/story-mention").post((req, res) => {
  console.log(`/instagram/story-mention`);

  if (req && req.body) {
    const webhook = req.body;
    storyMention(webhook);
  } else {
    console.log(`invalid story mention`);
  }

  res.sendStatus(200);
});

instagramRoutes.route("/instagram/stories").get((req, res) => {
  const { username } = req.query;

  console.log(`/instagram/stories username=${username}`);

  getStories(username)
    .then((stories) => {
      res.send({ stories: stories ? stories : [] });
    })
    .catch((error) => {
      console.log(`/instagram/stories username=${username} failed:\n${error}`);
      res.send({ stories: [] });
    });
});

instagramRoutes.route("/instagram/reviews").get((req, res) => {
  const { username } = req.query;

  console.log(`/instagram/reviews username=${username}`);

  getReviews(username)
    .then((reviews) => {
      res.send({ reviews: reviews ? reviews : [] });
    })
    .catch((error) => {
      console.log(`/instagram/reviews username=${username} failed:\n${error}`);
      res.send({ reviews: [] });
    });
});

instagramRoutes.route("/instagram/restaurants").get((req, res) => {
  const { username, zip } = req.query;

  console.log(`/instagram/restaurants username=${username} zip=${zip}`);

  getRestaurants(username, zip)
    .then((restaurants) => {
      res.send({ restaurants: restaurants ? restaurants : [] });
    })
    .catch((error) => {
      console.log(
        `/instagram/restaurants username=${username} zip=${zip} failed:\n${error}`
      );
      res.send({ restaurants: [] });
    });
});

module.exports = instagramRoutes;

// TODO: figure out how to handle message requests
// TODO: separate reviews, restaurants to their own routers
