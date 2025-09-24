module.exports = {
  preset: '@shelf/jest-mongodb',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setupTests.js'],
  testTimeout: 30000, // Aumenta el timeout para pruebas de DB si es necesario
};
