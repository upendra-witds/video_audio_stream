const express = require("express");
const router = express.Router();
const { uploadAudioFile, uploadVideo } = require("../validation/checkFiles");
const {
  videoStreaming,
  streamAudio,
  uploadFile,
  // stream,
  uploadAudio,
} = require("../controller/videoStreaming");

router.get("/audio-streaming", streamAudio);
router.get("/video-streaming", videoStreaming);
app.get("/", (req, res) => {
  res.status(200).json("Server Connected Successfully");
});



const audioUpload = uploadAudioFile({
  allowedTypes: ["mp4", "mp3", "aac", "wav"],
  maxSize: 5 * 1024 * 1024,
});

router.post("/upload-file", uploadVideo.single("video"), uploadFile);
router.post("/upload-audio", audioUpload.single("audioFile"), uploadAudio);
module.exports = router;
