/**
 * One-time migration: reclassify all services with category "Clinics" → "Medical"
 *
 * Run once on the production database:
 *   node src/scripts/migrate-clinics-to-medical.js
 *
 * Safe to re-run — no-op if there are no Clinics services left.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trustbridge';

async function run() {
  console.log('[Migration] Connecting to MongoDB…');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('[Migration] Connected.');

  const result = await mongoose.connection
    .collection('services')
    .updateMany({ category: 'Clinics' }, { $set: { category: 'Medical' } });

  console.log(`[Migration] Done — matched: ${result.matchedCount}, updated: ${result.modifiedCount}`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('[Migration] Error:', err.message);
  process.exit(1);
});
