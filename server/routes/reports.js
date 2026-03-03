import express from 'express';
import { protect } from '../middleware/auth.js';
import Report from '../models/Report.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { reportedUserId, reason, description, messageIds } = req.body;
    const reporterId = req.user._id;

    // Prevent self-reporting
    if (reportedUserId === reporterId) {
      return res.status(400).json({ message: 'Cannot report yourself' });
    }

    // Verify messages
    let validMessages = [];
    if (messageIds && messageIds.length > 0) {
      validMessages = await Message.find({
        _id: { $in: messageIds },
        $or: [
          { senderId: reporterId, receiverId: reportedUserId },
          { senderId: reportedUserId, receiverId: reporterId }
        ]
      }).select('_id');
    }

    // Save report
    const report = new Report({
      reporterId,
      reportedUserId,
      reason,
      description,
      messages: validMessages.map(m => m._id)
    });

    await report.save();

    // ✅ Ban user immediately
    await User.findByIdAndUpdate(reportedUserId, {
      isBanned: true,
      bannedAt: new Date()
    });

    console.log(`✅ User ${reportedUserId} banned for: ${reason}`);

    // ✅ IMMEDIATELY KICK OUT - NO ALERT
    const io = req.app.get('io');
    if (io) {
      console.log(`🔌 Immediately disconnecting user: ${reportedUserId}`);
      
      // Get all sockets and disconnect the reported user
      const sockets = await io.fetchSockets();
      for (let socket of sockets) {
        if (socket.data.userId === reportedUserId.toString()) {
          console.log(`🔴 Force disconnecting socket: ${socket.id}`);
          
          // Send kick event BEFORE disconnecting
          socket.emit('kicked', {
            message: 'You have been removed from the platform.',
            reason: reason
          });
          
          // Immediately disconnect
          socket.disconnect(true);
        }
      }
    }

    res.status(201).json({ 
      message: 'Report submitted successfully.',
      reportId: report._id 
    });

  } catch (err) {
    console.error('❌ Report error:', err);
    res.status(500).json({ message: 'Failed to submit report' });
  }
});

router.get('/my-reports', protect, async (req, res) => {
  try {
    const reports = await Report.find({ reporterId: req.user._id })
      .populate('reportedUserId', 'username email')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/against-me', protect, async (req, res) => {
  try {
    const reports = await Report.find({ reportedUserId: req.user._id })
      .populate('reporterId', 'username email')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;