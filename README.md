# Converse Corner - Backend

Node.js/Express backend for the Converse Corner skill-sharing and messaging platform.

## 🚀 Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT (JSON Web Tokens)
- Socket.io (Real-time messaging)
- Multer (File uploads)
- Bcrypt (Password hashing)
- CORS

## 📁 Project Structure

server/
├── config/ # Configuration files
│ └── db.js # MongoDB connection
│
├── middleware/ # Custom middleware
│ └── auth.js # JWT verification
│
├── models/ # Mongoose models
│ ├── User.js # User schema
│ ├── Skill.js # Skill schema
│ ├── Message.js # Message schema
│ └── Report.js # Report schema
│
├── routes/ # API routes
│ ├── auth.js # Authentication routes
│ ├── users.js # User management
│ ├── skills.js # Skill CRUD
│ ├── messages.js # Messaging & file uploads
│ └── reports.js # Reporting system
│
├── uploads/ # PDF file storage
│
├── .env # Environment variables
├── .env.example # Environment variables template
└── index.js # Entry point


## ✨ Features

### 🔐 Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes middleware
- User registration and login
- Get current user endpoint

### 👥 User Management
- User profiles with username and email
- Admin role support
- Account ban/unban functionality
- Appeal system for banned users
- Auto-approve appeals after 5 seconds (testing mode)

### 🛠️ Skills API
- Create, read, and delete skills
- Skill types: Offer/Seek
- Skill levels: Beginner, Intermediate, Advanced
- Progress tracking percentage
- User-specific skill endpoints

### 💬 Messaging System
- Send and receive messages
- Conversation list with last message
- Unread message counting
- Real-time updates with Socket.io
- Typing indicators
- Message deletion

### 📄 PDF File Sharing
- Upload PDF files (max 10MB)
- Secure file storage in `/uploads`
- Download files with authentication
- File validation (PDF only)
- Filename sanitization

### 🚨 Reporting System
- Submit reports against users
- Include message context in reports
- View reports submitted by user
- View reports against user

### 👑 Admin Features
- Get all users
- Get single user details
- Update user information
- Ban/unban users
- Delete users
- System statistics

## 🔧 Installation

```bash
# Navigate to server folder
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your values
nano .env

# Start the server
npm run dev"# Converse_Corner" 
"# Converse_Corner" 
