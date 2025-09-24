const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        // message: `User role ${req.user ? req.user.role : 'unauthenticated'} is not authorized to access this route.`
        message: `Not authorized to access this route`
      });
    }
    next();
  };
};

const personalInfo = (req, res, next) => {
  // Asegúrate de que el usuario esté autenticado y su objeto esté en 'req'
  if (!req.user) {
    return res.status(401).json({ message: 'No estás autenticado. Por favor, inicia sesión.' });
  }
  
  next();
};

module.exports = { authorize, personalInfo };