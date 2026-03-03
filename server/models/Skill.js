import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true,
    maxlength: [100, 'Skill name must be at most 100 characters'],
  },
  level: {
    type: String,
    required: [true, 'Skill level is required'],
    enum: {
      values: ['Beginner', 'Intermediate', 'Advanced'],
      message: 'Level must be Beginner, Intermediate, or Advanced',
    },
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: [500, 'Description must be at most 500 characters'],
  },
  progress: {
    type: Number,
    default: 0,
    min: [0, 'Progress cannot be less than 0'],
    max: [100, 'Progress cannot be more than 100'],
  },
  skillType: {
    type: String,
    enum: {
      values: ['Offer', 'Seek'],
      message: 'Type must be Offer or Seek',
    },
    default: 'Offer',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

skillSchema.index({ user: 1 });
skillSchema.index({ skillType: 1 });
skillSchema.index({ createdAt: -1 });

export default mongoose.model('Skill', skillSchema);
