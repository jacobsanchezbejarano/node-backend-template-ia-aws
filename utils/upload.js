// Uploading files to AWS S3 using multer and AWS SDK v3
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
//   DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multer = require("multer");
const dotenv = require("dotenv");
dotenv.config();

const { v4: uuidv4 } = require("uuid");
const path = require("path");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const upload = multer({ storage: multer.memoryStorage() });

const generateUniqueFilename = (originalname) => {
  const fileExtension = path.extname(originalname);
  const uniqueId = uuidv4();
  return `${uniqueId}${fileExtension}`;
};

const getSignedImageUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: key,
  });
  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // Expira en 1 hora
  return signedUrl;
};


const uploadToS3 = async (file) => {
  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: `actas/${generateUniqueFilename(file.originalname)}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3.send(new PutObjectCommand(params));
  return `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
};

// const deleteFromS3 = async (url) => {
//   if (!url) return;

//   const urlObj = new URL(url);
//   let key = urlObj.pathname.substring(1);

//   if (url.includes(".s3.amazonaws.com")) {
//     const bucketSegment = url.split(".s3.amazonaws.com")[0].split("//")[1];
//     key = key.replace(`${bucketSegment}/`, "");
//   }

//   try {
//     await s3.send(
//       new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET, Key: key })
//     );
//   } catch (err) {
//     console.error("Deletion failed:", {
//       error: err.message,
//       stack: err.stack,
//     });
//     throw err;
//   }
// };

module.exports = { upload, uploadToS3, getSignedImageUrl };
