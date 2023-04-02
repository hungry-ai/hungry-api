const express = require("express");
const axios = require("axios");

const instagramRoutes = express.Router();

const ACCESS_TOKEN = "nice-try";

const getAllStories = async () => {
  const url =
    "https://graph.facebook.com/me/conversations?platform=instagram&fields=messages{story},participants&access_token=" +
    ACCESS_TOKEN;

  return await axios.get(url).then((res) => {
    const allStories = res.data.data.map((conversation) => ({
      participants: conversation.participants.data.map(
        (participant) => participant.username
      ),
      stories: conversation.messages.data.flatMap((message) =>
        message.story && message.story.mention && message.story.mention.link
          ? [message.story.mention.link]
          : []
      ),
    }));

    return allStories;
  });
};

// returns a list of all stories available to us that haven't expired
instagramRoutes.route("/instagram/all-stories").get(function (req, res) {
  getAllStories().then((stories) => {
    res.send(stories);
  });
});

// returns a list of all stories available to us by user that haven't expired
instagramRoutes.route("/instagram/stories/:username").get(function (req, res) {
  const { username } = req.params;

  getAllStories().then((stories) => {
    myStories = stories.flatMap((story) =>
      story.participants.includes(username) ? story.stories : []
    );
    res.send(myStories);
  });
});

// logs every time we get a story mention
instagramRoutes.route("/instagram/story-mention").post(function (req, res) {
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

// me/conversations?platform=instagram
// message-id/attachments
// me/conversations?fields=messages{story},name&platform=instagram
// https://lookaside.fbsbx.com/ig_messaging_cdn/?asset_id=17973121241180465&signature=AbyqawaR8ZoSGzUQ3M_Z74SOwEkkz29s6UkaHzLeoXThALGuyfDsxWlvQRnhjTP8I9kbcAK7kuS5x4nad7hnlIa5dY5KIV8hokyrgN4zhbgBwaZiahG4euB5FpveFL4ADYgjJjoeHY6hi70tVYyuYX32ouTvAPUrBmg4eQKySbthnqLoHsButoQEE7dJ19KgoHGhDBl9KPHgLQ6ygQbQiDCA-HgzWAc
// https://lookaside.fbsbx.com/ig_messaging_cdn/?asset_id=17973121241180465&signature=Abxh5maxOb4d6xk8pAMxbPcLHXFC8mDO2_zlMbg7oIZ9Xrdq6P3gu90R6-YuGr6Epd5yLLKFXYygbYAML_Un7bILOYvh-WMe_oRVEdKmFSHBHcXuU5Q_jISdOrjajFRPqT2dNjeWAzsw5gJvs7pvFZ5_oLkOeqczT3fpAIYmeo4xHROy9oqWL9wDhhPcIZUNcpcwk9IRD6jdgCPRHddA9CI5z_YVDvc
