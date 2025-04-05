const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  password: { 
    type: String, 
    required: true,
    minlength: 8,
    select: false // Never return password in queries
  },
  avatar: { 
    type: String, 
    default: '/default-avatar.png',
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  name: {
    type: String, 
    required: true,
    trim: true,
    maxlength: 50
  },
  role: {
    type: String,
    required: true,
    enum: ['student', 'professor'],
    default: 'student'
  },
  institution: {
    type: String,
    required: function() {
      return this.role === 'professor';
    },
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  }
}, { 
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ institution: 1 });

module.exports = mongoose.model('User', UserSchema);