import express from 'express';
import mongoose from 'mongoose';
import Skill from '../models/Skill.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ============================================
// ROUTE 1: POST /api/skills - add a skill
// ============================================
router.post('/', protect, async (req, res) => {
  try {
    const { name, level, description, progress, skillType } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Skill name is required' });
    }
    if (!level || !['Beginner', 'Intermediate', 'Advanced'].includes(level)) {
      return res.status(400).json({ message: 'Level must be Beginner, Intermediate, or Advanced' });
    }
    
    const progressNum = Math.min(100, Math.max(0, parseInt(progress, 10) || 0));
    
    const skill = await Skill.create({
      name: name.trim(),
      level,
      description: (description || '').trim(),
      progress: progressNum,
      skillType: skillType || 'Offer',
      user: req.user._id,
    });
    
    // Populate the user field
    await skill.populate({
      path: 'user',
      select: 'username email name _id'
    });
    
    res.status(201).json(skill);
  } catch (error) {
    console.error('❌ Error creating skill:', error);
    res.status(500).json({ message: 'Failed to add skill', error: error.message });
  }
});

// ============================================
// ROUTE 2: GET /api/skills/my - user's skills
// ============================================
router.get('/my', protect, async (req, res) => {
  try {
    console.log('📥 Fetching skills for user:', req.user._id);
    
    const skills = await Skill.find({ user: req.user._id })
      .populate({
        path: 'user',
        select: 'username email name _id',
        model: User
      })
      .sort({ createdAt: -1 });
    
    console.log('✅ Found', skills.length, 'skills');
    res.json(skills);
  } catch (error) {
    console.error('❌ Error fetching user skills:', error);
    res.status(500).json({ message: 'Failed to fetch your skills', error: error.message });
  }
});

// ============================================
// ROUTE 3: GET /api/skills - list all skills
// ============================================
router.get('/', async (req, res) => {
  try {
    console.log('📥 Fetching all skills');
    
    const skills = await Skill.find()
      .populate({
        path: 'user',
        select: 'username email name _id',
        model: User
      })
      .sort({ createdAt: -1 })
      .limit(100);
    
    console.log('✅ Found', skills.length, 'total skills');
    
    // Debug: Check if user data is populated
    if (skills.length > 0) {
      console.log('First skill user data:', skills[0].user);
    }
    
    res.json(skills);
  } catch (error) {
    console.error('❌ Error fetching skills:', error);
    res.status(500).json({ message: 'Failed to fetch skills', error: error.message });
  }
});

// ============================================
// ROUTE 4: DELETE /api/skills/:id - delete skill
// ============================================
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid skill ID' });
    }
    
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }
    
    if (skill.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this skill' });
    }
    
    await skill.deleteOne();
    res.json({ message: 'Skill deleted' });
  } catch (error) {
    console.error('❌ Error deleting skill:', error);
    res.status(500).json({ message: 'Failed to delete skill', error: error.message });
  }
});

export default router;