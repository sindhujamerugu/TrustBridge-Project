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
    .limit(50);

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
  const post = await CommunityPost.findById(req.params.id);
  if (!post) throw new AppError('Post not found', 404);

  post.answers.push({ author: req.user._id, content });
  await post.save();

  if (req.user.role === 'resident') {
    await ResidentProfile.findOneAndUpdate(
      { user: req.user._id },
      { $inc: { helpfulInteractions: 1, questionsAnswered: 1 } }
    );
    await updateTrustScore(req.user._id);
  }
  // Track activity
  await (await import('../models/User.js')).default
    .findByIdAndUpdate(req.user._id, { lastActiveAt: new Date() }).catch(() => {});

  const io = req.app.get('io');
  const notification = await createNotification(
    post.author, 'community', 'New Answer',
    `Someone answered your question: "${post.title}"`, `/community/${post._id}`
  );
  emitNotification(io, post.author.toString(), notification);

  const updated = await CommunityPost.findById(post._id)
    .populate('answers.author', 'name avatar role');

  res.json({ success: true, data: updated });
}));

router.patch('/:id/resolve', protect, asyncHandler(async (req, res) => {
  const post = await CommunityPost.findOne({ _id: req.params.id, author: req.user._id });
  if (!post) throw new AppError('Post not found', 404);
  post.isResolved = true;
  await post.save();
  res.json({ success: true, data: post });
}));

// ── Like / Unlike a post ─────────────────────────────────────────────────────
router.post('/:id/like', protect, asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) throw new AppError('Post not found', 404);

  const uid      = req.user._id.toString();
  const alreadyL = post.likes.map(l => l.toString()).includes(uid);

  if (alreadyL) {
    post.likes = post.likes.filter(l => l.toString() !== uid);  // unlike
  } else {
    post.likes.push(req.user._id);                               // like
    // Update helpfulVotes on the answer author's resident profile
    if (req.user.role === 'resident') {
      await ResidentProfile.findOneAndUpdate(
        { user: post.author },
        { $inc: { helpfulVotes: 1 } }
      ).catch(() => {});
    }
  }

  await post.save();
  res.json({ success: true, data: { liked: !alreadyL, count: post.likes.length } });
}));

// ── Like / Unlike an answer ──────────────────────────────────────────────────
router.post('/:id/answers/:answerId/like', protect, asyncHandler(async (req, res) => {
  const post   = await CommunityPost.findById(req.params.id);
  if (!post) throw new AppError('Post not found', 404);

  const answer = post.answers.id(req.params.answerId);
  if (!answer) throw new AppError('Answer not found', 404);

  const uid      = req.user._id.toString();
  const alreadyL = (answer.likes || []).map(l => l.toString()).includes(uid);

  if (alreadyL) {
    answer.likes = answer.likes.filter(l => l.toString() !== uid);
  } else {
    if (!answer.likes) answer.likes = [];
    answer.likes.push(req.user._id);
    // Credit the answer author's helpful votes
    await ResidentProfile.findOneAndUpdate(
      { user: answer.author },
      { $inc: { helpfulVotes: 1 } }
    ).catch(() => {});
  }

  await post.save();
  res.json({ success: true, data: { liked: !alreadyL, count: (answer.likes || []).length } });
}));

export default router;
