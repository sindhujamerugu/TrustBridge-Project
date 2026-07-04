import express from 'express';
import User from '../models/User.js';
import ResidentProfile from '../models/ResidentProfile.js';
import ProviderProfile from '../models/ProviderProfile.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../utils/AppError.js';
import { uploadToCloudinary } from '../utils/cloudinaryUpload.js';

const router = express.Router();

router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  let profile = null;
  if (user.role === 'resident') {
    profile = await ResidentProfile.findOne({ user: user._id });
  } else if (user.role === 'provider') {
    profile = await ProviderProfile.findOne({ user: user._id });
  }
  res.json({ success: true, data: { user, profile } });
}));

// ── Update user basic info ────────────────────────────────────────────────────
router.put('/me', protect, asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'location', 'city', 'avatar'];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.json({ success: true, data: user });
}));

// ── Upload avatar ─────────────────────────────────────────────────────────────
router.post('/me/avatar', protect, upload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No image uploaded', 400);

  let avatarUrl;

  if (process.env.CLOUDINARY_CLOUD_NAME) {
    // Production: upload to Cloudinary
    avatarUrl = await uploadToCloudinary(req.file.buffer, 'trustbridge/avatars');
  } else {
    // Development: resize to max 256×256 and store as base64 data URL
    try {
      const sharp = (await import('sharp')).default;
      const resized = await sharp(req.file.buffer)
        .resize(256, 256, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 85 })
        .toBuffer();
      avatarUrl = `data:image/jpeg;base64,${resized.toString('base64')}`;
    } catch {
      // sharp not available — store original as base64 (works for small files)
      avatarUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl }, { new: true });
  res.json({ success: true, data: user });
}));

// ── Update resident community profile ─────────────────────────────────────────
router.put('/me/community-profile', protect, asyncHandler(async (req, res) => {
  const allowed = ['bio', 'connectionToArea', 'area', 'areasOfExpertise', 'languages', 'specialties'];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const profile = await ResidentProfile.findOneAndUpdate(
    { user: req.user._id },
    { $set: updates },
    { new: true, upsert: true }
  );
  res.json({ success: true, data: profile });
}));

router.get('/residents', asyncHandler(async (req, res) => {
  const { location } = req.query;

  // Return all community members (residents)
  let profiles = await ResidentProfile.find({})
    .populate('user', 'name avatar location city')
    .sort({ createdAt: -1 })
    .limit(100);

  profiles = profiles.filter(p => p.user);

  if (location) {
    profiles = profiles.filter(p =>
      p.area?.toLowerCase().includes(location.toLowerCase()) ||
      p.user?.location?.toLowerCase().includes(location.toLowerCase())
    );
  }

  res.json({ success: true, data: profiles });
}));

// ── Newcomers — users with role=newcomer, no profile collection ───────────────
router.get('/newcomers', asyncHandler(async (req, res) => {
  const { location } = req.query;

  const filter = { role: 'newcomer', isActive: true };
  if (location) {
    filter.location = new RegExp(location, 'i');
  }

  const newcomers = await User.find(filter)
    .select('name avatar location city createdAt')
    .sort({ createdAt: -1 })
    .limit(100);

  res.json({ success: true, data: newcomers });
}));

router.get('/residents/:id', asyncHandler(async (req, res) => {
  const profile = await ResidentProfile.findById(req.params.id)
    .populate('user', 'name avatar location city');
  if (!profile) throw new AppError('Resident not found', 404);
  res.json({ success: true, data: profile });
}));

// ── GET user settings ─────────────────────────────────────────────────────────
router.get('/me/settings', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('settings');
  const defaults = {
    notifications: { email: true, push: true, community: false },
    privacy:       { profileVisible: true, openMessaging: true },
  };
  const settings = {
    notifications: { ...defaults.notifications, ...user?.settings?.notifications?.toObject?.() ?? user?.settings?.notifications },
    privacy:       { ...defaults.privacy,       ...user?.settings?.privacy?.toObject?.()       ?? user?.settings?.privacy       },
  };
  res.json({ success: true, data: settings });
}));

// ── PUT user settings ─────────────────────────────────────────────────────────
router.put('/me/settings', protect, asyncHandler(async (req, res) => {
  const { notifications, privacy } = req.body;
  const update = {};
  if (notifications) {
    if (notifications.email     !== undefined) update['settings.notifications.email']     = notifications.email;
    if (notifications.push      !== undefined) update['settings.notifications.push']      = notifications.push;
    if (notifications.community !== undefined) update['settings.notifications.community'] = notifications.community;
  }
  if (privacy) {
    if (privacy.profileVisible !== undefined) update['settings.privacy.profileVisible'] = privacy.profileVisible;
    if (privacy.openMessaging  !== undefined) update['settings.privacy.openMessaging']  = privacy.openMessaging;
  }
  const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true }).select('settings');
  res.json({ success: true, data: user.settings });
}));

// ── PUT change password ───────────────────────────────────────────────────────
router.put('/me/change-password', protect, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError('Both current and new password are required', 400);
  if (newPassword.length < 8) throw new AppError('New password must be at least 8 characters', 400);

  const user = await User.findById(req.user._id).select('+password');
  if (!user) throw new AppError('User not found', 404);

  const valid = await user.comparePassword(currentPassword);
  if (!valid) throw new AppError('Current password is incorrect', 401);

  user.password = newPassword; // pre-save hook hashes it
  await user.save();

  res.json({ success: true, message: 'Password updated successfully' });
}));

export default router;
