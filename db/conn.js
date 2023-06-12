const mongoose = require("mongoose");
const uri = process.env.ATLAS_URI;

const connect = async () =>
  mongoose.connect(uri).catch((error) => {
    console.log(`could not connect to mongo: ${error}`);
  });

module.exports = { connect };
