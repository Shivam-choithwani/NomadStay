const multer = require("multer");
const path = require("path");
const fs = require("fs");

const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name" &&
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_KEY !== "your_api_key" &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_API_SECRET !== "your_api_secret";

let avatarStorage;
let listingStorage;
let documentStorage;

if (isCloudinaryConfigured) {
  const cloudinaryConfig = require("../config/cloudinary");
  avatarStorage = cloudinaryConfig.avatarStorage;
  listingStorage = cloudinaryConfig.listingStorage;
  documentStorage = cloudinaryConfig.avatarStorage; // Reuse avatarStorage config for documents
} else {
  // Ensure local directories exist
  const uploadDir = path.join(__dirname, "../uploads");
  const avatarsDir = path.join(uploadDir, "avatars");
  const listingsDir = path.join(uploadDir, "listings");
  const documentsDir = path.join(uploadDir, "documents");

  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });
  if (!fs.existsSync(listingsDir)) fs.mkdirSync(listingsDir, { recursive: true });
  if (!fs.existsSync(documentsDir)) fs.mkdirSync(documentsDir, { recursive: true });

  avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, avatarsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });

  listingStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, listingsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `photo-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });

  documentStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, documentsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `doc-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });
}

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|webp|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error("Only image files (jpg, jpeg, png, webp, gif) are allowed!"), false);
};

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: fileFilter,
});

const listingUpload = multer({
  storage: listingStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: fileFilter,
});

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: fileFilter,
});

module.exports = {
  uploadSingleAvatar: avatarUpload.single("avatar"),
  uploadMultiplePhotos: listingUpload.array("photos", 5),
  uploadSingleGovId: documentUpload.single("idDocument"),
  isCloudinaryConfigured,
};
