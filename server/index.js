import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import dotenv from "dotenv";


// Import Routes
import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/messages.js";
import skillRoutes from "./routes/skills.js";
import userRoutes from "./routes/users.js";
import reportRoutes from './routes/reports.js';

// Import Models
import User from './models/User.js';

dotenv.config();


const app = express();
const server = http.createServer(app);

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ======================================================
   ✅ GLOBAL CORS CONFIG — ALLOW FROM ANYWHERE
   ====================================================== */
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

/* ======================================================
   ✅ Serve Uploaded Files
   ====================================================== */
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

/* ======================================================
   ✅ SOCKET.IO WITH OPEN CORS
   ====================================================== */
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible in routes
app.set("io", io);

/* ======================================================
   ✅ Connect Database
   ====================================================== */
connectDB();

/* ======================================================
   ✅ Routes
   ====================================================== */
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/users", userRoutes);
app.use('/api/reports', reportRoutes);

/* ======================================================
   ✅ Health Check Route
   ====================================================== */
app.get("/", (req, res) => {
  res.json({ message: "✅ Converse Corner Server Running" });
});

/* ======================================================
   ✅ SOCKET.IO LOGIC
   ====================================================== */
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("join", (userId) => {
    if (!userId) return;
    socket.join(userId.toString());
    socket.data.userId = userId.toString();
    console.log(`✅ User ${userId} joined room`);
  });

  socket.on("register", (userId) => {
    socket.data.userId = userId;
    socket.join(userId.toString());
    console.log(`📌 Registered userId ${userId} to socket ${socket.id}`);
  });

  socket.on("typing", ({ receiverId, isTyping }) => {
    if (!receiverId) return;

    socket.to(receiverId.toString()).emit("typing", {
      senderId: socket.data.userId || null,
      isTyping,
    });
  });

  socket.on("disconnect", (reason) => {
    console.log(`🔴 Socket disconnected: ${socket.id} — ${reason}`);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket error:", err.message);
  });
});

/* ======================================================
   ✅ AUTO-APPROVE APPEALS AFTER 5 SECONDS (FOR TESTING)
   ====================================================== */
const checkAndApproveAppeals = async () => {
  try {
    const fiveSecondsAgo = new Date(Date.now() - 5 * 1000); // ✅ 5 SECONDS

    const users = await User.find({
      'appeal.status': 'pending',
      'appeal.submittedAt': { $lt: fiveSecondsAgo }
    });

    for (let user of users) {
      // Auto-approve
      user.isBanned = false;
      user.bannedAt = null;
      user.appeal.status = 'approved';
      user.appeal.reviewedAt = new Date();
      user.appeal.adminResponse = 'Your appeal was automatically approved after 5 seconds.';

      await user.save();

      console.log(`✅ AUTO-APPROVED: ${user.username} unbanned after 5 seconds`);

      // Kick them out if they're currently online so they can login fresh
      if (io) {
        io.to(user._id.toString()).emit('kicked', {
          message: 'Your appeal has been approved! Please login again.',
          reason: 'appeal_approved'
        });
      }
    }
  } catch (error) {
    console.error('Error checking appeals:', error);
  }
};

// ✅ RUN EVERY 5 SECONDS (FOR TESTING)
setInterval(checkAndApproveAppeals, 5 * 1000); // Every 5 seconds

// Run once on startup
checkAndApproveAppeals();

console.log('✅ Appeal auto-approval system started (5 second testing mode)');

/* ======================================================
   ✅ GLOBAL ERROR HANDLER
   ====================================================== */
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

/* ======================================================
   ✅ START SERVER
   ====================================================== */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("🌍 CORS: Allowing requests from any origin");
});
