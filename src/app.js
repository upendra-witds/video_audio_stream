// import express
const express = require('express');
const cors = require('cors')
// create express app
app = express();

app.use(cors());
app.use(express.json());

app.use(
  "/streams",
  express.static(path.join(__dirname, "public", "streams"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".m3u8")) {
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      }
      if (filePath.endsWith(".ts")) {
        res.setHeader("Content-Type", "video/mp2t");
      }
    },
  }),
);

app.use("/api", require("./routes/routes"));
module.exports = app;