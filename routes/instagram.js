const express = require("express");
const axios = require("axios");

const instagramRoutes = express.Router();

const ACCESS_TOKENS = [
  process.env.ACCESS_TOKEN_1,
  process.env.ACCESS_TOKEN_2,
  process.env.ACCESS_TOKEN_3,
  process.env.ACCESS_TOKEN_4,
  process.env.ACCESS_TOKEN_5,
];

const PAGE_IDS = [
  process.env.PAGE_ID_1,
  process.env.PAGE_ID_2,
  process.env.PAGE_ID_3,
  process.env.PAGE_ID_4,
  process.env.PAGE_ID_5,
];

const getAllStoriesByAccessToken = async (access_token, rating) =>
  axios
    .get(
      "https://graph.facebook.com/v16.0/me/conversations?platform=instagram&fields=messages{story,created_time,from},participants&access_token=" +
        access_token
    )
    .then((res) =>
      res.data.data.map((conversation) => ({
        participants: conversation.participants.data.map(
          (participant) => participant.username
        ),
        stories: conversation.messages.data.flatMap((message) =>
          message.story &&
          message.story.mention &&
          message.from &&
          message.from.username
            ? [
                {
                  url: message.story.mention.link,
                  timestamp: message.created_time,
                  rating: rating,
                  username: message.from.username,
                },
              ]
            : []
        ),
      }))
    )
    .catch((error) => {
      console.log(`getAllStoriesByAccessToken rating=${rating} failed`);
      if (error && error.response) {
        console.log({
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          config: error.response.config,
        });
      }
      return [];
    });

const getAllStories = async () =>
  Promise.all(
    ACCESS_TOKENS.map((access_token, index) =>
      getAllStoriesByAccessToken(access_token, index + 1)
    )
  )
    .then((storiesByRating) => storiesByRating.flat())
    .catch((error) => {
      console.log("one or more getAllStoriesByAccessToken failed");
      return [];
    });

// returns a list of all stories available to us that haven't expired
instagramRoutes.route("/instagram/all-stories").get((req, res) => {
  getAllStories()
    .then((stories) => {
      allStories = stories
        .flatMap((story) => story.stories)
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        .reverse();
      res.send(allStories);
    })
    .catch((error) => {
      console.log("instagram/all-stories failed");
    });
});

// returns a list of all stories available to us by user that haven't expired
instagramRoutes.route("/instagram/:username/stories").get((req, res) => {
  const { username } = req.params;

  getAllStories()
    .then((stories) => {
      myStories = stories
        .flatMap((story) =>
          story.participants.includes(username) ? story.stories : []
        )
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        .reverse();
      res.send(myStories);
    })
    .catch((error) => {
      console.log(`instagram/${username}/stories failed`);
    });
});

// returns a list of restaurant recommendations for a given user
instagramRoutes.route("/instagram/:username/restaurants").get((req, res) => {
  res.send([]);
});

// returns a list of stats for a given user
instagramRoutes.route("/instagram/:username/stats").get((req, res) => {
  res.send({});
});

// logs every time we get a story mention
instagramRoutes.route("/instagram/story-mention").post((req, res) => {
  console.log(req.body);

  req.body.entry.forEach((entry) =>
    entry.messaging.forEach((message) => {
      console.log("sender:", message.sender.id);
      console.log("recipient:", message.recipient.id);
      console.log("timestamp:", message.timestamp);
      console.log("message id:", message.message.mid);
      message.message.attachments.forEach((attachment) => {
        if (attachment.type === "story_mention") {
          console.log("url:", attachment.payload.url);
          console.log("id:", attachment.payload.id);
        }
      });
    })
  );

  res.send("OK");
});

module.exports = instagramRoutes;

// TODO: why isn't balconycarspotting showing up?
// TODO: figure out how to handle message requests
