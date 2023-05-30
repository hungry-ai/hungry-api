const express = require("express");
const hungryai = require("../services/hungryai");

const { InstagramWebhook } = require("../models/Webhook");

const instagramRoutes = express.Router();

instagramRoutes.route("/instagram/story-mention").get((req, res) => {
  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Check if a token and mode is in the query string of the request
  if (mode && token) {
    // Check the mode and token sent is correct
    if (mode === "subscribe" && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
      // Respond with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

instagramRoutes.route("/instagram/story-mention").post((req, res) => {
  console.log(`/instagram/story-mention`);

  try {
    const webhook = new InstagramWebhook(req.body);
    hungryai.storyMention(webhook).catch((error) => {
      console.log(`/instagram/story-mention failed:\n${error}`);
    });
    res.sendStatus(200);
  } catch (error) {
    console.log(`/instagram/story-mention invalid webhook:\n${error}`);
    res.sendStatus(400);
  }
});

instagramRoutes.route("/instagram/stories").get((req, res) => {
  const { username } = req.query;

  console.log(`/instagram/stories username=${username}`);

  hungryai
    .getStories(username)
    .then((stories) => {
      res.send({ stories: stories });
    })
    .catch((error) => {
      console.log(`/instagram/stories username=${username} failed:\n${error}`);
      res.send({ stories: [] });
    });
});

instagramRoutes.route("/instagram/reviews").get((req, res) => {
  const { username } = req.query;

  console.log(`/instagram/reviews username=${username}`);

  hungryai
    .getReviews(username)
    .then((reviews) => {
      res.send({ reviews: reviews });
    })
    .catch((error) => {
      console.log(`/instagram/reviews username=${username} failed:\n${error}`);
      res.send({ reviews: [] });
    });
});

instagramRoutes.route("/instagram/restaurants").get((req, res) => {
  const { username, zip } = req.query;

  console.log(`/instagram/restaurants username=${username} zip=${zip}`);

  hungryai
    .getRecommendations(username, zip)
    .then((restaurants) => {
      res.send({ restaurants: restaurants });
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
