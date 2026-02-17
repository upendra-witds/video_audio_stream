const multer = require("multer");
const path = require("path");

const Audiostorage = multer.diskStorage({
  destination: "src/uploads/audios/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const uploadAudioFile = ({
  allowedTypes = [],
  maxSize = 150 * 1024 * 1024,
}) => {
  const fileFilter = (req, file, cb) => {
    const ext = file.originalname.split(".").pop().toLowerCase();

    if (!allowedTypes.includes(ext)) {
      return cb(new Error("Invalid file type"), false);
    }

    cb(null, true);
  };

  return multer({
    storage: Audiostorage, // ✅ FIXED
    limits: { fileSize: maxSize },
    fileFilter,
  });
};


const storage = multer.diskStorage({
  destination: "src/uploads/videos/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const uploadVideo = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("video/")) {
      return cb(new Error("Only videos allowed"), false);
    }
    cb(null, true);
  },
});


module.exports = { uploadAudioFile, uploadVideo };
