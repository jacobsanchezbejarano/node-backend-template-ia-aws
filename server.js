// server.js (your main Express app file)

// Ensure these are at the top or imported as needed
require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Assuming you have CORS
const userRoutes = require('./routes/userRoutes'); // Adjust paths as needed
const authRoutes = require('./routes/authRoutes');
const recintoRoutes = require('./routes/recintoRoutes');
const mesaRoutes = require('./routes/mesaRoutes');
const actaRoutes = require('./routes/actaRoutes');
const errorHandler = require('./utils/errorHandler');
const notFound = require('./utils/notFound');
const app = express();
const rateLimiterMiddleware = require('./middleware/rateLimiter');

// Middleware
app.use(rateLimiterMiddleware);
app.use(express.json()); // For parsing application/json
app.use(cors());

// Conditional MongoDB Connection (as discussed in previous answer)
const connectDB = async () => {
  // If a connection is already open (e.g., from Jest setup) OR if in a test environment, do not reconnect.
  if (process.env.NODE_ENV === 'test') {
    console.log('ℹ️ MongoDB already connected or in test environment, skipping connection in server.js.');
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI); // Use your main DB URI
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};
connectDB(); // Call the connection function

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recintos', recintoRoutes);
app.use('/api/mesas', mesaRoutes);
app.use('/api/actas', actaRoutes);

// Error Handling Middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Conditional Server Listening
// This block ensures the server only starts listening on a port
// when not in a Jest test environment.
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
}

// Export the app instance for testing
module.exports = app;