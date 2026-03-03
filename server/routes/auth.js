import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// ✅ REGISTER ROUTE
// ============================================
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (userExists) {
      return res.status(400).json({ 
        message: 'User already exists with this email or username' 
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password, // Make sure your User model hashes this
    });

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin || false,
        isBanned: user.isBanned || false,
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ============================================
// ✅ LOGIN ROUTE
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password (you need to implement this in your User model)
    const isMatch = await user.comparePassword?.(password) || (user.password === password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if banned
    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been banned' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin || false,
        isBanned: user.isBanned || false,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ============================================
// ✅ GET CURRENT USER
// ============================================
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// ✅ APPEAL ROUTE (your existing code)
// ============================================
router.post('/appeal', protect, async (req, res) => {
  try {
    const { reason, action } = req.body;
    const userId = req.user._id;

    if (action === 'get') {
      const user = await User.findById(userId);
      return res.json({
        isBanned: user.isBanned,
        appeal: user.appeal || { status: 'none' }
      });
    }

    if (action === 'submit') {
      if (!req.user.isBanned) {
        return res.status(400).json({ message: 'Only banned users can appeal' });
      }

      if (req.user.appeal?.status === 'pending') {
        return res.status(400).json({ message: 'You already have a pending appeal' });
      }

      if (!reason || reason.trim().length < 20) {
        return res.status(400).json({ message: 'Please provide a detailed reason (at least 20 characters)' });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        {
          appeal: {
            reason: reason.trim(),
            status: 'pending',
            submittedAt: new Date()
          }
        },
        { new: true }
      );

      console.log(`📋 Appeal submitted by ${user.username}`);

      return res.json({
        message: 'Appeal submitted! It will be auto-approved in 5 seconds.',
        appeal: user.appeal,
        secondsUntilReview: 5
      });
    }

    return res.status(400).json({ message: 'Invalid action' });

  } catch (error) {
    console.error('Appeal error:', error);
    res.status(500).json({ message: 'Failed to process appeal' });
  }
});

export default router;