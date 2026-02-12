require("dotenv").config();
const path = require("path");
const fs = require("fs");
// const { number } = require('joi');

const videoStreaming = async (req, res) => {
  const videopath = path.join(__dirname, "../uploads/videos", "A_Journey.mp4");

  try {
    const stat = await fs.promises.stat(videopath);
    const fileSize = stat.size;

    const range = req.headers.range;
    if (!range) {
      return res.status(416).send("Range header required");
    }

    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      return res.status(416).send("Requested range not satisfiable");
    }

    const contentLength = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    });

    const stream = fs.createReadStream(videopath, { start, end });
    stream.pipe(res);
  } catch (err) {
    res.status(500).send("Server error");
  }
};

const streamAudio = async (req, res) => {
  const audioPath = path.join(
    __dirname,
    "../uploads/audios",
    "audio.webm", // change to your audio file
  );

  try {
    const stat = await fs.promises.stat(audioPath);
    const fileSize = stat.size;

    const range = req.headers.range;

    if (!range) {
      return res.status(416).send("Range header required");
    }

    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      return res.status(416).send("Requested range not satisfiable");
    }

    const contentLength = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "audio/mpeg", // important change
    });

    const stream = fs.createReadStream(audioPath, { start, end });
    stream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

module.exports = { videoStreaming, streamAudio };
