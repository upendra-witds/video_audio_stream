const express = require("express");
const router = express.Router();

const { videoStreaming, streamAudio } = require("../controller/videoStreaming");

router.get("/audio-streaming", streamAudio);
router.get("/video-streaming", videoStreaming);
app.get("/", (req, res) => {
  res.send("Server Connected Successfully");
});
module.exports = router;
