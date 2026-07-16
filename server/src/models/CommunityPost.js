import mongoose from 'mongoose';

const communityPostSchema = new mongoose.Schema(
  {
    author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title:    { type: String, required: true },
    content:  { type: String, required: true },
    category: { type: String, default: 'general' },
    location: String,
    tags:     [String],
    likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    upvotes:  { type: Number, default: 0 },
    downvotes:{ type: Number, default: 0 },
    views:    { type: Number, default: 0 },
    isResolved: { type: Boolean, default: false },
    editedAt:   { type: Date },
    answers: [
      {
        author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content:    { type: String, required: true },
        isAccepted: { type: Boolean, default: false },
        likes:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        upvotes:    { type: Number, default: 0 },
        createdAt:  { type: Date, default: Date.now },
        editedAt:   { type: Date },
      },
    ],
  },
  { timestamps: true }
);

// ── Indexes for query performance ─────────────────────────────────────────────
communityPostSchema.index({ createdAt: -1 });           // default sort
communityPostSchema.index({ author: 1 });               // author lookups
communityPostSchema.index({ category: 1, createdAt: -1 }); // category filter
communityPostSchema.index({ location: 1 });             // location filter
communityPostSchema.index({ title: 'text', content: 'text' }); // text search

export default mongoose.model('CommunityPost', communityPostSchema);
