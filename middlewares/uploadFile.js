const multer = require("multer");
const path = require("path");
const fs = require("fs");

const getStorage = (folderName) =>
  multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(__dirname, "..", "uploads", folderName);
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  });

const uploadFile = (folderName, fieldName = "attachments") => {
  return multer({
    storage: getStorage(folderName),
  }).array(fieldName);
};

module.exports = uploadFile;
