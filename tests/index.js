const hungryai = require("../services/hungryai");
const google = require("../services/google");
const instagram = require("../services/instagram");
const mongo = require("../services/mongo");
const recommender = require("../services/recommender");

const testCody = async () => {
  console.log(`codys tests`);
};

const main = async () => {
  testCody();
};

module.exports = { main: main };
