import mongoose from 'mongoose';

const providerProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true },
    fullName: { type: String, required: true },
    phone:   { type: String, default: '' },
    address: { type: String, default: '' },
    aadhaarNumber: { type: String, select: false },
    gstNumber: String,
    documents: {
      aadhaar: String,
      gstCertificate: String,
      businessLicense: String,
    },
    ocrExtracted: {
      name: String,
      gstNumber: String,
      businessName: String,
    },
    verificationScore: { type: Number, default: 0 },
    verificationStatus: {
      type: String,
      enum: ['pending', 'auto_approved', 'manual_review', 'rejected', 'verified'],
      default: 'pending',
    },
    subscription: {
      plan: { type: String, enum: ['none', 'basic', 'premium', 'enterprise'], default: 'none' },
      status: { type: String, enum: ['inactive', 'active', 'expired'], default: 'inactive' },
      startDate: Date,
      endDate: Date,
      razorpaySubscriptionId: String,
    },
    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('ProviderProfile', providerProfileSchema);
