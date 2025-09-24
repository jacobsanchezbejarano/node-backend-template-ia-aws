const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser); // Admin debería poder registrar usuarios
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser); // Requiere autenticación para confirmar logout

module.exports = router;