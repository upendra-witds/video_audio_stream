const express = require("express");
const router = express.Router();

const { videoStreaming, streamAudio } = require("../controller/videoStreaming");

router.get("/audio-streaming", streamAudio);
router.get("/video-streaming", videoStreaming);

module.exports = router;
