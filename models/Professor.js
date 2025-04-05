const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ProfessorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  institution: {
    type: String,
    required: [true, 'Please add your institution']
  },
  role: {
    type: String,
    default: 'professor'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password before saving
ProfessorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('Professor', ProfessorSchema);