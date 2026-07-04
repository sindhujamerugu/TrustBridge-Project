import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ['newcomer', 'resident', 'provider', 'admin'],
      required: true,
    },
    avatar: { type: String, default: '' },
    location: { type: String, default: '' },
    city: { type: String, default: 'Hyderabad' },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    refreshToken: { type: String, select: false },
    lastLogin: Date,
    deviceFingerprint: String,
    settings: {
      notifications: {
        email:     { type: Boolean, default: true  },
        push:      { type: Boolean, default: true  },
        community: { type: Boolean, default: false },
      },
      privacy: {
        profileVisible: { type: Boolean, default: true },
        openMessaging:  { type: Boolean, default: true },
      },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
