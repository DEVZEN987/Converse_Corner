import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/auth.js';
import Message from '../models/Message.js';

const router = express.Router();

// Multer storage for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${unique}-${file.originalname.replace(/\s+/g, '_')}`);
  },
});

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter: pdfFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// ✅ DOWNLOAD ROUTE MUST BE FIRST (before /:userId/:otherUserId)
// ✅ GET /api/messages/download/:filename — download PDF with forced download header
router.get('/download/:filename', protect, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'uploads', filename);

  // Set headers to force download instead of opening in browser
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(404).json({ message: 'File not found' });
    }
  });
});

// ✅ GET /api/messages/conversations
// Returns list of unique users you've chatted with
router.get('/conversations', protect, async (req, res) => {
  try {
    const myId = req.user.id;

    const messages = await Message.find({
      $or: [{ senderId: myId }, { receiverId: myId }],
    })
      .populate('senderId', 'username email')
      .populate('receiverId', 'username email')
      .sort({ createdAt: -1 });

    // Build conversation list
    const convMap = {};
    messages.forEach((msg) => {
      const other =
        msg.senderId._id.toString() === myId
          ? msg.receiverId
          : msg.senderId;

      const otherId = other._id.toString();
      if (!convMap[otherId]) {
        convMap[otherId] = {
          _id: otherId,
          username: other.username,
          email: other.email,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          isFromMe: msg.senderId._id.toString() === myId,
          unreadCount: 0,
        };
      }
      // Count unread
      if (!msg.isRead && msg.receiverId._id.toString() === myId) {
        convMap[otherId].unreadCount += 1;
      }
    });

    res.json(Object.values(convMap));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET /api/messages — all messages for current user
router.get('/', protect, async (req, res) => {
  try {
    const myId = req.user.id;
    const messages = await Message.find({
      $or: [{ senderId: myId }, { receiverId: myId }],
    })
      .populate('senderId', 'username email')
      .populate('receiverId', 'username email')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET /api/messages/:userId/:otherUserId — messages between two users (used by ChatWindows)
router.get('/:userId/:otherUserId', protect, async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const myId = req.user.id.toString();

    // Security: ensure the authenticated user is part of this conversation
    if (userId !== myId && otherUserId !== myId) {
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    })
      .populate('senderId', 'username email')
      .populate('receiverId', 'username email')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ POST /api/messages — send a message
router.post('/', protect, async (req, res) => {
  try {
    const { receiverId, content, skillId, attachmentUrl, attachmentName, attachmentType } = req.body;
    const message = new Message({
      senderId: req.user.id,
      receiverId,
      content: content || '',
      skillId: skillId || null,
      attachmentUrl: attachmentUrl || null,
      attachmentName: attachmentName || null,
      attachmentType: attachmentType || null,
    });
    await message.save();
    const populated = await message.populate('senderId receiverId', 'username email');
    
    // ✅ Emit to receiver via socket
    req.app.get('io')?.to(receiverId).emit('receive_message', populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ POST /api/messages/upload/pdf — upload a PDF attachment
router.post('/upload/pdf', protect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const publicUrl = `/uploads/${req.file.filename}`;

  res.status(201).json({
    url: publicUrl,
    originalName: req.file.originalname,
  });
});

// ✅ PATCH /api/messages/:id/read — mark as read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ DELETE /api/messages/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;