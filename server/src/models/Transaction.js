import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    provider:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    service:   { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    plan:      { type: String, required: true },
    amount:    { type: Number, required: true },   // in rupees
    currency:  { type: String, default: 'INR' },

    // Cashfree IDs
    cashfreeOrderId:   { type: String },   // order_id from Cashfree
    cashfreePaymentId: { type: String },   // cf_payment_id from Cashfree
    cashfreeSessionId: { type: String },   // payment_session_id for Cashfree JS SDK

    // Status — maps directly to Cashfree payment statuses
    status: {
      type:    String,
      enum:    ['pending', 'success', 'failed', 'cancelled', 'user_dropped'],
      default: 'pending',
    },
    failureReason: { type: String },
    isMock:        { type: Boolean, default: false },
  },
  { timestamps: true }
);

transactionSchema.index({ provider: 1, createdAt: -1 });
transactionSchema.index({ cashfreeOrderId: 1 }, { sparse: true });

export default mongoose.model('Transaction', transactionSchema);
