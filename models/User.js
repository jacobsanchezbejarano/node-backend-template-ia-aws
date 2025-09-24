const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'jefe_circunscripcion', 'jefe_distrito', 'jefe_recinto', 'delegado_mesa', ''],
    default: ''
  },
  idRecinto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recinto',
  },
  idMesa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mesa',
  },
  // Campos adicionales según el rol
  circunscripcionId: { // Para jefe_circunscripcion
    type: Number, // Asumiendo que es numérico como en tu data
    ref: 'Recinto' // Referencia lógica, no foránea en NoSQL
  },
  distritoId: { // Para jefe_distrito
    type: Number
  },
  recintoId: { // Para jefe_recinto, delegado_mesa
    type: Number,
    ref: 'Recinto'
  },
  idLoc: { // Para jefe_recinto, delegado_mesa
    type: Number,
    ref: 'Recinto'
  },
  mesaNumero: { // Para delegado_mesa
    type: Number
  },
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: true
  },
  latitud: {
    type: String,
    required: true
  },
  longitud: {
    type: String,
    required: true
  },
  parent_code: {
    type: String,
  },
  personal_code: {
    type: String,
    required: true
  },
  registered_by: {
    type: String,
  },
  department: {
    type: Number,
    required: true
  }
});

// Encriptar contraseña antes de guardar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Comparar contraseña
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add a toJSON transformation to exclude hashedPassword
UserSchema.set('toJSON', {
    transform: (doc, ret) => {
      delete ret.password;
      return ret;
    },
});


module.exports = mongoose.model('User', UserSchema);