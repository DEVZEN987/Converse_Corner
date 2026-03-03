# Converse Corner - Frontend

React-based frontend for the Converse Corner skill-sharing and messaging platform.

## 🚀 Tech Stack

- React 18
- Vite (Build tool)
- React Router v6 (Routing)
- Context API (State management)
- Axios (HTTP requests)
- Socket.io-client (Real-time messaging)
- CSS Modules / Tailwind (Styling)

## 📁 Project Structure

client/
├── public/ # Static assets
├── src/
│ ├── components/ # Reusable UI components
│ │ ├── ChatWindow.jsx
│ │ ├── Layout.jsx
│ │ ├── Navbar.jsx
│ │ ├── ProtectedRoute.jsx
│ │ ├── ReportModal.jsx
│ │ └── SkillCard.jsx
│ │
│ ├── context/ # Context providers
│ │ ├── AuthContext.jsx # Authentication state
│ │ └── SocketContext.jsx # Socket.io connection
│ │
│ ├── lib/ # API configuration
│ │ └── api.js # Axios instance with interceptors
│ │
│ ├── pages/ # Page components
│ │ ├── About.jsx
│ │ ├── AddSkill.jsx
│ │ ├── BrowseSkill.jsx
│ │ ├── Dashboard.jsx
│ │ ├── Home.jsx
│ │ ├── Login.jsx
│ │ ├── Messages.jsx
│ │ ├── Profile.jsx
│ │ └── Register.jsx
│ │
│ ├── App.css
│ ├── App.jsx # Main app with routes
│ ├── index.css
│ └── main.jsx # Entry point
│
├── .env.example # Environment variables template
├── index.html
└── package.json


## ✨ Features

### 👤 Authentication
- JWT-based authentication
- Login/Register pages
- Protected routes for authenticated users
- Auto token attachment to requests
- Token expiry handling with auto-redirect

### 💬 Real-time Messaging
- Socket.io integration for instant messages
- Conversation list with last message preview
- Typing indicators
- Message timestamps in IST
- Delete messages
- PDF file sharing in chats

### 🛠️ Skills Management
- Add skills with title, level, and type (Offer/Seek)
- Track learning progress with percentage
- Delete own skills
- Browse all skills from other users

### 📊 Dashboard
- Overview of user's skills with progress bars
- Recent messages preview
- Quick actions for adding skills

### 📄 PDF Sharing
- Upload PDF files up to 10MB
- Download PDFs with authentication
- PDF preview in messages

### 🚨 Reporting System
- Report users with message context
- Modal interface for submitting reports

## 🔧 Installation

```bash
# Navigate to client folder
cd client

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev