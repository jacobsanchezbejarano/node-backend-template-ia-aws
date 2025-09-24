const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Obtener todos los usuarios (solo Admin)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password'); // No devolver contraseñas
  res.json(users);
});

// @desc    Obtener un usuario por ID, con control de acceso jerárquico
// @route   GET /api/users/:id
// @access  Private
const getUserById = asyncHandler(async (req, res) => {
  const requestingUser = req.user;
  const targetUserId = req.params.id;

  const user = await User.findById(targetUserId)
    .select('-password')
    .populate('idRecinto')
    .populate('idMesa');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // 1. Verificar si el usuario solicitante tiene permiso para ver el perfil
  let hasPermission = false;

  // Un administrador puede ver a cualquiera
  if (requestingUser.role === 'admin') {
    hasPermission = true;
  }
  // Un jefe de circunscripción puede ver a usuarios dentro de su jurisdicción
  else if (requestingUser.role === 'jefe_circunscripcion') {
    if (requestingUser.circunscripcionId === user.circunscripcionId) {
      hasPermission = true;
    }
  }
  // Un jefe de distrito puede ver a usuarios dentro de su distrito
  else if (requestingUser.role === 'jefe_distrito') {
    if (requestingUser.distritoId === user.distritoId) {
      hasPermission = true;
    }
  }
  // Un jefe de recinto puede ver a usuarios dentro de su recinto
  else if (requestingUser.role === 'jefe_recinto') {
    if (requestingUser.recintoId === user.recintoId) {
      hasPermission = true;
    }
  }
  // Cualquier usuario puede ver su propio perfil
  else if (requestingUser._id.toString() === user._id.toString()) {
    hasPermission = true;
  }

  // 2. Si el permiso es denegado, enviar un error 403
  if (!hasPermission) {
    return res.status(403).json({ message: "No tienes autorización para ver este perfil." });
  }

  // 3. Si tiene permiso, enviar los datos del usuario
  res.json(user);
});

// @desc    Obtener el perfil del usuario autenticado
// @route   GET /api/users/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').populate('idRecinto').populate('idMesa');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Actualizar perfil de usuario (solo Admin o el propio usuario)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUserProfile = asyncHandler(async (req, res) => {
  const userToUpdate = await User.findById(req.params.id);

  if (userToUpdate) {
    // Si el usuario no es admin y no está actualizando su propio perfil
    // if (req.user.role !== 'admin' && req.user._id.toString() !== userToUpdate._id.toString()) {
    //   return res.status(403).json({ message: "No tienes autorización para actualizar este perfil." });
    // }

    // Permitir al admin actualizar roles y asignaciones
    if (req.user.role === 'admin') {
      if (userToUpdate.role === 'admin' && userToUpdate._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Un administrador no puede editar el perfil de otro administrador." });
      }
      userToUpdate.role = req.body.role || userToUpdate.role;
      userToUpdate.circunscripcionId = req.body.circunscripcionId || userToUpdate.circunscripcionId;
      userToUpdate.idLoc = req.body.idLoc || userToUpdate.idLoc;
      userToUpdate.distritoId = req.body.distritoId || userToUpdate.distritoId;
      userToUpdate.recintoId = req.body.recintoId || userToUpdate.recintoId;
      userToUpdate.mesaNumero = req.body.mesaNumero || userToUpdate.mesaNumero;
      userToUpdate.idRecinto = req.body.idRecinto || userToUpdate.idRecinto;
      userToUpdate.idMesa = req.body.idMesa || userToUpdate.idMesa;
    } else if(req.user.role === 'jefe_circunscripcion') {
      // Un jefe de circunscripción solo puede actualizar roles y datos de usuarios en su misma circunscripción
      if (userToUpdate.circunscripcionId.toString() !== req.user.circunscripcionId.toString()) {
        return res.status(403).json({ message: "No tienes autorización para actualizar a un usuario fuera de tu circunscripción." });
      }

      // Restringir qué roles puede asignar un jefe de circunscripción
      const allowedRoles = ['jefe_distrito', 'jefe_recinto', 'delegado_mesa'];
      if (req.body.role && !allowedRoles.includes(req.body.role)) {
        return res.status(400).json({ message: "No puedes asignar este rol." });
      }

      // Aplicar los cambios, restringiendo el rol a los permitidos
      userToUpdate.username = req.body.username || userToUpdate.username;
      if (req.body.role) {
        userToUpdate.role = req.body.role;
      }
      userToUpdate.idLoc = req.body.idLoc || userToUpdate.idLoc;
      userToUpdate.distritoId = req.body.distritoId || userToUpdate.distritoId;
      userToUpdate.recintoId = req.body.recintoId || userToUpdate.recintoId;
      userToUpdate.mesaNumero = req.body.mesaNumero || userToUpdate.mesaNumero;
      userToUpdate.idRecinto = req.body.idRecinto || userToUpdate.idRecinto;
      userToUpdate.idMesa = req.body.idMesa || userToUpdate.idMesa;
    // Lógica para el 'jefe_distrito'
    } else if (req.user.role === 'jefe_distrito') {
      if (userToUpdate.distritoId.toString() !== req.user.distritoId.toString()) {
        return res.status(403).json({ message: "No tienes autorización para actualizar a un usuario fuera de tu distrito." });
      }

      const allowedRoles = ['jefe_recinto', 'delegado_mesa'];
      if (req.body.role && !allowedRoles.includes(req.body.role)) {
        return res.status(400).json({ message: "No puedes asignar este rol." });
      }
      
      userToUpdate.username = req.body.username || userToUpdate.username;
      if (req.body.role) {
        userToUpdate.role = req.body.role;
      }
      userToUpdate.recintoId = req.body.recintoId || userToUpdate.recintoId;
      userToUpdate.mesaNumero = req.body.mesaNumero || userToUpdate.mesaNumero;
      userToUpdate.idRecinto = req.body.idRecinto || userToUpdate.idRecinto;
      userToUpdate.idMesa = req.body.idMesa || userToUpdate.idMesa;

    // Lógica para el 'jefe_recinto'
    } else if (req.user.role === 'jefe_recinto') {
      if (userToUpdate.recintoId.toString() !== req.user.recintoId.toString()) {
        return res.status(403).json({ message: "No tienes autorización para actualizar a un usuario fuera de tu recinto." });
      }

      const allowedRoles = ['delegado_mesa'];
      if (req.body.role && !allowedRoles.includes(req.body.role)) {
        return res.status(400).json({ message: "No puedes asignar este rol." });
      }

      userToUpdate.username = req.body.username || userToUpdate.username;
      if (req.body.role) {
        userToUpdate.role = req.body.role;
      }
      userToUpdate.mesaNumero = req.body.mesaNumero || userToUpdate.mesaNumero;
      userToUpdate.idMesa = req.body.idMesa || userToUpdate.idMesa;

    // Lógica para un usuario normal (o si no tiene rol jerárquico)
    } else if (req.user._id.toString() !== userToUpdate._id.toString()) {
      // Un usuario normal solo puede actualizar su nombre, apellido (quizás su password)
      userToUpdate.username = req.body.username || userToUpdate.username;
      userToUpdate.nombre = req.body.nombre || userToUpdate.nombre;
      userToUpdate.apellido = req.body.apellido || userToUpdate.apellido;
      // No permitir que un usuario normal cambie su rol o asignaciones críticas
    }

    // if (req.body.password) {
    //   userToUpdate.password = req.body.password; // Mongoose pre-save hook se encargará del hash
    // }

    const updatedUser = await userToUpdate.save();

    res.json({
      _id: updatedUser._id,
      role: updatedUser.role,
      circunscripcionId: updatedUser.circunscripcionId,
      distritoId: updatedUser.distritoId,
      recintoId: updatedUser.recintoId,
      mesaNumero: updatedUser.mesaNumero,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Eliminar un usuario (solo Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// --- Lógica Auxiliar Recursiva (Adaptada de Python a Node.js) ---
const findDescendantsRecursive = async (userId) => {
  const descendants = [];
  const directChildren = await User.find({ registered_by: userId }).select('-password');

  for (const child of directChildren) {
    const childData = {
      id: child._id,
      username: child.username,
      nombre: child.nombre,
      apellido: child.apellido,
      latitud: child.latitud,
      longitud: child.longitud,
      personal_code: child.personal_code,
      department: child.department,
      circunscripcionId: child.circunscripcionId,
      children: await findDescendantsRecursive(child._id),
    };
    descendants.push(childData);
  }
  return descendants;
};

// --- Controladores de Rutas (Adaptados de Python a Node.js) ---

// @desc    Vincular a un usuario con un padre mediante código personal
// @route   POST /api/users/link_parent
// @access  Private
const linkParent = asyncHandler(async (req, res) => {
  const { parent_code } = req.body;
  const current_user_id = req.user._id;

  if (!parent_code) {
    res.status(400);
    throw new Error('El código del padre es requerido.');
  }

  const current_user = await User.findById(current_user_id);
  if (!current_user) {
    res.status(404);
    throw new Error('Usuario no encontrado.');
  }

  if (current_user.registered_by) {
    res.status(409); // 409 Conflict
    throw new Error('Ya estás vinculado a un padre.');
  }

  const parent_user = await User.findOne({ personal_code: parent_code });
  if (!parent_user) {
    res.status(404);
    throw new Error('Código de padre inválido.');
  }

  if (parent_user._id.toString() === current_user_id.toString()) {
    res.status(400);
    throw new Error('No puedes vincularte a ti mismo.');
  }

  current_user.registered_by = parent_user._id;
  current_user.parent_code = parent_code;
  await current_user.save();

  res.status(200).json({ message: 'Vinculado al padre exitosamente.' });
});

// @desc    Obtener todos los descendientes del usuario autenticado
// @route   GET /api/users/my_descendants
// @access  Private
const getMyDescendants = asyncHandler(async (req, res) => {
  const current_user_id = req.user._id;

  const descendants = await findDescendantsRecursive(current_user_id);

  res.status(200).json({ descendants });
});

// @desc   Get a list of subordinate users based on the user's role
// @route   GET /api/users/subordinates
// @access  Private
const getUsersByHierarchy = asyncHandler(async (req, res) => {
  const { role, circunscripcionId, distritoId, recintoId } = req.user;
  let query = {};

  switch (role) {
    case 'admin':
      // Admins see all users except themselves
      query = { _id: { $ne: req.user._id } };
      break;
    case 'jefe_circunscripcion':
      // Jefe de circunscripción sees users in their circumscription
      // and with a role lower than theirs.
      query = {
        circunscripcionId: circunscripcionId,
        role: { $in: ['jefe_distrito', 'jefe_recinto', 'delegado_mesa', ''] }
      };
      break;
    case 'jefe_distrito':
      // Jefe de distrito sees users in their district with lower roles.
      query = {
        distritoId: distritoId,
        role: { $in: ['jefe_recinto', 'delegado_mesa', ''] }
      };
      break;
    case 'jefe_recinto':
      // Jefe de recinto sees users in their recinto with lower roles.
      query = {
        recintoId: recintoId,
        role: { $in: ['delegado_mesa', ''] }
      };
      break;
    default:
      // Other users see no subordinates
      return res.json([]);
  }

  const subordinates = await User.find(query).select('-password');
  res.json(subordinates);
});

module.exports = { getUsers, getUserById, updateUserProfile, deleteUser, getProfile, linkParent, getMyDescendants, getUsersByHierarchy };