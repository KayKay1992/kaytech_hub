const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin', 'member'],
    default: 'member',
  },
  photo_url: {
    type: String,
    default: '',
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// Virtual `password` setter — lets controllers do `user.password = plain`
// and have it hashed automatically on save, without ever storing the plaintext.
userSchema.virtual('password').set(function (value) {
  this._password = value;
});

// Runs before validation so `password_hash` (required) is populated in time.
userSchema.pre('validate', async function (next) {
  if (!this._password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this._password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password_hash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
