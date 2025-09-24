// utils/notFound.js

/**
 * Middleware para manejar rutas no encontradas (404 Not Found).
 * Crea un error con el código de estado 404 y lo pasa al siguiente middleware de error.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404); // Establece el código de estado a 404
  next(error); // Pasa el error al siguiente middleware (generalmente el errorHandler)
};

module.exports = notFound;