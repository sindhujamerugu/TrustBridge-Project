import express from 'express';
import crypto from 'crypto';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import ProviderProfile from '../models/ProviderProfile.js';
import Service from '../models/Service.js';
import Transaction from '../models/Transaction.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../utils/AppError.js';
import { createNotification, emitNotification } from '../utils/notifications.js';

const router = express.Router();

export const PLANS = {
  basic:      { name: 'Basic',      price: 8,  duration: 30, features: ['Service listing', 'Standard visibility', 'Email support', 'Up to 5 bookings/month'] },
  growth:     { name: 'Growth',     price: 10, duration: 30, features: ['Priority listing', 'Analytics dashboard', 'Featured badge', 'Unlimited bookings', 'Phone support'] },
  premium:    { name: 'Premium',    price: 15, duration: 30, features: ['Top placement', 'Unlimited bookings', 'Premium support', 'Featured badge', 'Advanced analytics', 'Custom profile page'] },
  enterprise: { name: 'Enterprise', price: 20, duration: 30, features: ['Top placement', 'Promotional features', 'Advanced analytics'] },
};

// cashfree-pg v6: Cashfree is a CLASS, not a static singleton.
// Must use: new Cashfree(CFEnvironment, clientId, secret)
// Then call instance methods: cf.PGCreateOrder(), cf.PGOrderFetchPayments()
function getCashfree() {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  const envStr = (process.env.CASHFREE_ENV || 'TEST').toUpperCase();

  console.log('[Payment] getCashfree clientId=' + (clientId ? clientId.substring(0, 10) + '...' : 'MISSING') + ' env=' + envStr);

  if (!clientId || !clientSecret) {
    console.warn('[Payment] Cashfree credentials missing - MOCK mode');
    return null;
  }

  const cfEnv = envStr === 'PROD' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
  const cf = new Cashfree(cfEnv, clientId, clientSecret);
  console.log('[Payment] Cashfree instance created OK');
  return cf;
}

router.get('/plans', (req, res) => {
  res.json({ success: true, data: PLANS });
});

router.post('/create-order', protect, authorize('provider'), asyncHandler(async (req, res) => {
  const { plan, serviceId } = req.body;
  if (!PLANS[plan]) throw new AppError('Invalid plan', 400);

  const planDetails = PLANS[plan];
  const cf = getCashfree();

  const txn = await Transaction.create({
    provider: req.user._id,
    service: serviceId || null,
    plan,
    amount: planDetails.price,
    status: 'pending',
    isMock: !cf,
  });

  console.log('[Payment] Transaction ' + txn._id + ' plan=' + plan + ' mock=' + !cf);

  if (!cf) {
    txn.cashfreeOrderId = 'mock_order_' + Date.now();
    await txn.save();
    return res.json({
      success: true,
      data: { orderId: txn.cashfreeOrderId, sessionId: null, amount: planDetails.price, currency: 'INR', plan, mock: true, transactionId: txn._id },
    });
  }

  const orderId = 'TB_' + txn._id;
  const orderRequest = {
    order_id: orderId,
    order_amount: planDetails.price,
    order_currency: 'INR',
    customer_details: {
      customer_id: req.user._id.toString(),
      customer_email: req.user.email,
      customer_phone: req.user.phone || '9999999999',
      customer_name: req.user.name || 'TrustBridge User',
    },
    order_meta: { notify_url: process.env.SERVER_URL + '/api/payments/webhook' },
    order_note: 'TrustBridge ' + planDetails.name + ' subscription',
  };

  console.log('[Payment] Calling cf.PGCreateOrder for order ' + orderId);
  console.log('[Payment] orderRequest:', JSON.stringify(orderRequest, null, 2));

  let cfOrder;
  try {
    const response = await cf.PGCreateOrder(orderRequest);
    cfOrder = response.data;
    console.log('[Payment] PGCreateOrder OK order_id=' + cfOrder.order_id + ' session=' + cfOrder.payment_session_id);
  } catch (err) {
    const cfErr = err.response ? JSON.stringify(err.response.data) : err.message;
    console.error('[Payment] PGCreateOrder failed:', cfErr);
    throw new AppError('Cashfree order creation failed: ' + cfErr, 502);
  }

  txn.cashfreeOrderId = cfOrder.order_id;
  await txn.save();

  res.json({
    success: true,
    data: { orderId: cfOrder.order_id, sessionId: cfOrder.payment_session_id, amount: planDetails.price, currency: 'INR', plan, mock: false, transactionId: txn._id, cashfreeEnv: (process.env.CASHFREE_ENV || 'TEST').toUpperCase() === 'PROD' ? 'production' : 'sandbox' },
  });
}));

router.post('/verify', protect, authorize('provider'), asyncHandler(async (req, res) => {
  const { plan, transactionId, orderId, mock } = req.body;
  if (!PLANS[plan]) throw new AppError('Invalid plan', 400);

  const txn = await Transaction.findById(transactionId);
  if (!txn) throw new AppError('Transaction not found', 404);
  if (txn.provider.toString() !== req.user._id.toString()) throw new AppError('Unauthorized', 403);

  const cf = getCashfree();

  if (mock === true || !cf) {
    console.log('[Payment] Mock verify - activating directly');
    txn.status = 'success';
    txn.cashfreePaymentId = 'mock_pay_' + Date.now();
    await txn.save();
  } else {
    const cfOrderId = txn.cashfreeOrderId || orderId;
    console.log('[Payment] Verify — orderId from body:', orderId);
    console.log('[Payment] Verify — txn.cashfreeOrderId:', txn.cashfreeOrderId);
    console.log('[Payment] Verify — using cfOrderId:', cfOrderId);
    let payments;
    try {
      const response = await cf.PGOrderFetchPayments(cfOrderId);
      payments = response.data;
    } catch (err) {
      const cfErr = err.response ? JSON.stringify(err.response.data) : err.message;
      throw new AppError('Could not verify payment: ' + cfErr, 502);
    }

    const successPay = Array.isArray(payments) ? payments.find(p => p.payment_status === 'SUCCESS') : null;
    if (!successPay) {
      const statuses = Array.isArray(payments) ? payments.map(p => p.payment_status).join(', ') : 'none';
      txn.status = 'failed';
      txn.failureReason = 'No successful payment. Statuses: ' + statuses;
      await txn.save();
      throw new AppError('Payment not completed. Status: ' + statuses, 402);
    }

    txn.cashfreePaymentId = String(successPay.cf_payment_id);
    txn.status = 'success';
    await txn.save();
    console.log('[Payment] Verified OK cf_payment_id=' + successPay.cf_payment_id);
  }

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + PLANS[plan].duration * 24 * 60 * 60 * 1000);
  const profile = await ProviderProfile.findOneAndUpdate(
    { user: req.user._id },
    { subscription: { plan, status: 'active', startDate, endDate, transactionId: txn._id } },
    { new: true, upsert: true }
  );

  if (txn.service) {
    const svc = await Service.findById(txn.service);
    if (svc && svc.docVerification && svc.docVerification.identityPassed) {
      svc.isVisible = true;
      svc.isFeatured = ['premium', 'enterprise', 'growth'].includes(plan);
      svc.workflowStatus = 'published';
      await svc.save();
    }
  }

  const io = req.app.get('io');
  const notification = await createNotification(req.user._id, 'subscription', 'Subscription Activated', 'Your ' + PLANS[plan].name + ' plan is now active!', '/dashboard/provider');
  emitNotification(io, req.user._id.toString(), notification);
  console.log('[Payment] Subscription activated plan=' + plan);
  res.json({ success: true, data: { profile, transaction: txn } });
}));

router.post('/webhook', asyncHandler(async (req, res) => {
  const event = req.body;
  if (event.type === 'PAYMENT_SUCCESS_WEBHOOK') {
    const cfOrderId = event.data && event.data.order && event.data.order.order_id;
    if (cfOrderId) {
      const txn = await Transaction.findOne({ cashfreeOrderId: cfOrderId });
      if (txn && txn.status !== 'success') {
        txn.status = 'success';
        txn.cashfreePaymentId = String(event.data.payment && event.data.payment.cf_payment_id || '');
        await txn.save();
      }
    }
  }
  res.status(200).json({ received: true });
}));

router.post('/failure', protect, authorize('provider'), asyncHandler(async (req, res) => {
  const { transactionId, reason } = req.body;
  if (transactionId) await Transaction.findByIdAndUpdate(transactionId, { status: 'failed', failureReason: reason || 'User cancelled' });
  res.json({ success: true });
}));

router.get('/subscription', protect, authorize('provider'), asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id });
  if (profile && profile.subscription && profile.subscription.endDate && new Date(profile.subscription.endDate) < new Date()) {
    profile.subscription.status = 'expired';
    await profile.save();
    await Service.updateMany({ provider: req.user._id }, { isVisible: false, isFeatured: false });
  }
  res.json({ success: true, data: profile && profile.subscription, plans: PLANS });
}));

router.get('/history', protect, authorize('provider'), asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ provider: req.user._id }).sort({ createdAt: -1 }).limit(20).populate('service', 'title');
  res.json({ success: true, data: transactions });
}));

export default router;