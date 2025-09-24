// utils/uploadGCS.js
const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');

// 💡 Leer las credenciales de Google desde las variables de entorno de Render
const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS[0] == '{' ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS) : require("../"+process.env.GOOGLE_APPLICATION_CREDENTIALS);

// Inicializar el cliente de Storage con las credenciales
const storage = new Storage({ credentials });

const bucketName = process.env.GCS_BUCKET_NAME;

const uploadToGCS = async (file, fileName) => {
  if (!bucketName) {
    throw new Error('GCS_BUCKET_NAME no está definido en las variables de entorno.');
  }

  // Crea un archivo en el bucket
  const blob = storage.bucket(bucketName).file(fileName);
  const blobStream = blob.createWriteStream({
    resumable: false,
    contentType: file.mimetype,
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (err) => reject(err));

    blobStream.on('finish', () => {
      // La URL pública de la imagen
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};

// 💡 Esta función es importante para generar URLs prefirmadas seguras para la visualización
// En lugar de una URL pública permanente, genera una URL temporal y segura.
const getSignedGCSUrl = async (fileName) => {
  if (!bucketName) {
    throw new Error('GCS_BUCKET_NAME no está definido en las variables de entorno.');
  }
  const options = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000, // La URL expira en 15 minutos
  };
  const [url] = await storage.bucket(bucketName).file(fileName).getSignedUrl(options);
  return url;
};

module.exports = {
  uploadToGCS,
  getSignedGCSUrl,
};