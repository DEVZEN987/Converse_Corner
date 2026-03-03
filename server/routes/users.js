import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// GET all banned users
router.get('/banned', protect, adminOnly, async (req, res) => {
  try {
    const bannedUsers = await User.find({ isBanned: true })
      .select('username email bannedAt');
    res.json(bannedUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT unban a user
router.put('/unban/:userId', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, {
      isBanned: false,
      bannedAt: null
    });
    res.json({ message: 'User unbanned successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all users except current
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username email')
      .lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

export default router;