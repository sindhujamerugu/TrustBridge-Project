import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import ResidentProfile from '../models/ResidentProfile.js';
import ProviderProfile from '../models/ProviderProfile.js';
import { generateTokens } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../utils/AppError.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Google Sign-In ────────────────────────────────────────────────────────────
router.post('/google', asyncHandler(async (req, res) => {
  const { credential, role = 'newcomer' } = req.body;
  if (!credential) throw new AppError('Google credential is required', 400);

  // Verify the ID token with Google
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture, email_verified } = payload;

  if (!email_verified) throw new AppError('Google account email is not verified', 400);

  // Find existing user by googleId or email
  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    // Link Google account to existing local account if not already linked
    if (!user.googleId) {
      user.googleId     = googleId;
      user.authProvider = 'google';
      if (picture && !user.avatar) user.avatar = picture;
      user.isEmailVerified = true;
    }
    if (!user.isActive) throw new AppError('Account deactivated', 403);
  } else {
    // Create new user — default role newcomer, can be overridden by client
    const validRole = ['newcomer', 'resident', 'provider'].includes(role) ? role : 'newcomer';
    user = await User.create({
      name,
      email,
      googleId,
      authProvider: 'google',
      profilePicture: picture || '',
      avatar: picture || '',
      role: validRole,
      isEmailVerified: true,
      city: 'Hyderabad',
    });
    // Create matching profile
    if (validRole === 'resident') {
      await ResidentProfile.create({ user: user._id, area: '', connectionToArea: 'local_resident' });
    } else if (validRole === 'provider') {
      await ProviderProfile.create({
        user: user._id, fullName: name,
        businessName: `${name}'s Business`, phone: '', address: '',
      });
    }
  }

  user.lastLogin = new Date();
  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    data: {
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, location: user.location,
        avatar: user.avatar || user.profilePicture,
      },
      accessToken,
      refreshToken,
    },
  });
}));

router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, location, city } = req.body;

  if (!['newcomer', 'resident', 'provider'].includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  // Password validation — minimum 8 chars, at least one letter and one number
  if (!password || password.length < 8) {
    throw new AppError('Password must be at least 8 characters.', 400);
  }
  if (!/[a-zA-Z]/.test(password)) {
    throw new AppError('Password must contain at least one letter.', 400);
  }
  if (!/[0-9]/.test(password)) {
    throw new AppError('Password must contain at least one number.', 400);
  }

  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already registered', 400);

  const user = await User.create({
    name, email, password, role, phone, location, city: city || 'Hyderabad',
  });

  try {
    if (role === 'resident') {
      const connectionToArea = req.body.connection
        ? req.body.connection.toLowerCase().replace(/ /g, '_')
        : 'local_resident';
      await ResidentProfile.create({ user: user._id, area: location || '', connectionToArea });
    } else if (role === 'provider') {
      await ProviderProfile.create({
        user: user._id,
        businessName: req.body.businessName || `${name}'s Business`,
        fullName: name,
        phone: phone || '',
        address: location || '',
      });
    }
  } catch (profileErr) {
    // Roll back: delete the just-created User so the email isn't permanently locked
    await User.findByIdAndDelete(user._id).catch(() => {});
    throw new AppError(
      profileErr.message?.includes('validation failed')
        ? `Profile creation failed: ${profileErr.message}`
        : 'Registration failed. Please try again.',
      400
    );
  }

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.status(201).json({
    success: true,
    data: {
      user: { id: user._id, name: user.name, email: user.email, role: user.role, location: user.location },
      accessToken,
      refreshToken,
    },
  });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.isActive) throw new AppError('Account deactivated', 403);

  user.lastLogin = new Date();
  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    data: {
      user: { id: user._id, name: user.name, email: user.email, role: user.role, location: user.location, avatar: user.avatar },
      accessToken,
      refreshToken,
    },
  });
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('Refresh token required', 400);

  const jwt = await import('jsonwebtoken');
  const decoded = jwt.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  const tokens = generateTokens(user._id);
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, data: tokens });
}));

router.post('/logout', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const jwt = await import('jsonwebtoken');
    try {
      const decoded = jwt.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
    } catch { /* ignore */ }
  }
  res.json({ success: true, message: 'Logged out' });
}));

// ── Upgrade own account to provider role ─────────────────────────────────────
// Allows any authenticated user to switch to provider role.
// Returns fresh tokens so the new role takes effect immediately.
router.post('/become-provider', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) throw new AppError('Not authorized', 401);

  const jwt = await import('jsonwebtoken');
  const decoded = jwt.default.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('User not found', 404);

  // Update role
  user.role = 'provider';
  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Ensure ProviderProfile exists
  let profile = await ProviderProfile.findOne({ user: user._id });
  if (!profile) {
    profile = await ProviderProfile.create({
      user:         user._id,
      fullName:     user.name,
      businessName: req.body.businessName || `${user.name}'s Business`,
      phone:        user.phone || '',
    });
  }

  res.json({
    success: true,
    message: 'Role upgraded to provider. Please use the new tokens.',
    data: {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    },
  });
}));

export default router;
