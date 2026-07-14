/**
 * One-time migration: recalculate questionsAnswered for every ResidentProfile
 * by counting answers they have actually written in CommunityPost.answers[].
 *
 * Run once:
 *   node src/scripts/recalc-questions-answered.js
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import CommunityPost from '../models/CommunityPost.js';
import ResidentProfile from '../models/ResidentProfile.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trustbridge');
  console.log('[Recalc] Connected.');

  // Aggregate: for each user, count how many answers they have written
  const posts = await CommunityPost.find({}, 'answers').lean();

  const counts = {}; // userId → answerCount
  for (const post of posts) {
    for (const ans of post.answers || []) {
      const uid = String(ans.author);
      if (!uid || uid === 'null' || uid === 'undefined') continue;
      counts[uid] = (counts[uid] || 0) + 1;
    }
  }

  let updated = 0;
  for (const [userId, answerCount] of Object.entries(counts)) {
    const result = await ResidentProfile.findOneAndUpdate(
      { user: userId },
      { $set: { questionsAnswered: answerCount } }
    );
    if (result) {
      console.log(`[Recalc] ${result.fullName || userId} → questionsAnswered = ${answerCount}`);
      updated++;
    }
  }

  // Zero-out profiles for users who have no answers (in case they had stale counts)
  const allProfiles = await ResidentProfile.find({}, 'user questionsAnswered').lean();
  for (const p of allProfiles) {
    const uid = String(p.user);
    if (!counts[uid] && (p.questionsAnswered || 0) > 0) {
      await ResidentProfile.findByIdAndUpdate(p._id, { $set: { questionsAnswered: 0 } });
      console.log(`[Recalc] Zeroed: ${uid}`);
    }
  }

  console.log(`\n[Recalc] Done — updated ${updated} profiles.`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
