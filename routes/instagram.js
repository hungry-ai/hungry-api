const express = require("express");

const instagramRoutes = express.Router();

instagramRoutes.route("/instagram").get(function (req, res) {
  res.send("hello world");
});

module.exports = instagramRoutes;
