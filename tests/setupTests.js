const mongoose = require('mongoose');
const app = require('../server'); // Import your Express app
require('dotenv').config(); // Ensure dotenv is loaded here for tests

let mongoConnection; // To store the mongoose connection instance

beforeAll(async () => {
  // Use a separate test database URI
  const mongoUri = process.env.MONGO_URI_TEST;

  // Only connect if not already connected (Jest might run this multiple times)
  if (mongoose.connection.readyState === 0) {
    mongoConnection = await mongoose.connect(mongoUri);
    console.log('✅ Conectado a la base de datos de prueba.');
  }

  // Make the app instance globally available to Supertest
  global.app = app;
}, 30000); // Increased timeout for initial connection

afterAll(async () => {
  if (mongoose.connection.readyState === 1) { // Check if connected
    await mongoose.connection.close(); // Close connection
    console.log('✅ Desconectado de la base de datos de prueba.');
  }
});