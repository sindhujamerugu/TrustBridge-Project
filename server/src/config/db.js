import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trustbridge';
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // fail fast with a clear error
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected');
  } catch (err) {
    const msg = err.message || String(err);
    if (msg.includes('Server selection timed out') || msg.includes('ECONNREFUSED')) {
      console.error('\n[DB] ❌ MongoDB connection failed.');
      console.error('[DB] Cause: Cannot reach MongoDB Atlas. Most common fix:');
      console.error('[DB]   1. Go to MongoDB Atlas → Network Access');
      console.error('[DB]   2. Add your current IP (or use 0.0.0.0/0 for dev)');
      console.error('[DB]   3. Check your cluster is not paused');
      console.error('[DB]   4. Verify your internet connection / VPN is not blocking port 27017\n');
    }
    throw err; // re-throw so the server exits cleanly
  }
};

export default connectDB;
