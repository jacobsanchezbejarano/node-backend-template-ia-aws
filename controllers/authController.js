const User = require('../models/User');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');

// Generar JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d', // Token expira en 1 dia
  });
};


function generatePersonalCode() {
  return uuidv4().substring(0, 8).toUpperCase();
}

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Public (inicialmente para admin que registra, luego restringir)
const registerUser = asyncHandler(async (req, res) => {
  const { 
          username, password, role, 
          nombre, apellido, circunscripcionId, 
          distritoId, recintoId, idLoc, mesaNumero,
          latitud,
          longitud,
          department,
          idRecinto
        } = req.body;

  const personal_code = generatePersonalCode();
  // Validar si el usuario ya existe
  const userExists = await User.findOne({ username });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Crear usuario
  const user = await User.create({
    username,
    password,
    role,
    nombre,
    apellido,
    circunscripcionId,
    distritoId,
    recintoId,
    idLoc,
    mesaNumero,
    latitud,
    longitud,
    personal_code,
    department,
    idRecinto
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      role: user.role,
      nombre: user.nombre,
      apellido: user.apellido,
      circunscripcionId: user.circunscripcionId,
      distritoId: user.distritoId,
      recintoId: user.recintoId,
      idLoc: user.idLoc,
      mesaNumero: user.mesaNumero,
      latitud: user.latitud,
      longitud: user.longitud,
      personal_code: user.personal_code,
      department: user.department,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Autenticar un usuario y obtener token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Buscar usuario
  const user = await User.findOne({ username });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      nombre: user.nombre,
      apellido: user.apellido,
      circunscripcionId: user.circunscripcionId, // Incluir IDs relevantes para el frontend
      distritoId: user.distritoId,
      recintoId: user.recintoId,
      idLoc: user.idLoc,
      mesaNumero: user.mesaNumero,
      latitud: user.latitud,
      longitud: user.longitud,
      personal_code: user.personal_code,
      department: user.department,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid credentials');
  }
});

// @desc    Cerrar sesión de usuario (el frontend se encarga de eliminar el token)
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  // En el backend, esto es principalmente una confirmación.
  // La lógica real de logout (eliminar token) ocurre en el frontend.
  res.json({ message: 'Logged out successfully' });
});

module.exports = { registerUser, loginUser, logoutUser };