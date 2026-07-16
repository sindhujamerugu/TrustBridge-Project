import express from 'express';
import CommunityPost from '../models/CommunityPost.js';
import ResidentProfile from '../models/ResidentProfile.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../utils/AppError.js';
import { createNotification, emitNotification } from '../utils/notifications.js';
import { updateTrustScore } from '../utils/trustScore.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const { location, category, search } = req.query;
  const filter = {};
  // Escape user input before building regex to prevent ReDoS
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (location) filter.location = new RegExp(esc(location), 'i');
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { title:   new RegExp(esc(search), 'i') },
      { content: new RegExp(esc(search), 'i') },
    ];
  }

  const posts = await CommunityPost.find(filter)
    .populate('author', 'name avatar role')
    .populate('answers.author', 'name avatar role')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();  // lean() returns plain JS objects — 2-3x faster, less memory

  res.json({ success: true, data: posts });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const post = await CommunityPost.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate('author', 'name avatar role')
    .populate('answers.author', 'name avatar role');
  if (!post) throw new AppError('Post not found', 404);
  res.json({ success: true, data: post });
}));

router.post('/', protect, asyncHandler(async (req, res) => {
  const { title, content, category, location, tags } = req.body;
  const post = await CommunityPost.create({
    author: req.user._id,
    title,
    content,
    category,
    location,
    tags,
  });

  if (req.user.role === 'resident') {
    await ResidentProfile.findOneAndUpdate(
      { user: req.user._id },
      { $inc: { communityPosts: 1 } }
    );
    await updateTrustScore(req.user._id);
  }
  // Track activity
  await (await import('../models/User.js')).default
    .findByIdAndUpdate(req.user._id, { lastActiveAt: new Date() }).catch(() => {});

  res.status(201).json({ success: true, data: post });
}));

router.post('/:id/answers', protect, asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) throw new AppError('Content is required', 400);

  // Use $push atomically — avoids race condition from findById + save pattern
  // The populated response is fetched in a single additional query
  const updated = await CommunityPost.findByIdAndUpdate(
    req.params.id,
    { $push: { answers: { author: req.user._id, content: String(content).trim() } } },
    { new: true }
  ).populate('answers.author', 'name avatar role');

  if (!updated) throw new AppError('Post not found', 404);

  // Non-critical side effects — run in background, do not block response
  if (req.user.role === 'resident') {
    ResidentProfile.findOneAndUpdate(
      { user: req.user._id },
      { $inc: { helpfulInteractions: 1, questionsAnswered: 1 } }
    ).catch(() => {});
    updateTrustScore(req.user._id).catch(() => {});
  }
  import('../models/User.js').then(({ default: User }) =>
    User.findByIdAndUpdate(req.user._id, { lastActiveAt: new Date() }).catch(() => {})
  );

  const io = req.app.get('io');
  createNotification(
    updated.author, 'community', 'New Answer',
    `Someone answered your question: "${updated.title}"`, `/community/${updated._id}`
  ).then(notification => {
    emitNotification(io, updated.author.toString(), notification);
  }).catch(() => {});

  res.json({ success: true, data: updated });
}));

router.patch('/:id/resolve', protect, asyncHandler(async (req, res) => {
  const post = await CommunityPost.findOne({ _id: req.params.id, author: req.user._id });
  if (!post) throw new AppError('Post not found', 404);
  post.isResolved = true;
  await post.save();
  res.json({ success: true, data: post });
}));

// ── Edit a question (author only) ─────────────────────────────────────────────
router.patch('/:id', protect, asyncHandler(async (req, res) => {
  const post = await CommunityPost.findOne({ _id: req.params.id, author: req.user._id });
  if (!post) throw new AppError('Post not found or not authorized', 404);
  const { title, content, category, location } = req.body;
  if (title)    post.title    = String(title).trim();
  if (content)  post.content  = String(content).trim();
  if (category) post.category = String(category).trim();
  if (location !== undefined) post.location = String(location).trim();
  post.editedAt = new Date();
  await post.save();
  const updated = await CommunityPost.findById(post._id)
    .populate('author', 'name avatar role')
    .populate('answers.author', 'name avatar role');
  res.json({ success: true, data: updated });
}));

// ── Delete a question (author only) ──────────────────────────────────────────
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const post = await CommunityPost.findOneAndDelete({ _id: req.params.id, author: req.user._id });
  if (!post) throw new AppError('Post not found or not authorized', 404);
  res.json({ success: true });
}));

// ── Edit an answer (author only) ─────────────────────────────────────────────
router.patch('/:id/answers/:answerId', protect, asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) throw new AppError('Post not found', 404);
  const answer = post.answers.id(req.params.answerId);
  if (!answer) throw new AppError('Answer not found', 404);
  if (answer.author.toString() !== req.user._id.toString())
    throw new AppError('Not authorized', 403);
  const { content } = req.body;
  if (!content?.trim()) throw new AppError('Content is required', 400);
  answer.content   = String(content).trim();
  answer.editedAt  = new Date();
  await post.save();
  const updated = await CommunityPost.findById(post._id)
    .populate('author', 'name avatar role')
    .populate('answers.author', 'name avatar role');
  res.json({ success: true, data: updated });
}));

// ── Delete an answer (author only) ───────────────────────────────────────────
router.delete('/:id/answers/:answerId', protect, asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) throw new AppError('Post not found', 404);
  const answer = post.answers.id(req.params.answerId);
  if (!answer) throw new AppError('Answer not found', 404);
  if (answer.author.toString() !== req.user._id.toString())
    throw new AppError('Not authorized', 403);
  answer.deleteOne();
  await post.save();
  res.json({ success: true });
}));

// ── Like / Unlike a post — atomic to prevent race conditions ─────────────────
router.post('/:id/like', protect, asyncHandler(async (req, res) => {
  const uid = req.user._id;

  // Check current like state atomically before deciding add or remove
  const existing = await CommunityPost.findOne(
    { _id: req.params.id, likes: uid },
    { _id: 1 }
  ).lean();

  let updated;
  if (existing) {
    // Already liked — remove ($pull is atomic, safe for concurrency)
    updated = await CommunityPost.findByIdAndUpdate(
      req.params.id,
      { $pull: { likes: uid } },
      { new: true, select: 'likes' }
    );
    res.json({ success: true, data: { liked: false, count: updated ? updated.likes.length : 0 } });
  } else {
    // Not liked — add ($addToSet prevents duplicates even under concurrent requests)
    updated = await CommunityPost.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { likes: uid } },
      { new: true, select: 'likes author' }
    );
    if (!updated) throw new AppError('Post not found', 404);
    // Credit helpful votes (non-critical, fire-and-forget)
    if (req.user.role === 'resident') {
      ResidentProfile.findOneAndUpdate(
        { user: updated.author },
        { $inc: { helpfulVotes: 1 } }
      ).catch(() => {});
    }
    res.json({ success: true, data: { liked: true, count: updated.likes.length } });
  }
}));

// ── Like / Unlike an answer — atomic to prevent race conditions ───────────────
router.post('/:id/answers/:answerId/like', protect, asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const { id, answerId } = req.params;

  // Check if already liked (atomic read)
  const existing = await CommunityPost.findOne(
    { _id: id, 'answers._id': answerId, 'answers.likes': uid },
    { _id: 1 }
  ).lean();

  let updated;
  if (existing) {
    // Remove like atomically
    updated = await CommunityPost.findOneAndUpdate(
      { _id: id, 'answers._id': answerId },
      { $pull: { 'answers.$.likes': uid } },
      { new: true, select: 'answers.$' }
    );
    const ans = updated?.answers?.[0];
    res.json({ success: true, data: { liked: false, count: ans?.likes?.length ?? 0 } });
  } else {
    // Add like atomically — $addToSet prevents duplicates
    updated = await CommunityPost.findOneAndUpdate(
      { _id: id, 'answers._id': answerId },
      { $addToSet: { 'answers.$.likes': uid } },
      { new: true, select: 'answers.$' }
    );
    if (!updated) throw new AppError('Answer not found', 404);
    const ans = updated.answers?.[0];
    // Credit helpful votes (non-critical)
    if (ans?.author) {
      ResidentProfile.findOneAndUpdate(
        { user: ans.author },
        { $inc: { helpfulVotes: 1 } }
      ).catch(() => {});
    }
    res.json({ success: true, data: { liked: true, count: ans?.likes?.length ?? 0 } });
  }
}));

export default router;
