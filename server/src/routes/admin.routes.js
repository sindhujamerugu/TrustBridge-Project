import express from 'express';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import Report from '../models/Report.js';
import ResidentProfile from '../models/ResidentProfile.js';
import ProviderProfile from '../models/ProviderProfile.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../utils/AppError.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/analytics', asyncHandler(async (req, res) => {
  const [
    totalUsers, newcomers, residents, providers,
    totalServices, activeServices, totalBookings,
    pendingReviews, openReports, flaggedReviews,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'newcomer' }),
    User.countDocuments({ role: 'resident' }),
    User.countDocuments({ role: 'provider' }),
    Service.countDocuments(),
    Service.countDocuments({ isVisible: true }),
    Booking.countDocuments(),
    ProviderProfile.countDocuments({ verificationStatus: 'manual_review' }),
    Report.countDocuments({ status: 'open' }),
    Review.countDocuments({ status: { $in: ['pending_review', 'blocked'] } }),
  ]);

  const recentBookings = await Booking.find()
    .populate('service', 'title')
    .sort({ createdAt: -1 })
    .limit(10);

  const recentServices = await Service.find({ isVisible: true })
    .populate({ path: 'providerProfile', select: 'businessName fullName' })
    .populate('provider', 'name')
    .sort({ createdAt: -1 })
    .limit(8)
    .select('title category provider providerProfile createdAt');

  res.json({
    success: true,
    data: {
      users: { total: totalUsers, newcomers, residents, providers },
      services: { total: totalServices, active: activeServices },
      bookings: { total: totalBookings, recent: recentBookings },
      moderation: { pendingReviews, openReports, flaggedReviews },
      recentServices,
    },
  });
}));

router.get('/users', asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    // Escape user input before using in regex to prevent ReDoS
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: new RegExp(escaped, 'i') },
      { email: new RegExp(escaped, 'i') },
    ];
  }

  const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: users });
}));

router.patch('/users/:id', asyncHandler(async (req, res) => {
  const { isActive, role } = req.body;
  const allowed = {};
  if (isActive !== undefined) allowed.isActive = isActive;
  if (role && ['newcomer','resident','provider','admin'].includes(role)) allowed.role = role;
  const user = await User.findByIdAndUpdate(req.params.id, allowed, { new: true });
  if (!user) throw new AppError('User not found', 404);
  // Ensure ProviderProfile exists when upgrading to provider
  if (role === 'provider') {
    const ProviderProfile = (await import('../models/ProviderProfile.js')).default;
    await ProviderProfile.findOneAndUpdate({ user: user._id }, { user: user._id }, { upsert: true });
  }
  res.json({ success: true, data: user });
}));

router.get('/providers/pending', asyncHandler(async (req, res) => {
  const providers = await ProviderProfile.find({ verificationStatus: 'manual_review' })
    .populate('user', 'name email phone');
  res.json({ success: true, data: providers });
}));

router.patch('/providers/:id/verify', asyncHandler(async (req, res) => {
  const { action } = req.body;
  const profile = await ProviderProfile.findByIdAndUpdate(
    req.params.id,
    { verificationStatus: action === 'approve' ? 'verified' : 'rejected' },
    { new: true }
  );
  res.json({ success: true, data: profile });
}));

router.get('/reports', asyncHandler(async (req, res) => {
  const reports = await Report.find()
    .populate('reporter', 'name email')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: reports });
}));

router.patch('/reports/:id', asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { status, adminNotes, resolvedBy: req.user._id },
    { new: true }
  );
  res.json({ success: true, data: report });
}));

router.get('/fraud/duplicates', asyncHandler(async (req, res) => {
  const duplicates = await User.aggregate([
    { $group: { _id: '$phone', count: { $sum: 1 }, users: { $push: { id: '$_id', name: '$name', email: '$email' } } } },
    { $match: { count: { $gt: 1 }, _id: { $ne: null, $ne: '' } } },
  ]);
  res.json({ success: true, data: duplicates });
}));

export default router;
