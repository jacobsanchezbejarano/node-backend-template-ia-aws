const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUserProfile, deleteUser, getProfile, linkParent, getMyDescendants, getUsersByHierarchy } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize, personalInfo } = require('../middleware/authorize');

router.route('/profile')
  .get(protect, personalInfo, getProfile); // Obtener perfil del usuario autenticado

router.route('/subordinates')
  .get(protect, authorize('admin', 'jefe_circunscripcion', 'jefe_distrito', 'jefe_recinto'), getUsersByHierarchy);

router.route('/link_parent')
  .post(protect, linkParent);

router.route('/my_descendants')
  .get(protect, getMyDescendants);

router.route('/')
  .get(protect, authorize('admin'), getUsers); // Obtener todos los usuarios

router.route('/:id')
  .get(protect, authorize('admin', 'jefe_circunscripcion', 'jefe_distrito', 'jefe_recinto'), getUserById) // Obtener usuario por ID
  .put(protect, authorize('admin', 'jefe_circunscripcion', 'jefe_distrito', 'jefe_recinto'), updateUserProfile) // Actualizar usuario por ID
  .delete(protect, authorize('admin'), deleteUser); // Eliminar usuario por ID

module.exports = router;