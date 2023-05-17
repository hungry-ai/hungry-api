const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config({ path: "./config.env" });
// get driver connection
const dbo = require("./db/conn");

const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use(require("./routes/instagram"));

app.listen(port, () => {
  // perform a database connection when server starts
  dbo.connect();
  // dbo.connect().then(require("./tests").main); // TODO: remove
  console.log(`Server is running on port: ${port}`);
});
