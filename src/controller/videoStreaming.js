require("dotenv").config();
const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
// const { number } = require('joi');

const videoStreaming = async (req, res) => {
  const videopath = path.join(__dirname, "../uploads/videos", "A_Journey.mp4");

  try {
    const stat = await fs.promises.stat(videopath);
    const fileSize = stat.size;

    const range = req.headers.range;
    if (!range) {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    });
    fs.createReadStream(videopath).pipe(res);
    return;
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
       res.writeHead(200, {
         "Content-Length": fileSize,
         "Content-Type": "video/mp4",
       });
       fs.createReadStream(audioPath).pipe(res);
       return;
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

const uploadAudio = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const filePath = req.file.path;
    const fileId = req.file.filename;
    const outputDir = path.join(__dirname, "../public/audios", fileId);

    // Save initial record in DB
    // await UploadFile.create({
    //   fileId,
    //   originalName: req.file.originalname,
    //   status: "processing",
    // });

    // Wait for audio processing to finish
    await processAudio(filePath, outputDir);

    // Update DB after processing
    // await UploadFile.findOneAndUpdate(
    //   { fileId },
    //   { status: "completed", formats: ["aac", "mp3"] },
    //   { new: true },
    // );

    // Send response only after everything is done
    res.json({
      message: "Upload and processing completed",
      fileId,
      hlsMaster: `/streams/${fileId}/master.m3u8`, // optional: you can generate a master playlist separately
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error processing audio", error: err.message });
  }
};


const uploadFile = async (req, res) => {
  // const session = await mongoose.startSession();
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;
    const videoId = path.parse(fileName).name;
    const outputPath = path.join(__dirname, "../public/streams", videoId);
    // session.startTransaction();
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
     const fileUpload ={
       fileName: fileName,
       fileId: videoId,
       filePath: filePath,
     };
    // const fileUpload = await uploadFiles.create({
    //   fileName: fileName,
    //   fileId: videoId,
    //   filePath: filePath,
    // });
    await processVideo(filePath, outputPath, videoId);

    // session.commitTransaction();
    res.json({
      message: "Upload successful",
      data: fileUpload,
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    // session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    // session.endSession();
  }
};

function processAudio(filePath, outputDir) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const bitrates = [64, 128, 256];
    const formats = ["aac", "mp3"];
    const tasks = [];

    formats.forEach((format) => {
      bitrates.forEach((bitrate) => {
        const formatDir = path.join(outputDir, `${format}_${bitrate}k`);
        if (!fs.existsSync(formatDir))
          fs.mkdirSync(formatDir, { recursive: true });

        const outputPlaylist = path.join(formatDir, "index.m3u8");
        const segmentPattern = path.join(formatDir, "segment_%03d.ts");

        const task = new Promise((res, rej) => {
          ffmpeg(filePath)
            .outputOptions([
              "-vn", // no video
              "-c:a " + (format === "aac" ? "aac" : "libmp3lame"),
              `-b:a ${bitrate}k`,
              "-f hls",
              "-hls_time 10",
              "-hls_playlist_type vod",
              `-hls_segment_filename ${segmentPattern}`,
            ])
            .output(outputPlaylist)
            .on("start", (cmd) => console.log("FFmpeg started:", cmd))
            .on("error", (err) => rej(err))
            .on("end", () => res())
            .run();
        });

        tasks.push(task);
      });
    });

    Promise.all(tasks)
      .then(() => {
        // Create master playlist
        let master = "#EXTM3U\n#EXT-X-VERSION:3\n\n";

        formats.forEach((format) => {
          bitrates.forEach((bitrate) => {
            const bandwidth = bitrate * 1000;

            const codec = format === "aac" ? "mp4a.40.2" : "mp4a.40.34";

            master += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},CODECS="${codec}"\n`;
            master += `${format}_${bitrate}k/index.m3u8\n\n`;
          });
        });

        fs.writeFileSync(path.join(outputDir, "master.m3u8"), master);

        console.log("master.m3u8 generated");

        resolve();
      })
      .catch(reject);
  });
}


function processVideo(inputPath, outputPath, videoId) {
  return new Promise((resolve, reject) => {
    const outputDir = outputPath.replace(/\\/g, "/");

    ffmpeg(inputPath)
      .outputOptions([
        "-preset",
        "veryfast",
        "-g",
        "48",
        "-sc_threshold",
        "0",

        "-map",
        "0:v",
        "-map",
        "0:a?",
        "-b:v:0",
        "800k",
        "-s:v:0",
        "640x360",

        "-map",
        "0:v",
        "-map",
        "0:a?",
        "-b:v:1",
        "2500k",
        "-s:v:1",
        "1280x720",

        "-map",
        "0:v",
        "-map",
        "0:a?",
        "-b:v:2",
        "5000k",
        "-s:v:2",
        "1920x1080",

        "-f",
        "hls",
        "-hls_time",
        "10",
        "-hls_playlist_type",
        "vod",

        "-master_pl_name",
        "master.m3u8",

        "-var_stream_map",
        "v:0,a:0 v:1,a:1 v:2,a:2",

        "-hls_segment_filename",
        `${outputDir}/%v/segment_%03d.ts`,
      ])

      .output(`${outputDir}/%v/index.m3u8`)

      .on("start", (cmd) => {
        console.log("FFmpeg started:", cmd);
      })

      .on("error", (err) => {
        console.error("FFmpeg error:", err.message);
        reject(err); // ❌ reject promise on error
      })

      .on("end", async () => {
        console.log("All qualities generated.");

        // await uploadFiles.findOneAndUpdate(
        //   { fileId: videoId },
        //   { status: "completed" },
        // );

        resolve(); // ✅ resolve promise when done
      })

      .run();
  });
}

module.exports = { videoStreaming, streamAudio, uploadAudio, uploadFile };
